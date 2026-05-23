"use client";

import React, { useState } from "react";
import { useAppStore } from "../../lib/store";
import { parseToWei } from "../../lib/genlayer-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Sparkles, HelpCircle, Layers, Cpu, Code2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export default function SubmitPage() {
  const router = useRouter();
  const { isConnected, walletAddress, connectWallet, submitPrompt } = useAppStore();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"coding" | "writing" | "marketing" | "design" | "data">("coding");
  const [targetModel, setTargetModel] = useState("Claude-3.5-Sonnet");
  const [price, setPrice] = useState("0.05");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [testCase1, setTestCase1] = useState("");
  const [testCase2, setTestCase2] = useState("");
  const [testCase3, setTestCase3] = useState("");

  // Pipeline Loading overlay state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalStep, setEvalStep] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<{
    success: boolean;
    rating: number;
    review: string;
    id?: string;
  } | null>(null);

  const evalSteps = [
    { title: "Broadcasting transaction to GenLayer network...", duration: 2500 },
    { title: "Running Prompt Template on Test Input 1...", duration: 3500 },
    { title: "Running Prompt Template on Test Input 2...", duration: 3500 },
    { title: "Running Prompt Template on Test Input 3...", duration: 3500 },
    { title: "Generating multi-agent consensus rating & feedback...", duration: 4000 },
    { title: "Finalizing contract block state on-chain...", duration: 2500 },
  ];

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected!");
    } catch (e) {
      toast.error("Failed to connect wallet.");
    }
  };

  const runEvaluationLoadingTimeline = (callback: () => void) => {
    setIsEvaluating(true);
    setEvalStep(0);
    setEvaluationResult(null);

    let currentStep = 0;
    const runNextStep = () => {
      if (currentStep < evalSteps.length - 1) {
        setTimeout(() => {
          currentStep++;
          setEvalStep(currentStep);
          runNextStep();
        }, evalSteps[currentStep].duration);
      } else {
        // Complete
        setTimeout(() => {
          setIsEvaluating(false);
          callback();
        }, evalSteps[currentStep].duration);
      }
    };
    runNextStep();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!title || !description || !promptTemplate || !testCase1 || !testCase2 || !testCase3) {
      toast.error("Please fill in all required fields and provide exactly 3 test inputs");
      return;
    }

    const priceWei = parseToWei(price);
    const testCases = [testCase1, testCase2, testCase3];
    const previewText = promptTemplate.substring(0, 100) + (promptTemplate.length > 100 ? "..." : "");

    // Run custom AI loading timeline simulation/wait matching block finality
    runEvaluationLoadingTimeline(async () => {
      toast.loading("Publishing prompt to blockchain...", { id: "publish" });
      try {
        const success = await submitPrompt(
          title,
          description,
          category,
          targetModel,
          priceWei,
          promptTemplate,
          previewText,
          testCases
        );

        if (success) {
          toast.success("AI review finalized!", { id: "publish" });
          
          // Get the newly created prompt from store to display its score
          // It will be the newest one added
          setTimeout(() => {
            const storeState = useAppStore.getState();
            const newestPrompt = [...storeState.prompts].pop();
            
            if (newestPrompt) {
              const rating = parseFloat(newestPrompt.ai_rating) / 100;
              const approve = newestPrompt.status === "approved";
              
              setEvaluationResult({
                success: approve,
                rating,
                review: newestPrompt.ai_review,
                id: newestPrompt.id
              });
            }
          }, 500);

        } else {
          toast.error("Failed to submit prompt.", { id: "publish" });
        }
      } catch (err) {
        toast.error("Blockchain execution failed.", { id: "publish" });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white">List Your Intelligent Prompt</h1>
        <p className="text-sm text-slate-400">
          Sell your prompts securely. AI validators will review and rate your submission. Only ratings &ge; 4.0/5.0 will be approved for listing.
        </p>
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-950/40 border border-violet-500/10 rounded-2xl backdrop-blur-md space-y-4">
          <AlertCircle className="w-10 h-10 text-violet-400 animate-bounce" />
          <h3 className="text-xl font-bold text-white">Wallet Connection Required</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            To submit your prompt template and pay listing processing gas, connect your MetaMask wallet.
          </p>
          <button
            onClick={handleConnect}
            className="px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-violet-600 hover:bg-violet-700 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] cursor-pointer"
          >
            Connect MetaMask
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-950/40 border border-violet-500/10 p-6 rounded-2xl backdrop-blur-md space-y-6">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Prompt Title</label>
              <input
                type="text"
                placeholder="e.g. Expert Tailwind React UI Builder"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-300 font-bold focus:outline-none focus:border-violet-500/40 cursor-pointer"
              >
                <option value="coding">Coding</option>
                <option value="writing">Writing</option>
                <option value="marketing">Marketing</option>
                <option value="design">Design</option>
                <option value="data">Data Science</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Model</label>
              <input
                type="text"
                placeholder="e.g. Claude-3.5-Sonnet or GPT-4"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500/40 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Listing Price (GEN)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-violet-500/40 transition-colors font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
            <textarea
              placeholder="What does this prompt do? What are its strengths and best practices?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors resize-none"
              required
            />
          </div>

          {/* Template Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Actual Prompt Template</label>
              <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">Secret Template</span>
            </div>
            <textarea
              placeholder="Type your highly secret prompt instructions here. This template is hidden and only revealed to verified buyers post-purchase..."
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              rows={6}
              className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors font-mono resize-none"
              required
            />
          </div>

          {/* Test Cases Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-widest text-violet-400">AI Evaluation Test Inputs</label>
              <p className="text-xs text-slate-500">
                Provide exactly 3 separate test inputs. Our validator will execute your prompt with these inputs to verify rating outcomes.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Test Input #1</span>
                <input
                  type="text"
                  placeholder="e.g. Create a sleek landing page for a dog food store..."
                  value={testCase1}
                  onChange={(e) => setTestCase1(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Test Input #2</span>
                <input
                  type="text"
                  placeholder="e.g. Build a customizable dashboard component in React..."
                  value={testCase2}
                  onChange={(e) => setTestCase2(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Test Input #3</span>
                <input
                  type="text"
                  placeholder="e.g. Outline a collapsible navigation header with dropdowns..."
                  value={testCase3}
                  onChange={(e) => setTestCase3(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 mt-4 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.3)] font-sans flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            Submit &amp; Run AI On-Chain Validation
          </button>
        </form>
      )}

      {/* Multi-step AI review pipeline loading modal */}
      {isEvaluating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
          <div className="relative z-10 text-center space-y-6 max-w-md px-6">
            {/* Spinning Neon Logo */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-slate-800 bg-slate-900/80 flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.2)]">
                <Code2 className="w-8 h-8 text-violet-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-white font-sans uppercase">
                Consensus AI Validator Running...
              </h3>
              <p className="text-xs text-slate-400 leading-normal max-w-xs mx-auto">
                GenVM leader node is currently testing your prompt against your 3 test inputs.
              </p>
            </div>

            {/* Pipeline progress steps */}
            <div className="space-y-3 bg-slate-900/60 border border-violet-500/10 p-4 rounded-xl text-left">
              {evalSteps.map((step, idx) => {
                const isActive = evalStep === idx;
                const isCompleted = evalStep > idx;
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs font-semibold">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center font-mono ${
                      isCompleted 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : isActive
                          ? "bg-violet-500/20 text-violet-400 border border-violet-500/40 animate-pulse font-bold"
                          : "bg-slate-950/40 text-slate-600 border border-slate-900"
                    }`}>
                      {isCompleted ? "✔" : idx + 1}
                    </div>
                    <span className={isActive ? "text-violet-300 font-bold" : isCompleted ? "text-slate-400" : "text-slate-600"}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Micro loading bar */}
            <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-purple-blue-gradient h-full transition-all duration-500" 
                style={{ width: `${((evalStep + 1) / evalSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS / REJECTION MODAL */}
      {evaluationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
          <div className="relative z-10 glass-panel-glow border-violet-500/20 p-8 rounded-3xl max-w-md w-full mx-4 space-y-6">
            <div className="text-center space-y-3">
              {evaluationResult.success ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-tight">Prompt Approved!</h3>
                  <div className="text-slate-200 font-mono text-3xl font-black">
                    {evaluationResult.rating.toFixed(2)}<span className="text-slate-600 text-sm font-sans font-bold">/5.00</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                    <XCircle className="w-8 h-8 text-rose-400" />
                  </div>
                  <h3 className="text-2xl font-black text-rose-400 uppercase tracking-tight">Submission Rejected</h3>
                  <div className="text-slate-200 font-mono text-3xl font-black">
                    {evaluationResult.rating.toFixed(2)}<span className="text-slate-600 text-sm font-sans font-bold">/5.00</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">AI Review Verdict</span>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{evaluationResult.review}"
              </p>
            </div>

            {evaluationResult.success ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEvaluationResult(null);
                    router.push(`/prompt/${evaluationResult.id}`);
                  }}
                  className="flex-1 py-3 text-xs font-bold text-white rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.2)] cursor-pointer"
                >
                  View Live Prompt
                </button>
                <button
                  onClick={() => setEvaluationResult(null)}
                  className="flex-1 py-3 text-xs font-bold text-slate-400 rounded-xl bg-slate-900 border border-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEvaluationResult(null);
                    router.push("/my-prompts");
                  }}
                  className="flex-1 py-3 text-xs font-bold text-white rounded-xl bg-amber-600 hover:bg-amber-500 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer"
                >
                  Go to dashboard to Retry
                </button>
                <button
                  onClick={() => setEvaluationResult(null)}
                  className="flex-1 py-3 text-xs font-bold text-slate-400 rounded-xl bg-slate-900 border border-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
