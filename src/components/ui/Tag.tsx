import type { ReactNode } from 'react';

interface TagProps {
  selected?: boolean;
  variant?: 'preset' | 'custom';
  children: ReactNode;
  onClick?: () => void;
  onRemove?: () => void;
}

export function Tag({
  selected = false,
  variant = 'preset',
  children,
  onClick,
  onRemove,
}: TagProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
        transition-all duration-150 min-h-[44px]
        ${
          selected
            ? 'bg-brand-600 text-white border-2 border-brand-600'
            : variant === 'custom'
              ? 'bg-white text-slate-600 border-2 border-dashed border-slate-300 hover:border-brand-400'
              : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-brand-300 active:bg-brand-50'
        }
      `}
    >
      {selected && (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span>{children}</span>
      {variant === 'custom' && onRemove && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onRemove();
            }
          }}
          className="ml-1 text-slate-400 hover:text-red-500 w-5 h-5 inline-flex items-center justify-center rounded-full"
          aria-label="移除"
        >
          ×
        </span>
      )}
    </button>
  );
}
