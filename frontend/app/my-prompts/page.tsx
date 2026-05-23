"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "../../lib/store";
import { formatWei } from "../../lib/genlayer-client";
import PromptCard from "../../components/PromptCard";
import { toast } from "sonner";
import Link from "next/link";
import { 
  Sparkles, Layers, History, RefreshCcw, CheckCircle, XCircle, AlertCircle, ShoppingBag, Eye, Coins
} from "lucide-react";

export default function MyPromptsPage() {
  const { 
    prompts, walletAddress, isConnected, syncOnChainState, reEvaluatePrompt,
    isRealContractConnected, submittedPromptIds, purchasedPromptIds
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"submissions" | "purchases">("submissions");
  
  // Re-evaluation form state
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    syncOnChainState();
  }, [isRealContractConnected, isConnected]);

  // Submissions: prompts where seller matches walletAddress OR prompt ID is in submittedPromptIds
  const mySubmissions = prompts.filter(
    p => (walletAddress && p.seller.toLowerCase() === walletAddress.toLowerCase()) || submittedPromptIds.includes(p.id)
  );

  // Purchases: prompts bought by buyer (prompt ID in purchasedPromptIds)
  const myPurchases = prompts.filter(p => purchasedPromptIds.includes(p.id));

  const handleOpenReevaluate = (promptId: string, template: string) => {
    setSelectedPromptId(promptId);
    setNewTemplate(template);
  };

  const handleReevaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromptId || !newTemplate) return;

    setIsRetrying(true);
    toast.loading("Broadcasting re-evaluation updates...", { id: "reeval" });

    try {
      const newPreview = newTemplate.substring(0, 100) + (newTemplate.length > 100 ? "..." : "");
      const success = await reEvaluatePrompt(selectedPromptId, newTemplate, newPreview);

      if (success) {
        toast.success("AI review completed! Prompt status updated.", { id: "reeval" });
        setSelectedPromptId(null);
      } else {
        toast.error("Re-evaluation failed.", { id: "reeval" });
      }
    } catch (err) {
      toast.error("Re-evaluation failed.", { id: "reeval" });
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <CheckCircle className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" /> Pending AI Review
          </span>
        );
      case "removed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-md bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <XCircle className="w-3.5 h-3.5" /> Removed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Your Dashboard</h1>
        <p className="text-sm text-slate-400">
          Track your submissions, monitor listing approvals, retry rejected prompt templates, and view bought prompts.
        </p>
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-950/40 border border-violet-500/10 rounded-2xl backdrop-blur-md space-y-4">
          <AlertCircle className="w-10 h-10 text-violet-400 animate-bounce" />
          <h3 className="text-xl font-bold text-white">Wallet Connection Required</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            To view your seller submissions dashboard or purchased templates, connect your MetaMask wallet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab Navigation Switches */}
          <div className="flex bg-slate-950/40 border border-violet-500/10 rounded-2xl p-1 max-w-md backdrop-blur-md">
            <button
              onClick={() => setActiveTab("submissions")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-extrabold uppercase tracking-wide rounded-xl transition-all cursor-pointer ${
                activeTab === "submissions"
                  ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] scale-[1.01]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              My Submissions ({mySubmissions.length})
            </button>
            <button
              onClick={() => setActiveTab("purchases")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-extrabold uppercase tracking-wide rounded-xl transition-all cursor-pointer ${
                activeTab === "purchases"
                  ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] scale-[1.01]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="w-4 h-4" />
              My Purchases ({myPurchases.length})
            </button>
          </div>

          {/* Submissions Tab Content */}
          {activeTab === "submissions" && (
            <div className="space-y-6">
              {mySubmissions.length > 0 ? (
                <div className="bg-slate-950/40 border border-violet-500/10 rounded-2xl overflow-hidden backdrop-blur-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/60 border-b border-violet-500/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Title</th>
                          <th className="px-6 py-4">Price</th>
                          <th className="px-6 py-4">Rating</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300 font-semibold">
                        {mySubmissions.map((prompt) => (
                          <tr key={prompt.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <span className="text-white font-bold block">{prompt.title}</span>
                                <span className="text-[10px] text-slate-500 font-mono block">{prompt.id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">{formatWei(prompt.price)} GEN</td>
                            <td className="px-6 py-4 font-mono text-xs">{(parseFloat(prompt.ai_rating) / 100).toFixed(2)}</td>
                            <td className="px-6 py-4">{getStatusBadge(prompt.status)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link 
                                  href={`/prompt/${prompt.id}`} 
                                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-800 bg-slate-900 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </Link>

                                {prompt.status === "rejected" && parseInt(prompt.re_evaluation_count) < 1 && (
                                  <button
                                    onClick={() => handleOpenReevaluate(prompt.id, prompt.prompt_template)}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all cursor-pointer inline-flex items-center gap-1 shadow-[0_0_8px_rgba(139,92,246,0.1)]"
                                  >
                                    <RefreshCcw className="w-3.5 h-3.5" /> Retry (Re-evaluate)
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 bg-slate-950/20 border border-violet-500/5 rounded-3xl p-8 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 mb-4">
                    <Sparkles className="w-5 h-5 text-slate-600 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-300">No submissions yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    List a new prompt template. Build premium AI instructions and start earning GenLayer tokens.
                  </p>
                  <Link href="/submit" className="mt-4 px-4 py-2 text-xs font-bold text-white rounded-xl bg-violet-600 hover:bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.2)]">
                    List new Prompt
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Purchases Tab Content */}
          {activeTab === "purchases" && (
            <div>
              {myPurchases.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myPurchases.map((prompt) => (
                    <PromptCard key={prompt.id} prompt={prompt} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 bg-slate-950/20 border border-violet-500/5 rounded-3xl p-8 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 mb-4">
                    <ShoppingBag className="w-5 h-5 text-slate-600 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-300">No purchases found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Explore the marketplace to find high-performing, verified prompts for your projects.
                  </p>
                  <Link href="/" className="mt-4 px-4 py-2 text-xs font-bold text-white rounded-xl bg-violet-600 hover:bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.2)]">
                    Browse Marketplace
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* RE-EVALUATION EDIT MODAL */}
      {selectedPromptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
          <form onSubmit={handleReevaluate} className="relative z-10 glass-panel-glow border-violet-500/20 p-6 rounded-3xl max-w-xl w-full mx-4 space-y-4">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-1.5">
              <RefreshCcw className="w-5 h-5 text-violet-400" />
              Improve Rejected Prompt
            </h3>
            
            <p className="text-xs text-slate-400">
              You are allowed **1 final retry** to optimize your prompt template instructions and pass the AI auditor listing threshold (&ge; 4.0/5.0).
            </p>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">New Prompt Template</label>
              <textarea
                value={newTemplate}
                onChange={(e) => setNewTemplate(e.target.value)}
                rows={8}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors font-mono resize-none"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isRetrying}
                className="flex-1 py-3.5 text-xs font-bold text-white rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)] cursor-pointer disabled:opacity-50"
              >
                {isRetrying ? "Resubmitting..." : "Submit for Re-evaluation"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPromptId(null)}
                className="flex-1 py-3.5 text-xs font-bold text-slate-400 rounded-xl bg-slate-900 border border-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
