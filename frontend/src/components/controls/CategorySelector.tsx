"use client";

import { useState } from "react";
import type { CategoryInfo } from "@/lib/types";
import { formatDollar } from "@/lib/formatters";

interface CategorySelectorProps {
  categories: CategoryInfo[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function CategorySelector({ categories, selected, onChange }: CategorySelectorProps) {
  const [search, setSearch] = useState("");

  // Group by parent category
  const grouped = new Map<string, CategoryInfo[]>();
  categories.forEach((c) => {
    const list = grouped.get(c.parent_category) || [];
    list.push(c);
    grouped.set(c.parent_category, list);
  });

  const filtered = search
    ? categories.filter((c) => c.category.toLowerCase().includes(search.toLowerCase()))
    : null;

  const toggle = (cat: string) => {
    onChange(
      selected.includes(cat) ? selected.filter((s) => s !== cat) : [...selected, cat]
    );
  };

  const selectAll = () => onChange(categories.map((c) => c.category));
  const clearAll = () => onChange([]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Categories to Remove</h4>
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">All</button>
          <button onClick={clearAll} className="text-xs text-blue-600 hover:underline">None</button>
        </div>
      </div>
      <input
        type="text"
        placeholder="Search categories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
      />
      <div className="max-h-64 overflow-y-auto space-y-3">
        {filtered
          ? filtered.map((c) => (
              <label key={c.category} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(c.category)}
                  onChange={() => toggle(c.category)}
                  className="rounded"
                />
                <span className="flex-1">{c.category}</span>
                <span className="text-gray-400">{formatDollar(c.total_spend)}</span>
              </label>
            ))
          : Array.from(grouped.entries()).map(([parent, cats]) => (
              <div key={parent}>
                <p className="mb-1 text-xs font-semibold uppercase text-gray-400">{parent}</p>
                {cats.map((c) => (
                  <label key={c.category} className="flex cursor-pointer items-center gap-2 py-0.5 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(c.category)}
                      onChange={() => toggle(c.category)}
                      className="rounded"
                    />
                    <span className="flex-1">{c.category}</span>
                    <span className="text-gray-400">{formatDollar(c.total_spend)}</span>
                  </label>
                ))}
              </div>
            ))}
      </div>
      {selected.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {selected.length} selected ({formatDollar(
            categories.filter((c) => selected.includes(c.category)).reduce((s, c) => s + c.total_spend, 0)
          )} total)
        </p>
      )}
    </div>
  );
}
