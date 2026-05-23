# 🚀 GenLayer Studio Deployment Guide - PromptMarket

Follow these instructions strictly to deploy the **PromptMarket** Intelligent Contracts on GenLayer.

---

## ⚙️ Environment Prerequisites

- **GenLayer Studio Platform:** [https://studio.genlayer.com/run-debug](https://studio.genlayer.com/run-debug)
- **Target Compiler Version:** `v0.2.16` (Mandatory)
- **GenLayer Chrome Extension Wallet:** MetaMask configured to GenLayer Studio Testnet

---

## 🛠️ Step-by-Step Deployment Procedure

### ⚠️ IMPORTANT: Clear Stale State First
GenLayer Studio caches contract schemas aggressively. To prevent initialization errors:
1. Open GenLayer Studio.
2. In the top right bar, click **Settings (Gear Icon) &rarr; Reset Storage &rarr; Confirm**.
3. Perform a hard refresh of your browser (`Cmd+Shift+R` on Mac, `Ctrl+Shift+F5` on Windows).

---

### Step 1: Deploy `contracts/storage_test.py` (Sanity Check)
Before deploying the main contract, deploy the minimal `storage_test.py` to confirm the compiler version matches:
1. In GenLayer Studio, click **New Contract** or edit `storage_test.py`.
2. Copy and paste the complete content of [storage_test.py](file:///Users/peter/AI/PromptMarket/contracts/storage_test.py).
3. Click the **Deploy** button in the top menu.
4. Verify the compilation returns **Result: SUCCESS**.
5. Call the `increment("test")` write method and verify the counter updates successfully.

---

### Step 2: Deploy `contracts/prompt_market.py` (Main Contract)
Once the sanity check succeeds:
1. Create a new contract file named `prompt_market.py` in GenLayer Studio.
2. Paste the complete content of [prompt_market.py](file:///Users/peter/AI/PromptMarket/contracts/prompt_market.py).
3. Verify that **Line 1** is exactly:
   ```python
   # v0.2.16
   ```
   and **Line 2** is exactly:
   ```python
   # { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
   ```
4. Click **Deploy**.
5. Under the transaction block in the sidebar, verify the status displays **Result: SUCCESS** (not just `FINALIZED`).
6. Copy the newly generated contract address (e.g. `0xaCcF8997cFE554fC230026FCAeeD5D152dEc2c99`).

---

### Step 3: Link Contract to Frontend
1. Open the [frontend/.env.local](file:///Users/peter/AI/PromptMarket/frontend/.env.local) file (or create it if it doesn't exist).
2. Add your contract address as:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddressHere
   ```
3. Restart your Next.js dev server:
   ```bash
   cd frontend && npm run dev
   ```

---

## 🩺 Troubleshooting Common Error Patterns

If you encounter issues during compilation or execution, refer to this table:

| Symptom | Root Cause | Actionable Fix |
|:---|:---|:---|
| **`Contract Queues not found`** or **`Contract IdlenessPhase not found`** | Compiler fell back to `v0.1.0` due to missing version flags. | Apply **Rule #1**: Ensure the first two lines contain exactly `# v0.2.16` and the `# { "Depends": ... }` comment. |
| **`AssertionError: TreeMap <- TreeMap`** | You initialized/reassigned `self.history = TreeMap()` inside the `__init__` constructor. | Apply **Rule #2**: Remove all TreeMap or DynArray assignments inside `__init__`. GenVM initializes them automatically. |
| **`Schema compilation error`** | You defined a `float`, `dict`, `list`, or a custom class in a `@gl.public` method signature. | Apply **Rules #3 & #4**: Remove floats or custom classes from public signatures. Use `str` or sized integers (e.g. `u256`). |
| **`gl.nondet not callable`** | You called `gl.nondet.exec_prompt` or `gl.nondet.web.render` directly inside a write method. | Apply **Rule #7**: Wrap all non-deterministic logic in a nested leader function and invoke it using `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`. |
| **"Not deployed yet" despite `FINALIZED` tx status** | The transaction block was finalized, but the VM execution failed (threw an exception). | Click on the transaction in the sidebar history, and read the Python traceback to identify the runtime error. |
