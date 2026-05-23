import React from "react";
import "./globals.css";
import WalletConnect from "../components/WalletConnect";
import { Toaster } from "sonner";
import Link from "next/link";
import { Sparkles, HelpCircle } from "lucide-react";

export const metadata = {
  title: "PromptMarket - AI-Validated Prompt Marketplace on GenLayer",
  description: "Browse, buy, and sell high-quality AI prompts validated and rated directly on-chain by decentralized AI validators.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground selection:bg-violet-600/30 selection:text-violet-200 antialiased overflow-x-hidden">
        {/* Ambient background glow accents */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: "2s" }} />

        {/* Global Navigation Header */}
        <header className="sticky top-0 z-50 w-full border-b border-violet-500/10 bg-background/60 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)] group-hover:scale-105 transition-all">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-violet-300 bg-clip-text text-transparent font-sans">
                Prompt<span className="text-violet-400 font-extrabold">Market</span>
              </span>
            </Link>

            {/* Menu Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-400">
              <Link href="/" className="hover:text-violet-400 transition-colors">
                Browse Marketplace
              </Link>
              <Link href="/submit" className="hover:text-violet-400 transition-colors">
                Submit Prompt
              </Link>
              <Link href="/my-prompts" className="hover:text-violet-400 transition-colors">
                Seller Dashboard
              </Link>
            </nav>

            {/* Web3 Connect */}
            <WalletConnect />
          </div>
        </header>

        {/* Core Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="w-full border-t border-violet-500/10 py-6 bg-slate-950/20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} PromptMarket on GenLayer. Verified On-Chain.
            </div>
            <div className="flex items-center gap-4">
              <a href="https://studio.genlayer.com/run-debug" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors">
                GenLayer Studio
              </a>
              <span className="text-slate-700">&bull;</span>
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                AI-Validated &ge; 4.0/5.0
              </span>
            </div>
          </div>
        </footer>

        {/* Beautiful feedback toasts */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#141020",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              color: "#f3f1f8",
              fontFamily: "Inter, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
