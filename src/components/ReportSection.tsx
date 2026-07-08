import type { ReactNode } from 'react';

type SectionVariant = 'default' | 'highlight' | 'warning' | 'muted';

interface ReportSectionProps {
  title: string;
  variant?: SectionVariant;
  children: ReactNode;
}

const variantStyles: Record<SectionVariant, string> = {
  default: 'bg-white border border-slate-200',
  highlight: 'bg-brand-50 border border-brand-200',
  warning: 'bg-amber-50 border-l-4 border-l-amber-400 border border-slate-200',
  muted: 'bg-slate-50 border border-slate-100',
};

export function ReportSection({
  title,
  variant = 'default',
  children,
}: ReportSectionProps) {
  return (
    <div className={`rounded-2xl p-5 mb-4 ${variantStyles[variant]}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
        {title}
      </h3>
      <div className="text-sm text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}
