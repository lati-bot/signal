export interface Factor {
  name: string;
  description: string;
  weight: number;
}

interface TopicMatch {
  factors: Factor[];
  priority: number;
}

const PEOPLE_NAMES = [
  "trump", "biden", "harris", "desantis", "newsom", "obama", "pence",
  "powell", "yellen", "musk", "bezos", "zuckerberg", "altman", "modi",
  "xi", "putin", "zelensky", "netanyahu", "starmer", "macron", "trudeau",
];

const TOPIC_RULES: { test: (q: string) => boolean; factors: Factor[] }[] = [
  {
    test: (q) => PEOPLE_NAMES.some((n) => q.includes(n)),
    factors: [
      { name: "Public Statements", description: "Recent public positions and rhetoric from the named individual", weight: 0.20 },
      { name: "Legal Exposure", description: "Ongoing or potential legal proceedings affecting the outcome", weight: 0.25 },
      { name: "Approval Rating", description: "Current favorability and trend direction", weight: 0.20 },
    ],
  },
  {
    test: (q) => /\b(fed|interest rate|rate cut|rate hike|monetary|fomc|central bank)\b/.test(q),
    factors: [
      { name: "CPI/Inflation Data", description: "Latest inflation readings and trend vs. Fed target", weight: 0.25 },
      { name: "Employment Numbers", description: "Jobs report, unemployment claims, and labor market tightness", weight: 0.20 },
      { name: "FOMC Minutes Tone", description: "Hawkish vs. dovish language in recent Fed communications", weight: 0.20 },
      { name: "Market Futures Pricing", description: "What fed funds futures imply about the next move", weight: 0.20 },
    ],
  },
  {
    test: (q) => /\b(election|vote|ballot|win .*(house|senate|presidency)|democrat|republican|gop|midterm|primary|caucus)\b/.test(q),
    factors: [
      { name: "Polling Averages", description: "Aggregate polling data from major forecasters", weight: 0.25 },
      { name: "Fundraising Gap", description: "Campaign finance advantage or deficit", weight: 0.20 },
      { name: "Voter Registration Trends", description: "Shifts in registered voter composition", weight: 0.15 },
      { name: "Historical Precedent", description: "How similar races have played out in past cycles", weight: 0.20 },
    ],
  },
  {
    test: (q) => /\b(bitcoin|btc|ethereum|eth|crypto|solana|sol|defi|nft|token)\b/.test(q),
    factors: [
      { name: "Price Momentum", description: "Current trend direction and strength on major timeframes", weight: 0.25 },
      { name: "Regulatory Action", description: "SEC, CFTC, or global regulatory moves affecting crypto", weight: 0.20 },
      { name: "Institutional Flows", description: "ETF inflows, corporate treasury buys, and fund allocations", weight: 0.20 },
      { name: "Network Activity", description: "On-chain metrics like active addresses and transaction volume", weight: 0.15 },
    ],
  },
  {
    test: (q) => /\b(game|match|championship|playoff|season|bowl|cup|league|team|nba|nfl|mlb|nhl|ufc|atp|wta|fifa)\b/.test(q),
    factors: [
      { name: "Recent Form", description: "Win/loss record and performance trend over last 5-10 games", weight: 0.25 },
      { name: "Injury Reports", description: "Key player availability and fitness status", weight: 0.25 },
      { name: "Head-to-Head Record", description: "Historical matchup results between these opponents", weight: 0.20 },
      { name: "Home/Away Advantage", description: "Venue factor and travel considerations", weight: 0.15 },
    ],
  },
  {
    test: (q) => /\b(war|invasion|conflict|military|troops|nato|sanctions|ceasefire|nuclear|missile)\b/.test(q),
    factors: [
      { name: "Diplomatic Activity", description: "Active negotiations, summits, or diplomatic channels", weight: 0.25 },
      { name: "Military Positioning", description: "Troop movements, deployments, and escalation signals", weight: 0.25 },
      { name: "Sanctions Pressure", description: "Economic pressure from existing or threatened sanctions", weight: 0.20 },
      { name: "Allied Response", description: "Coordination and commitment level among allied nations", weight: 0.15 },
    ],
  },
  {
    test: (q) => /\b(ai|artificial intelligence|gpt|llm|openai|google|apple|microsoft|meta|amazon|tesla|earnings|ipo|stock)\b/.test(q),
    factors: [
      { name: "Earnings/Revenue", description: "Recent financial performance and forward guidance", weight: 0.25 },
      { name: "Product Launches", description: "Upcoming releases and competitive product positioning", weight: 0.20 },
      { name: "Competitive Landscape", description: "Market share shifts and competitor moves", weight: 0.20 },
      { name: "Regulatory Scrutiny", description: "Antitrust, data privacy, or sector-specific regulation risk", weight: 0.15 },
    ],
  },
  {
    test: (q) => /\b(bill|legislation|congress|senate vote|house vote|law|act|amendment|committee|filibuster)\b/.test(q),
    factors: [
      { name: "Committee Status", description: "Whether the bill has cleared committee markup", weight: 0.20 },
      { name: "Sponsor Count", description: "Number of co-sponsors and bipartisan support", weight: 0.20 },
      { name: "Party Support", description: "Whip counts and caucus positions on the legislation", weight: 0.25 },
      { name: "Presidential Position", description: "Whether the president supports, opposes, or is neutral", weight: 0.20 },
    ],
  },
  {
    test: (q) => /\b(weather|hurricane|tornado|flood|earthquake|wildfire|drought|climate|storm|temperature)\b/.test(q),
    factors: [
      { name: "Forecast Models", description: "Ensemble model consensus and spread for the event", weight: 0.25 },
      { name: "Historical Averages", description: "Climatological baselines and frequency data", weight: 0.20 },
      { name: "Severity Indicators", description: "Current precursor signals and intensity metrics", weight: 0.25 },
    ],
  },
];

