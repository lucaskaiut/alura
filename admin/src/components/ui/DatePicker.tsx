import { useState, useRef, useEffect, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  rangeValue?: { from: string; to: string };
  onRangeChange?: (range: { from: string; to: string }) => void;
  placeholder?: string;
  range?: boolean;
  className?: string;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(y: number, m: number, d: number): string {
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function parseDate(str: string): { year: number; month: number; day: number } | null {
  if (!str) return null;
  const parts = str.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { year: y, month: m - 1, day: d };
}

export default function DatePicker({
  value,
  onChange,
  rangeValue,
  onRangeChange,
  placeholder = "Selecionar data",
  range = false,
  className = "",
}: DatePickerProps) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selecting, setSelecting] = useState<"from" | "to">("from");
  const ref = useRef<HTMLDivElement>(null);

  const rangeFrom = rangeValue ? parseDate(rangeValue.from) : null;
  const rangeTo = rangeValue ? parseDate(rangeValue.to) : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleDayClick = useCallback(
    (day: number) => {
      const dateStr = formatDate(year, month, day);
      if (range && onRangeChange) {
        if (selecting === "from") {
          onRangeChange({ from: dateStr, to: rangeValue?.to || dateStr });
          setSelecting("to");
        } else {
          if (dateStr < (rangeValue?.from || dateStr)) {
            onRangeChange({ from: dateStr, to: rangeValue?.from || dateStr });
          } else {
            onRangeChange({ from: rangeValue?.from || dateStr, to: dateStr });
          }
          setSelecting("from");
          setOpen(false);
        }
      } else if (onChange) {
        onChange(dateStr);
        setOpen(false);
      }
    },
    [year, month, range, selecting, rangeValue, onChange, onRangeChange]
  );

  const isInRange = (day: number): boolean => {
    if (!range || !rangeFrom || !rangeTo) return false;
    const current = new Date(year, month, day).getTime();
    const from = new Date(rangeFrom.year, rangeFrom.month, rangeFrom.day).getTime();
    const to = new Date(rangeTo.year, rangeTo.month, rangeTo.day).getTime();
    return current >= from && current <= to;
  };

  const isRangeEdge = (day: number): boolean => {
    if (!range) return false;
    const dateStr = formatDate(year, month, day);
    return dateStr === rangeValue?.from || dateStr === rangeValue?.to;
  };

  const displayValue = range
    ? rangeValue?.from && rangeValue?.to
      ? `${rangeValue.from} — ${rangeValue.to}`
      : rangeValue?.from || placeholder
    : value || placeholder;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center w-full gap-2 px-3 py-2 text-sm text-left bg-surface border border-border rounded-lg hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
      >
        <Calendar size={16} className="text-text-muted shrink-0" />
        <span className={displayValue === placeholder ? "text-text-muted" : "text-text"}>
          {displayValue}
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 bg-surface border border-border rounded-xl shadow-lg p-3 w-[280px] animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-bg text-text-muted transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-text">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-bg text-text-muted transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs text-text-muted py-1 font-medium">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDate(year, month, day);
              const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
              const isToday = dateStr === todayStr;
              const isSelected = !range && dateStr === value;
              const inRange = isInRange(day);
              const isEdge = isRangeEdge(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`text-center text-sm py-1.5 rounded-lg transition-colors ${
                    isSelected || isEdge
                      ? "bg-primary-500 text-white"
                      : inRange
                      ? "bg-primary-50 text-primary-700"
                      : isToday
                      ? "text-primary-600 font-semibold bg-primary-50/50"
                      : "text-text hover:bg-bg"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
