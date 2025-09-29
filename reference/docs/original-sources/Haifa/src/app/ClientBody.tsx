"use client";

import { ReactNode } from "react";

export function ClientBody({ children }: { children: ReactNode }) {
  return (
    <body suppressHydrationWarning className="antialiased">
      {children}
    </body>
  )
}
