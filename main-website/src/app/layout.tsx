import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./(main)/globals.css";

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${outfit.variable} dark`} suppressHydrationWarning>
      <body className="antialiased font-jakarta" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
