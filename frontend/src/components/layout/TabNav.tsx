"use client";

const TABS = [
  { id: "portfolio", label: "Portfolio" },
  { id: "spending", label: "Spending" },
  { id: "whatif", label: "What-If" },
  { id: "montecarlo", label: "Monte Carlo" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
