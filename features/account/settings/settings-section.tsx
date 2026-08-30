import type { ReactNode } from 'react';

type Props = {
  id: string;
  title: string;
  children: ReactNode;
};

export default function SettingsSection({ id, title, children }: Props) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="grid min-w-0 grid-cols-1 gap-4 border-t border-border/60 pt-5 xl:grid-cols-[8rem_minmax(0,1fr)] xl:gap-8"
      data-llm-visible="true"
    >
      <header>
        <h2
          id={`${id}-heading`}
          className="text-base font-semibold"
          data-llm-text={title}
        >
          {title}
        </h2>
      </header>
      <div className="min-w-0 w-full max-w-4xl">{children}</div>
    </section>
  );
}