const GENERAL_POOL: Factor[] = [
  { name: "Media Narrative", description: "Dominant storyline in major outlets and how it shapes expectations", weight: 0.15 },
  { name: "Expert Consensus", description: "Where domain specialists and forecasters currently stand", weight: 0.18 },
  { name: "Momentum", description: "Direction and speed of recent probability movement", weight: 0.17 },
  { name: "Geopolitical Risk", description: "External shocks or instability that could affect the outcome", weight: 0.15 },
  { name: "Public Sentiment", description: "Broader public opinion and social media signal", weight: 0.15 },
  { name: "Macro Sentiment", description: "Overall economic confidence and risk appetite", weight: 0.18 },
];

const TIME_FACTOR: Factor = {
  name: "Time Remaining",
  description: "How much time is left for this event to resolve, affecting uncertainty",
  weight: 0.15,
};

export function generateFactors(question: string, category: string): Factor[] {
  const q = question.toLowerCase();
  const matched: Factor[] = [];
  const usedNames = new Set<string>();

  // Check time-based
  const hasTimeElement = /\b(by|before|until|deadline|end of|in \d{4}|by (january|february|march|april|may|june|july|august|september|october|november|december))\b/.test(q);

  // Collect topic matches
  for (const rule of TOPIC_RULES) {
    if (rule.test(q)) {
      for (const f of rule.factors) {
        if (!usedNames.has(f.name) && matched.length < 3) {
          matched.push(f);
          usedNames.add(f.name);
        }
      }
    }
  }

  // Add time factor if relevant
  if (hasTimeElement && !usedNames.has(TIME_FACTOR.name) && matched.length < 4) {
    matched.push(TIME_FACTOR);
    usedNames.add(TIME_FACTOR.name);
  }

  // Pad to 5 with general pool
  const shuffledGeneral = [...GENERAL_POOL].sort(() => Math.random() - 0.5);
  for (const f of shuffledGeneral) {
    if (matched.length >= 5) break;
    if (!usedNames.has(f.name)) {
      matched.push(f);
      usedNames.add(f.name);
    }
  }

  // If still under 5 (shouldn't happen), fill
  while (matched.length < 5) {
    matched.push({
      name: `Contextual Factor`,
      description: "A general consideration for this market",
      weight: 0.15,
    });
  }

  // Normalize weights to sum to 1
  const total = matched.slice(0, 5).reduce((s, f) => s + f.weight, 0);
  const factors = matched.slice(0, 5).map((f) => ({
    ...f,
    weight: Math.round((f.weight / total) * 100) / 100,
  }));

  // Fix rounding to ensure sum = 1
  const sum = factors.reduce((s, f) => s + f.weight, 0);
  if (sum !== 1) {
    factors[0].weight = Math.round((factors[0].weight + (1 - sum)) * 100) / 100;
  }

  return factors;
}
