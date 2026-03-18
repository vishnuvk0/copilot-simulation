"use client";

interface DateRangePickerProps {
  yearStart: number;
  yearEnd: number;
  onYearStartChange: (year: number) => void;
  onYearEndChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
}

export default function DateRangePicker({
  yearStart,
  yearEnd,
  onYearStartChange,
  onYearEndChange,
  minYear = 2021,
  maxYear = 2026,
}: DateRangePickerProps) {
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-gray-600">From</label>
      <select
        value={yearStart}
        onChange={(e) => onYearStartChange(Number(e.target.value))}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <label className="text-sm text-gray-600">to</label>
      <select
        value={yearEnd}
        onChange={(e) => onYearEndChange(Number(e.target.value))}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
