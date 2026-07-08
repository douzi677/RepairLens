import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  highlighted?: boolean;
  children: ReactNode;
}

export function Card({
  highlighted = false,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-sm p-5
        transition-all duration-200
        ${highlighted ? 'border-2 border-brand-500 bg-brand-50' : 'border border-slate-200'}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
