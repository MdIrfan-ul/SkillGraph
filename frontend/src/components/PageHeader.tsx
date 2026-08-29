import type { ReactNode } from 'react';

interface PageHeaderProps {
  kicker: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ kicker, title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">
          {kicker}
        </p>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight text-ink sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <div className="mt-2 text-[15px] leading-relaxed text-muted">{description}</div>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}