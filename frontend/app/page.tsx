"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "../lib/store";
import PromptCard from "../components/PromptCard";
import { Search, SlidersHorizontal, Sparkles, Cpu, BookOpen, Layers } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function HomePage() {
  const { prompts, syncOnChainState, isRealContractConnected, isConnected } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"rating" | "sales" | "price">("rating");

  useEffect(() => {
    syncOnChainState();
  }, [isRealContractConnected, isConnected]);

  const categories = [
    { id: "all", name: "All Categories", icon: Layers },
    { id: "coding", name: "Coding", icon: Cpu },
    { id: "writing", name: "Writing", icon: BookOpen },
    { id: "marketing", name: "Marketing", icon: Sparkles },
    { id: "design", name: "Design", icon: Sparkles },
    { id: "data", name: "Data Science", icon: Cpu },
  ];

  // Filter approved prompts
  const approvedPrompts = prompts.filter(p => p.status === "approved");

  // Apply search & category filters
  const filteredPrompts = approvedPrompts
    .filter(p => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "rating") {
        return parseInt(b.ai_rating) - parseInt(a.ai_rating);
      }
      if (sortBy === "sales") {
        return parseInt(b.total_sales) - parseInt(a.total_sales);
      }
      if (sortBy === "price") {
        return BigInt(a.price) > BigInt(b.price) ? 1 : -1;
      }
      return 0;
    });

  return (
    <div className="space-y-12">
      {/* Premium Hero Banner */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(139,92,246,0.1)]">
          <Sparkles className="w-3.5 h-3.5" />
          Decentralized Prompt Marketplace
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-white font-sans">
          AI-Validated Prompts
          <span className="block mt-2 bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Secured by GenLayer
          </span>
        </h1>
        
        <p className="text-slate-400 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
          Every prompt listed is automatically executed with test cases and evaluated by decentralized AI consensus validators. Only high-performing prompts (&ge; 4.0/5.0) are listed for sale.
        </p>
      </section>

      {/* Search and Filters Shell */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-950/40 border border-violet-500/10 p-4 rounded-2xl backdrop-blur-md">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search verified prompts (e.g., Tailwind, Copywriting)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_10px_rgba(139,92,246,0.15)] transition-all font-semibold"
            />
          </div>

          {/* Sorter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-slate-500 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full md:w-auto bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm text-slate-300 font-bold focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="rating">Sort by AI Rating</option>
              <option value="sales">Sort by Sales Volume</option>
              <option value="price">Sort by Price (Low &rarr; High)</option>
            </select>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold tracking-wide uppercase rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)] scale-[1.02]"
                    : "bg-slate-950/20 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompts Marketplace Grid */}
      {filteredPrompts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-950/20 border border-violet-500/5 rounded-3xl p-8 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 mb-4">
            <Search className="w-6 h-6 text-slate-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-slate-300">No prompts found</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-2">
            Try adjusting your search criteria, switching categories, or submit a new prompt to be evaluated by AI!
          </p>
        </div>
      )}
    </div>
  );
}
