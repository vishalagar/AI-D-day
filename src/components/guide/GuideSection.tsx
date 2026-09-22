import type { ReactNode } from "react";

interface GuideSectionProps {
  title: string;
  children: ReactNode;
}

export function GuideSection({ title, children }: GuideSectionProps) {
  return (
    <section className="hard-border hard-shadow bg-panel p-4">
      <h2 className="mb-2 text-base font-bold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-2 text-sm text-ink-dim">{children}</div>
    </section>
  );
}
