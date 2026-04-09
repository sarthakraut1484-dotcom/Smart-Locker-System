"use client";

import { useSyncInit } from "@/store/useSyncInit";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useSyncInit();
  return <>{children}</>;
}
