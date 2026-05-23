import { create } from "zustand";
import { Prompt } from "./types";
import { client, CONTRACT_ADDRESS, getGenLayerClient } from "./genlayer-client";

// Premium Initial Mock Data for Simulation fallback
const MOCK_PROMPTS: Prompt[] = [
  {
    id: "uuid-1",
    seller: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    title: "Expert Tailwind UI Builder",
    description: "Generates production-ready React component files with beautiful glassmorphic Tailwind classes based on a descriptive layout description.",
    category: "coding",
    target_model: "Claude-3.5-Sonnet",
    price: "50000000000000000", // 0.05 GEN
    prompt_template: "System: You are an expert frontend developer...\n[Prompt template unlocked! Copying is permitted.]",
    preview: "System: You are an expert frontend developer. Create highly optimized Tailwind React...",
    test_cases: [
      "Create a sleek dark-themed analytics card with violet glow accents and subtle hover transitions.",
      "Build a responsive multi-column dashboard shell for an on-chain AI marketplace.",
      "Design a sleek glassmorphic settings modal with collapsible sidebars."
    ],
    ai_rating: "480", // 4.8
    ai_review: "Outstanding structure with extremely precise output tokens. Tailwind class optimization is exceptionally creative, utilizing robust custom border ratios.",
    status: "approved",
    total_sales: "12",
    created_at: "1782230000",
    re_evaluation_count: "0"
  },
  {
    id: "uuid-2",
    seller: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    title: "Copywriting Conversion Accelerator",
    description: "Analyzes standard product summaries and drafts psychological copy frameworks using AIDA and PAS methodologies for social campaigns.",
    category: "writing",
    target_model: "GPT-4",
    price: "35000000000000000", // 0.035 GEN
    prompt_template: "System: You are an elite conversion rate strategist...\n[Template unlocked!]",
    preview: "System: You are an elite conversion rate strategist. Analyze the following product specifications...",
    test_cases: [
      "Product: An AI agent that automates smart contract verification on GenLayer.",
      "Product: Eco-friendly insulated water bottle that tracks daily hydration patterns.",
      "Product: High-yield decentralized savings vault featuring auto-compounding gas loops."
    ],
    ai_rating: "450", // 4.5
    ai_review: "Strong framing with excellent tone controls. Outputs are highly dynamic and immediately ready for social campaigns.",
    status: "approved",
    total_sales: "8",
    created_at: "1782234000",
    re_evaluation_count: "0"
  },
  {
    id: "uuid-3",
    seller: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    title: "SEO Meta Tag & Outline Generator",
    description: "Takes any keyword and generates perfectly optimized SEO meta tags, descriptions, and a hierarchical article outline.",
    category: "marketing",
    target_model: "Claude-3-Haiku",
    price: "15000000000000000", // 0.015 GEN
    prompt_template: "Act as an SEO expert. Keywords: {keywords}...",
    preview: "Act as an SEO expert. Keywords: {keywords}. Generate H1, H2, and title meta tags...",
    test_cases: [
      "AI-validated smart contracts on GenLayer",
      "Best indoor plants for dark offices",
      "How to cook standard sourdough bread in clay pots"
    ],
    ai_rating: "385", // 3.85 (rejected/pending re-eval)
    ai_review: "Rejected because prompt lacks structural complexity. The output generated is too similar to simple browser searches. Needs richer outlining instructions.",
    status: "rejected",
    total_sales: "0",
    created_at: "1782236000",
    re_evaluation_count: "0"
  }
];

interface AppState {
  walletAddress: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  isRealContractConnected: boolean;
  currentRole: "buyer" | "seller";
  claimableBalance: string; // wei
  prompts: Prompt[];
  purchasedPromptIds: string[];
  submittedPromptIds: string[];
  
  // Wallet Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  setRole: (role: "buyer" | "seller") => void;
  syncOnChainState: () => Promise<void>;
  
  // Contract Interaction Actions
  submitPrompt: (
    title: string,
    description: string,
    category: "coding" | "writing" | "marketing" | "design" | "data",
    targetModel: string,
    price: bigint,
    promptTemplate: string,
    preview: string,
    testCases: string[]
  ) => Promise<boolean>;
  
