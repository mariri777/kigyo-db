import type { Cpu } from "lucide-react";

export function SectionHeader({
  kicker,
  title,
  subtitle,
  icon: Icon,
  tag,
  action,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  icon?: typeof Cpu;
  tag?: { label: string; color: string };
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        {kicker && (
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
            {kicker}
          </div>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
          {tag && (
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${tag.color}`}
            >
              {tag.label}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-neutral-500 mt-2 max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
