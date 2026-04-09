import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FlickeringGrid } from "@/components/FlickeringGrid";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <FlickeringGrid />
      <div className="flex flex-col min-h-screen relative z-0">
        <Navbar />
        <main className="flex-grow pt-24">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
