"use client";

import React, { useState } from "react";
import { useAppStore } from "../../../lib/store";
import { formatWei } from "../../../lib/genlayer-client";
import RatingBadge from "../../../components/RatingBadge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Cpu, ShoppingBag, Calendar, Lock, Unlock, Copy, Check, AlertTriangle, MessageSquare, ExternalLink
} from "lucide-react";

export default function PromptDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const { 
    prompts, purchasedPromptIds, submittedPromptIds, walletAddress, isConnected, 
    purchasePrompt, reportPrompt 
  } = useAppStore();

  const prompt = prompts.find(p => p.id === id);

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Reporting state
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");

  if (!prompt) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold text-slate-300">Prompt not found</h3>
        <button onClick={() => router.push("/")} className="mt-4 px-4 py-2 text-xs font-bold text-white rounded-xl bg-violet-600">
          Back to Marketplace
        </button>
      </div>
    );
  }

  const isSeller = walletAddress && prompt.seller.toLowerCase() === walletAddress.toLowerCase();
  const isPurchased = purchasedPromptIds.includes(prompt.id);
  const isUnlocked = isSeller || isPurchased;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.prompt_template);
    setCopied(true);
    toast.success("Prompt template copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePurchase = async () => {
    if (!isConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsPurchasing(true);
    toast.loading("Processing Web3 purchase transaction...", { id: "purchase" });

    try {
      const priceBigInt = BigInt(prompt.price);
      const success = await purchasePrompt(prompt.id, priceBigInt);
      
      if (success) {
        toast.success("Purchase finalized! Prompt template unlocked.", { id: "purchase" });
      } else {
        toast.error("Purchase failed.", { id: "purchase" });
      }
    } catch (e) {
      toast.error("Blockchain execution failed.", { id: "purchase" });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) return;

    toast.loading("Broadcasting report to on-chain AI auditors...", { id: "report" });
    try {
      const success = await reportPrompt(prompt.id, reportReason);
      if (success) {
        toast.success("Report submitted successfully!", { id: "report" });
        setIsReporting(false);
        setReportReason("");
      } else {
        toast.error("Failed to submit report.", { id: "report" });
      }
    } catch (err) {
      toast.error("Reporting failed.", { id: "report" });
    }
  };

  const formattedDate = new Date(parseInt(prompt.created_at) * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back Button */}
      <button 
        onClick={() => router.push("/")}
        className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Marketplace
      </button>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Prompt Details & Code */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header block */}
          <div className="bg-slate-950/40 border border-violet-500/10 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md border border-violet-500/20 bg-violet-500/10 text-violet-400">
                {prompt.category}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold text-slate-400 bg-slate-800/60 rounded-md border border-slate-700/30">
                <Cpu className="w-3 h-3" />
                {prompt.target_model}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {prompt.title}
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed">
              {prompt.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Submitted {formattedDate}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-4 h-4" />
                {prompt.total_sales} lifetime sales
              </span>
            </div>
          </div>

          {/* AI Validator Verdict Details */}
          <div className="bg-slate-950/40 border border-violet-500/10 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                On-Chain AI Quality Score
              </h3>
              <RatingBadge rating={prompt.ai_rating} size="lg" />
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Auditor Qualitative Review</span>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{prompt.ai_review}"
              </p>
            </div>

            {/* Test inputs review */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Executed Test inputs</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {prompt.test_cases.map((tc, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg">
                    <span className="text-[9px] font-bold text-slate-600 block mb-1">INPUT #{idx + 1}</span>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-normal">
                      {tc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unlocked Prompt Template Widget */}
          {isUnlocked ? (
            <div className="bg-slate-950/40 border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-md space-y-4 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <Unlock className="w-4 h-4" />
                  Unlocked Prompt Template
                </h3>
                
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Template</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative bg-slate-900/80 border border-slate-850 p-4 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96 select-all scrollbar-thin">
                {prompt.prompt_template}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  Prompt Preview
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800/80">
                  Locked
                </span>
              </div>

              <p className="text-sm text-slate-400 bg-slate-900/60 border border-slate-850/50 p-4 rounded-xl leading-relaxed italic">
                "{prompt.preview}"
              </p>
            </div>
          )}

        </div>

        {/* Right Column: Unlock Box & reporting */}
        <div className="space-y-6">
          
          {/* Unlock box */}
          {!isUnlocked ? (
            <div className="glass-panel-glow border-violet-500/20 p-6 rounded-2xl backdrop-blur-md space-y-6 text-center">
              <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5 text-violet-400 animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Instant Unlock Price</span>
                <div className="text-3xl font-black text-white font-mono flex items-center justify-center gap-1">
                  {formatWei(prompt.price)}
                  <span className="text-sm text-violet-400 font-sans font-semibold">GEN</span>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full py-3.5 text-sm font-bold text-white rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isPurchasing ? "Purchasing..." : "Unlock Full Prompt"}
              </button>

              <p className="text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
                Payments are processed instantly on the GenLayer blockchain. 80% goes directly to the seller, and 20% is held by PromptMarket.
              </p>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-emerald-500/10 p-6 rounded-2xl backdrop-blur-md text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <Unlock className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Unlocked!</h4>
                <p className="text-xs text-slate-500">
                  {isSeller ? "You listed this prompt." : "You bought this prompt."} Copy the secret template to the left!
                </p>
              </div>
            </div>
          )}

          {/* Community safety/report box */}
          <div className="bg-slate-950/40 border border-violet-500/10 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Community Safety Center
            </h4>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Notice malicious code, plagiarized instructions, or low quality? File a safety report. After 3 reports, our contract triggers automatic AI re-evaluation audits.
            </p>

            {isReporting ? (
              <form onSubmit={handleReport} className="space-y-3 pt-2">
                <input
                  type="text"
                  placeholder="Reason (e.g. plagiarism, injection)..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/40"
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2 text-xs font-bold text-white rounded-lg bg-amber-600 hover:bg-amber-500 cursor-pointer">
                    Submit
                  </button>
                  <button type="button" onClick={() => setIsReporting(false)} className="flex-1 py-2 text-xs font-bold text-slate-400 bg-slate-900 border border-slate-850 rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsReporting(true)}
                className="w-full py-2.5 text-xs font-bold text-slate-300 bg-slate-900 border border-slate-850 rounded-xl hover:text-amber-400 hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Report Prompt Template
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
