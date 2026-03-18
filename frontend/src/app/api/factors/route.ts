import { NextRequest, NextResponse } from "next/server";
import { generateFactors, type Factor } from "@/lib/factorEngine";

const cache = new Map<string, { factors: Factor[]; ts: number }>();
const TTL = 60 * 60 * 1000; // 1 hour

export async function GET(req: NextRequest) {
  const question = req.nextUrl.searchParams.get("question") || "";
  const category = req.nextUrl.searchParams.get("category") || "";

  if (!question) {
    return NextResponse.json({ factors: generateFactors("", category), source: "keyword" });
  }

  // Check cache
  const cacheKey = question.trim().toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json({ factors: cached.factors, source: "llm" });
  }

  // Try LLM
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const key = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (!endpoint || !key || !deployment) {
    return NextResponse.json({ factors: generateFactors(question, category), source: "keyword" });
  }

  try {
    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-10-21`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": key },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are an expert analyst. Given a prediction market question, generate exactly 5 factors that would influence the outcome. Each factor should be specific to this exact question, not generic.

Return JSON array with exactly 5 objects:
[{ "name": "specific factor name", "description": "one sentence explaining what this measures and why it matters", "weight": 0.15-0.25 }]

Weights must sum to 1.0. Assign higher weights to more impactful factors.
Only return the JSON array, nothing else.`,
          },
          { role: "user", content: question },
        ],
        temperature: 0.3,
        max_completion_tokens: 4000,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error(`Azure OpenAI error: ${res.status}`);
      return NextResponse.json({ factors: generateFactors(question, category), source: "keyword" });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Empty response");

    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed) || parsed.length !== 5) throw new Error("Invalid format");

    // Validate structure
    for (const f of parsed) {
      if (typeof f.name !== "string" || typeof f.description !== "string" || typeof f.weight !== "number") {
        throw new Error("Invalid factor structure");
      }
    }

    // Normalize weights
    const total = parsed.reduce((s: number, f: Factor) => s + f.weight, 0);
    const factors: Factor[] = parsed.map((f: Factor) => ({
      name: f.name,
      description: f.description,
      weight: Math.round((f.weight / total) * 100) / 100,
    }));
    const sum = factors.reduce((s, f) => s + f.weight, 0);
    if (sum !== 1) {
      factors[0].weight = Math.round((factors[0].weight + (1 - sum)) * 100) / 100;
    }

    cache.set(cacheKey, { factors, ts: Date.now() });
    return NextResponse.json({ factors, source: "llm" });
  } catch (err) {
    console.error("LLM factor generation failed:", err);
    return NextResponse.json({ factors: generateFactors(question, category), source: "keyword" });
  }
}
