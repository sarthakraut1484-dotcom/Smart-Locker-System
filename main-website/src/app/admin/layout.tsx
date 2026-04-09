"use client";

import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SyncProvider } from "@/components/layout/SyncProvider";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlobalModal } from "@/components/ui/Modal";
import { Inter, Outfit } from "next/font/google";
import "./admin-globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div className={`${inter.variable} ${outfit.variable} ${inter.className} antialiased`}>
      <SyncProvider>
        {isLoginPage ? (
          children
        ) : (
          <div className="flex min-h-screen relative">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 ml-64">
              <main className="flex-1 p-8 lg:p-12">
                {children}
              </main>
            </div>
          </div>
        )}
        <GlobalModal />
      </SyncProvider>
    </div>
  );
}
