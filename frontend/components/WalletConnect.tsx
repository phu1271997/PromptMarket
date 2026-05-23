"use client";

import React from "react";
import { useAppStore } from "../lib/store";
import { formatWei } from "../lib/genlayer-client";
import { Wallet, LogOut, ArrowRightLeft, ShieldCheck, Coins } from "lucide-react";
import { toast } from "sonner";

export default function WalletConnect() {
  const {
    walletAddress,
    isConnected,
    isConnecting,
    isRealContractConnected,
    currentRole,
    claimableBalance,
    connectWallet,
    disconnectWallet,
    setRole,
    withdrawEarnings,
  } = useAppStore();

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected successfully!");
    } catch (e) {
      toast.error("Failed to connect wallet.");
    }
  };

  const handleWithdraw = async () => {
    if (claimableBalance === "0") {
      toast.error("No claimable earnings to withdraw");
      return;
    }
    toast.loading("Processing withdrawal...", { id: "withdraw" });
    try {
      const success = await withdrawEarnings();
      if (success) {
        toast.success("Withdrawal successful!", { id: "withdraw" });
      } else {
        toast.error("Withdrawal failed.", { id: "withdraw" });
      }
    } catch (e) {
      toast.error("Withdrawal execution failed.", { id: "withdraw" });
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="flex items-center gap-4">
      {isConnected && walletAddress ? (
        <div className="flex items-center gap-3">
          {/* Simulation mode indicator */}
          {!isRealContractConnected && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              Dev Studio Sim
            </div>
          )}

          {isRealContractConnected && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              On-Chain Connected
            </div>
          )}

          {/* Role switcher */}
          <div className="flex bg-slate-900/60 border border-violet-500/10 rounded-lg p-0.5">
            <button
              onClick={() => setRole("buyer")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                currentRole === "buyer"
                  ? "bg-violet-600 text-white shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Browse Prompts
            </button>
            <button
              onClick={() => setRole("seller")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                currentRole === "seller"
                  ? "bg-violet-600 text-white shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Seller Dashboard
            </button>
          </div>

          {/* Balance display */}
          {currentRole === "seller" && BigInt(claimableBalance) > 0 && (
            <button
              onClick={handleWithdraw}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.1)]"
            >
              <Coins className="w-3.5 h-3.5" />
              Claim {formatWei(claimableBalance)} GEN
            </button>
          )}

          {/* Wallet address pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-violet-500/20 bg-violet-950/20 text-violet-300 backdrop-blur-md">
            <Wallet className="w-4 h-4 text-violet-400" />
            <span className="font-mono">{truncateAddress(walletAddress)}</span>
            <button
              onClick={disconnectWallet}
              className="ml-1 p-0.5 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
              title="Disconnect Wallet"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl border border-violet-500/30 bg-violet-600/80 hover:bg-violet-600 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_15px_rgba(139,92,246,0.4)]"
        >
          <Wallet className="w-4 h-4" />
          {isConnecting ? "Connecting..." : "Connect MetaMask"}
        </button>
      )}
    </div>
  );
}
