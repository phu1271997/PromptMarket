import React from "react";
import Link from "next/link";
import { Prompt } from "../lib/types";
import { formatWei } from "../lib/genlayer-client";
import RatingBadge from "./RatingBadge";
import { ShoppingBag, Cpu, ArrowRight } from "lucide-react";

interface PromptCardProps {
  prompt: Prompt;
}

export default function PromptCard({ prompt }: PromptCardProps) {
  const categoryColors: Record<string, string> = {
    coding: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    writing: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    marketing: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    design: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    data: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  const currentCatColor = categoryColors[prompt.category] || "text-slate-400 bg-slate-500/10 border-slate-500/20";

  return (
    <div className="group relative flex flex-col justify-between h-full bg-slate-900/40 border border-violet-500/10 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:border-violet-500/30 hover:shadow-[0_0_25px_rgba(139,92,246,0.1)] hover:-translate-y-1">
      {/* Light glow effects */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div>
        {/* Header tags */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md border ${currentCatColor}`}>
              {prompt.category}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold text-slate-400 bg-slate-800/60 rounded-md border border-slate-700/30">
              <Cpu className="w-3 h-3" />
              {prompt.target_model}
            </span>
          </div>
          <RatingBadge rating={prompt.ai_rating} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-extrabold text-white mb-2 group-hover:text-violet-400 transition-colors line-clamp-1">
          {prompt.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 line-clamp-3 mb-6">
          {prompt.description}
        </p>
      </div>

      {/* Footer details */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Price</span>
          <span className="text-lg font-black text-white font-mono">
            {formatWei(prompt.price)} <span className="text-xs text-violet-400 font-sans font-semibold">GEN</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{prompt.total_sales} sold</span>
          </div>

          <Link href={`/prompt/${prompt.id}`} className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-all">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