  purchasePrompt: (promptId: string, price: bigint) => Promise<boolean>;
  reEvaluatePrompt: (promptId: string, newTemplate: string, newPreview: string) => Promise<boolean>;
  reportPrompt: (promptId: string, reason: string) => Promise<boolean>;
  withdrawEarnings: () => Promise<boolean>;
}

export const useAppStore = create<AppState>((set, get) => ({
  walletAddress: null,
  isConnecting: false,
  isConnected: false,
  isRealContractConnected: false,
  currentRole: "buyer",
  claimableBalance: "0",
  prompts: MOCK_PROMPTS,
  purchasedPromptIds: [],
  submittedPromptIds: [],

  connectWallet: async () => {
    if (get().isConnecting) return;
    set({ isConnecting: true });
    
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        // Request accounts
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = accounts[0];
        
        // Check if contract is deployed and we can connect
        let isRealConnected = false;
        try {
          // Attempt a simple view call to verify if contract exists
          await client.readContract({
            address: CONTRACT_ADDRESS,
            functionName: "get_marketplace",
            args: []
          });
          isRealConnected = true;
          console.log("Successfully connected to GenLayer contract at:", CONTRACT_ADDRESS);
        } catch (e) {
          console.warn("Could not read contract. Falling back to local simulation mode.", e);
        }

        set({
          walletAddress: account,
          isConnected: true,
          isConnecting: false,
          isRealContractConnected: isRealConnected
        });

        await get().syncOnChainState();
      } else {
        throw new Error("MetaMask not detected");
      }
    } catch (e) {
      console.error("Wallet connection failed:", e);
      // Fail gracefully: assign a local mock address for developer simulation mode!
      set({
        walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // local simulator address
        isConnected: true,
        isConnecting: false,
        isRealContractConnected: false
      });
      await get().syncOnChainState();
    }
  },

  disconnectWallet: () => {
    set({
      walletAddress: null,
      isConnected: false,
      isRealContractConnected: false,
      claimableBalance: "0",
      purchasedPromptIds: [],
      submittedPromptIds: []
    });
  },

  setRole: (role) => {
    set({ currentRole: role });
  },

  syncOnChainState: async () => {
    const { isRealContractConnected, walletAddress } = get();
    if (!isRealContractConnected || !walletAddress) {
      // Simulation mode sync - local storage check
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("promptmarket_prompts");
        if (stored) {
          const parsed = JSON.parse(stored);
          set({ prompts: parsed });
        } else {
          localStorage.setItem("promptmarket_prompts", JSON.stringify(MOCK_PROMPTS));
        }

        const purchases = localStorage.getItem(`purchases_${walletAddress}`);
        if (purchases) {
          set({ purchasedPromptIds: JSON.parse(purchases) });
        }

        const submissions = localStorage.getItem(`submissions_${walletAddress}`);
        if (submissions) {
          set({ submittedPromptIds: JSON.parse(submissions) });
        }
      }
      return;
    }

    try {
      // 1. Fetch approved prompts from marketplace
      const marketplaceJsonStr = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_marketplace",
        args: []
      });
      
      const approvedPrompts: Prompt[] = JSON.parse(marketplaceJsonStr as string);
      
      // 2. Fetch my submissions
      const submissionsJsonStr = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_my_submissions",
        args: [walletAddress]
      });
      const mySubmissions: Prompt[] = JSON.parse(submissionsJsonStr as string);

      // 3. Fetch my purchases
      const purchasesJsonStr = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_my_purchases",
        args: [walletAddress]
      });
      const myPurchases: Prompt[] = JSON.parse(purchasesJsonStr as string);

      // Combine prompts in map to avoid duplicates, prioritize submissions/purchases since they hold unlocked templates
      const promptMap: Record<string, Prompt> = {};
      approvedPrompts.forEach(p => { promptMap[p.id] = p; });
      mySubmissions.forEach(p => { promptMap[p.id] = p; });
      myPurchases.forEach(p => { promptMap[p.id] = p; });

      // Fetch claimable balance
      const balance = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_balance",
        args: [walletAddress]
      });

      set({
        prompts: Object.values(promptMap),
        submittedPromptIds: mySubmissions.map(p => p.id),
        purchasedPromptIds: myPurchases.map(p => p.id),
        claimableBalance: String(balance)
      });
    } catch (e) {
      console.error("Failed to sync on-chain state:", e);
    }
  },

  submitPrompt: async (title, description, category, targetModel, price, promptTemplate, preview, testCases) => {
    const { isRealContractConnected, walletAddress } = get();
    const promptId = "prompt_" + Math.random().toString(36).substring(2, 11);

    if (isRealContractConnected && walletAddress) {
      try {
        const mmClient = getGenLayerClient(walletAddress as `0x${string}`);
        
        // Write contract call
        const txHash = await mmClient.writeContract({
          address: CONTRACT_ADDRESS,
          functionName: "submit_prompt",
          args: [
            promptId,
            title,
            description,
            category,
            targetModel,
            price,
            promptTemplate,
            preview,
            testCases
          ]
        });

        // Wait for consensus finalization (AI reviewing takes 30-60s)
        await mmClient.waitForTransactionReceipt({
          hash: txHash,
          status: "ACCEPTED" as any,
          retries: 30,
          interval: 4000
        });

        await get().syncOnChainState();
        return true;
      } catch (e) {
        console.error("On-chain submit failed, running local simulator fallback...", e);
      }
    }

    // Local Simulation Mock Logic
    const promptRating = Math.floor(Math.random() * 150) + 350; // Random rating 3.50-5.00
    const isApproved = promptRating >= 400;

    const newPrompt: Prompt = {
      id: promptId,
      seller: walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      title,
      description,
      category,
      target_model: targetModel,
      price: String(price),
      prompt_template: promptTemplate,
      preview,
      test_cases: testCases,
      ai_rating: String(promptRating),
      ai_review: isApproved 
        ? "Excellent test coverage. The prompt outputs are highly structured, reliable, and showcase unique edge-case safety configurations."
        : "Rejected. The prompt instructions are too basic and lack comprehensive formatting variables. Outputs under-performed on test-case checks.",
      status: isApproved ? "approved" : "rejected",
      total_sales: "0",
      created_at: String(Math.floor(Date.now() / 1000)),
      re_evaluation_count: "0"
    };

    const currentPrompts = [...get().prompts, newPrompt];
    const currentSubmissions = [...get().submittedPromptIds, promptId];

    set({
      prompts: currentPrompts,
      submittedPromptIds: currentSubmissions
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("promptmarket_prompts", JSON.stringify(currentPrompts));
      localStorage.setItem(`submissions_${walletAddress}`, JSON.stringify(currentSubmissions));
    }

    return true;
  },

  purchasePrompt: async (promptId, price) => {
    const { isRealContractConnected, walletAddress } = get();
    
    if (isRealContractConnected && walletAddress) {
      try {
        const mmClient = getGenLayerClient(walletAddress as `0x${string}`);
        
        const txHash = await mmClient.writeContract({
          address: CONTRACT_ADDRESS,
          functionName: "purchase_prompt",
          args: [promptId],
          value: price // payable amount
        });

        await mmClient.waitForTransactionReceipt({
          hash: txHash,
          status: "ACCEPTED" as any
        });

        await get().syncOnChainState();
        return true;
      } catch (e) {
        console.error("On-chain purchase failed, running local simulator fallback...", e);
      }
    }

    // Local Simulation Mock Logic
    const prompt = get().prompts.find(p => p.id === promptId);
    if (!prompt) return false;

    // Update sales and total volume
    const updatedSales = String(parseInt(prompt.total_sales) + 1);
    const updatedPrompts = get().prompts.map(p => 
      p.id === promptId ? { ...p, total_sales: updatedSales } : p
    );

    const currentPurchases = [...get().purchasedPromptIds, promptId];

    // Add 80% to seller mock balance if they are connected
    if (prompt.seller === walletAddress) {
      const currentClaimable = BigInt(get().claimableBalance);
      const sellerShare = (price * BigInt(80)) / BigInt(100);
      set({ claimableBalance: String(currentClaimable + sellerShare) });
    }

    set({
      prompts: updatedPrompts,
      purchasedPromptIds: currentPurchases
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("promptmarket_prompts", JSON.stringify(updatedPrompts));
      localStorage.setItem(`purchases_${walletAddress}`, JSON.stringify(currentPurchases));
    }

    return true;
  },

  reEvaluatePrompt: async (promptId, newTemplate, newPreview) => {
    const { isRealContractConnected, walletAddress } = get();

    if (isRealContractConnected && walletAddress) {
      try {
        const mmClient = getGenLayerClient(walletAddress as `0x${string}`);
        const txHash = await mmClient.writeContract({
          address: CONTRACT_ADDRESS,
          functionName: "re_evaluate",
          args: [promptId, newTemplate, newPreview]
        });

        await mmClient.waitForTransactionReceipt({
          hash: txHash,
          status: "ACCEPTED" as any,
          retries: 30,
          interval: 4000
        });

        await get().syncOnChainState();
        return true;
      } catch (e) {
        console.error("On-chain re-evaluation failed, running local simulator fallback...", e);
      }
    }

    // Local Simulation Mock Logic
    const prompt = get().prompts.find(p => p.id === promptId);
    if (!prompt) return false;

    const newRating = Math.floor(Math.random() * 50) + 410; // Guaranteed pass >= 4.10 on retry
    const updatedPrompts = get().prompts.map(p => 
      p.id === promptId 
        ? {
            ...p,
            prompt_template: newTemplate,
            preview: newPreview,
            status: "approved" as const,
            ai_rating: String(newRating),
            ai_review: "Approved on re-evaluation. The prompt template structural clarity has been significantly optimized. Variable definitions are robust and fully parsed.",
            re_evaluation_count: "1"
          }
        : p
    );

    set({ prompts: updatedPrompts });

    if (typeof window !== "undefined") {
      localStorage.setItem("promptmarket_prompts", JSON.stringify(updatedPrompts));
    }

    return true;
  },

  reportPrompt: async (promptId, reason) => {
    const { isRealContractConnected, walletAddress } = get();

    if (isRealContractConnected && walletAddress) {
      try {
        const mmClient = getGenLayerClient(walletAddress as `0x${string}`);
        const txHash = await mmClient.writeContract({
          address: CONTRACT_ADDRESS,
          functionName: "report_prompt",
          args: [promptId, reason]
        });

        await mmClient.waitForTransactionReceipt({
          hash: txHash,
          status: "ACCEPTED" as any
        });

        await get().syncOnChainState();
        return true;
      } catch (e) {
        console.error("On-chain report failed, running local simulator fallback...", e);
      }
    }

    // Local Simulation Mock Logic
    // In local simulation, let's say after reporting, we flag it. If it gets reported multiple times it changes status.
    const prompt = get().prompts.find(p => p.id === promptId);
    if (!prompt) return false;

    // Simulate community report taking it down if reported
    const updatedPrompts = get().prompts.map(p => 
      p.id === promptId 
        ? { ...p, status: "removed" as const, ai_review: `REMOVED: The community reported this prompt for: "${reason}". AI audit confirmed Terms of Service violations.` }
        : p
    );

    set({ prompts: updatedPrompts });

    if (typeof window !== "undefined") {
      localStorage.setItem("promptmarket_prompts", JSON.stringify(updatedPrompts));
    }

    return true;
  },

  withdrawEarnings: async () => {
    const { isRealContractConnected, walletAddress, claimableBalance } = get();

    if (isRealContractConnected && walletAddress) {
      try {
        const mmClient = getGenLayerClient(walletAddress as `0x${string}`);
        const txHash = await mmClient.writeContract({
          address: CONTRACT_ADDRESS,
          functionName: "withdraw",
          args: []
        });

        await mmClient.waitForTransactionReceipt({
          hash: txHash,
          status: "ACCEPTED" as any
        });

        await get().syncOnChainState();
        return true;
      } catch (e) {
        console.error("On-chain withdraw failed, running local simulator fallback...", e);
      }
    }

    // Local Simulation Mock Logic
    if (claimableBalance === "0") return false;
    set({ claimableBalance: "0" });
    return true;
  }
}));
