import type { ReactNode } from "react";

/** Constrains tool / garden pages to a readable column (replaces former root main max-width). */
export default function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-4xl px-4 py-10">{children}</div>;
}
