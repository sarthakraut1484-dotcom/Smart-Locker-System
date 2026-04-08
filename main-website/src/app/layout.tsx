import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FlickeringGrid } from "@/components/FlickeringGrid";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-jakarta'
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit'
});

export const metadata: Metadata = {
  title: "LocknLeave | Secure Smart Locker Storage",
  description: "Experience the ultimate freedom of travel with our fully automated, secure LocknLeaves. Book in seconds, access anytime.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${outfit.variable} dark`} suppressHydrationWarning>
      <body className="antialiased font-jakarta" suppressHydrationWarning>
        <FlickeringGrid />
        <div className="flex flex-col min-h-screen relative z-0">
          <Navbar />
          <main className="flex-grow pt-24">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
