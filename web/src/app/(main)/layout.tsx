import type { ReactNode } from "react";
import { AnjoShell } from "@/features/anjo/server/shell";
export default function MainGroupLayout({ children }: { children: ReactNode }) {
  return <AnjoShell>{children}</AnjoShell>;
}
