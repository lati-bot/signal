"use client";

import { useState } from "react";

export function SearchBar() {
  const [query, setQuery] = useState("");

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search markets..."
        className="w-full max-w-md px-4 py-2.5 bg-white border border-sand rounded-lg text-sm placeholder:text-warm-400 focus:outline-none focus:border-warm-400 transition-colors"
      />
    </div>
  );
}
