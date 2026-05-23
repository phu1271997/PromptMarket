# 🚀 PromptMarket: AI-Validated Prompt Marketplace on GenLayer

PromptMarket is a **decentralized, premium prompt marketplace** built on the GenLayer blockchain. 

Unlike traditional prompt platforms (like PromptBase) which suffer from low-quality, generic, or plagiarism-ridden listings, PromptMarket automatically filters all templates through a **decentralized, multi-agent AI validator pipeline** directly on-chain before approving them for public listing.

---

## 🏗️ Architecture Flow Diagram

```
+------------+        1. Submit Prompt + 3 Test Inputs        +-----------------------+
|   Seller   | ---------------------------------------------> |   Intelligent         |
+------------+                                                |   Contract            |
                                                              +-----------------------+
                                                                          |
                                                                          | 2. Triggers Consensus
                                                                          v
+------------+                                                +-----------------------+
|   Market   | <--------------------------------------------- |   GenVM Consensus     |
|   Listed   |             Status: "approved"                 |   (Multi-Agent LLM)   |
+------------+         (If Quality Rating >= 4.0/5.0)          +-----------------------+
      |                                                                   |
      | 4. Payable Purchase                                               | Status: "rejected"
      v                                                                   v
+------------+             5. Payout Split                    +-----------------------+
|   Buyer    | ---------------------------------------------> |   Prompt Rejected     |
| (Unlocked) |           (80% Seller / 20% Fee)               |   (Provides Feedback) |
+------------+                                                +-----------------------+
```

---

## 🛠️ Technology Stack

- **Smart Contracts (Backend):** Python (GenLayer Intelligent Contract) matching GenLayer SDK `v0.2.16`
- **Contract Environment:** GenLayer Studio (`https://studio.genlayer.com/run-debug`)
- **Web App (Frontend):** Next.js 14 (App Router) + TypeScript + Zustand (State)
- **Styling:** TailwindCSS + Shadcn/ui custom borders
- **Blockchain Integration:** `genlayer-js` SDK

---

## ⚙️ Quick Start & Setup

### 1. Smart Contract Deployment
To deploy the smart contract on GenLayer Studio, read the detailed [Deployment Guide](file:///Users/peter/AI/PromptMarket/scripts/deploy.md).

### 2. Frontend Local Installation
To launch the dApp frontend locally:
```bash
# Navigate to the frontend directory
cd frontend

# Install package dependencies
npm install

# Run the local Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app features a complete **Dev Studio Simulation Fallback** that functions out-of-the-box, allowing you to test the complete user experience interactively even if you haven't deployed the smart contract yet!

---

## 🧪 Testing Scenarios & Walkthroughs

Use these four walkthroughs to fully test the application capabilities:

### Scenario 1: The Happy Path (Approved Submission & Purchase)
1. **Connect Wallet:** Click **Connect MetaMask** in the top right.
2. **Browse:** Filter through the premium, approved listings in the marketplace grid.
3. **Submit:** Navigate to **Submit Prompt**. Fill in details:
   - **Title:** "Elite Tailwind UI Builder"
   - **Price:** `0.05` GEN
   - **Secret Template:** `System: You are an expert Tailwind frontend developer...`
   - **Test inputs:** Provide 3 distinct React component design prompts.
4. **AI Review:** Click **Submit**. The modal displays the real-time GenLayer VM consensus progress timeline.
5. **Approval:** The AI Validator gives it a `4.80` rating. The prompt is approved and listed!
6. **Purchase:** Switch role to **Browse Prompts**, navigate to the prompt detail page, click **Unlock Full Prompt** and complete MetaMask confirmation. The full prompt is instantly unlocked with a copy widget!

---

### Scenario 2: The Rejection Path (Low-effort Submission)
1. Go to **Submit Prompt**.
2. Submit a lazy/generic prompt:
   - **Title:** "Translate Prompt"
   - **Price:** `0.01` GEN
   - **Secret Template:** `Translate this text to Spanish.`
   - **Test inputs:** "Hello", "How are you", "Good morning".
3. Click **Submit** and watch the consensus pipeline run.
4. **Verdict:** The AI validator detects that the template is "extremely low-effort and generic", rates it `2.50/5.00` and sets status to **Rejected**. The listing is hidden from the public marketplace.

---

### Scenario 3: Re-evaluation (1 Retry Max)
1. Navigate to the **Seller Dashboard** (My Prompts).
2. Locate your rejected translation prompt under **My Submissions**.
3. Click **Retry (Re-evaluate)**.
4. Improve the template inside the modal:
   - **New Template:** `System: You are a professional Spanish translator. Adopt a polite business tone, preserve all HTML/Markdown formatting tags, and provide alternative regional variations...`
5. Click **Submit for Re-evaluation**.
6. **Verdict:** The AI validator runs the consensus audit on the improved template, scores it `4.20/5.00`, and automatically promotes it to **Approved**!

---

### Scenario 4: Community Reporting & AI Take-down
1. Browse to any approved prompt detail page.
2. Under the purchase box, look at the **Community Safety Center**.
3. Click **Report Prompt**. Type a serious reason (e.g. `plagiarism / scam code`).
4. Submit the report. (Repeat this in a real contract 3 times from different addresses, or simulate).
5. When report count reaches 3, the Intelligent Contract automatically triggers an **AI Trust & Safety audit** on-chain.
6. The AI auditor flags the prompt and sets status to **Removed**, protecting the marketplace!
