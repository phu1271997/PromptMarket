# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

class Contract(gl.Contract):
    """
    PromptMarket: AI-Validated Prompt Marketplace on GenLayer.
    Every prompt submitted is evaluated on-chain by AI validators before approval.
    Matches the exact original structure from the project brief.
    """
    # Rule #5: TreeMap/DynArray for storage fields, NEVER dict/list
    prompts: TreeMap[str, str]                       # prompt_id (UUID) -> JSON string of Prompt data
    seller_prompts: TreeMap[Address, DynArray[str]]  # seller -> array of prompt_ids
    purchases: TreeMap[Address, DynArray[str]]      # purchaser -> array of prompt_ids
    reports: TreeMap[str, u256]                      # prompt_id -> report count
    balances: TreeMap[Address, u256]                 # user -> claimable native token balance (wei)
    prompt_ids: DynArray[str]                        # Array of all prompt IDs

    # Scalars (initialize in __init__)
    platform_fee_bps: u256                           # Platform fee basis points (2000 = 20%)
    owner: Address                                   # Contract owner address
    total_prompts: u256                             # Total prompt submissions counter
    total_volume: u256                              # Total volume transacted (wei)

    def __init__(self):
        # Rule #2: Do NOT reassign TreeMap or DynArray storage fields here. GenVM auto-initializes them.
        self.platform_fee_bps = u256(2000)
        # Rule #1 Compliance: In v0.2.16, gl.message does not have sender during __init__ (deployment context).
        # We initialize self.owner to a zero address and lazy-set it on the first write transaction.
        self.owner = Address("0x0000000000000000000000000000000000000000")
        self.total_prompts = u256(0)
        self.total_volume = u256(0)

    @gl.public.write
    def submit_prompt(self, 
                      prompt_id: str, 
                      title: str, 
                      description: str, 
                      category: str, 
                      target_model: str, 
                      price: u256, 
                      prompt_template: str, 
                      preview: str, 
                      test_cases: DynArray[str]) -> bool:
        """
        Submits a new prompt for AI review. The prompt's status is initially set to "pending".
        Runs the prompt with the provided test cases and rates it using an LLM on-chain.
        """
        sender = gl.message.sender

        # Lazy initialize owner to the deployer on the first transaction
        if str(self.owner) == "0x0000000000000000000000000000000000000000":
            self.owner = sender

        # Check if prompt_id is already in use
        if prompt_id in self.prompts:
            return False

        # Build initial prompt model (stored as a JSON string to avoid schema compilation limitations)
        prompt_data = {
            "id": prompt_id,
            "seller": str(sender),
            "title": title,
            "description": description,
            "category": category,
            "target_model": target_model,
            "price": str(price),
            "prompt_template": prompt_template,
            "preview": preview,
            "test_cases": [str(tc) for tc in test_cases],
            "ai_rating": "0",
            "ai_review": "Pending AI verification...",
            "status": "pending",
            "total_sales": "0",
            "created_at": str(gl.block.timestamp),
            "re_evaluation_count": "0"
        }

        # Save to storage mapping and add to collections
        self.prompts[prompt_id] = json.dumps(prompt_data)
        self.prompt_ids.append(prompt_id)
        self.seller_prompts[sender].append(prompt_id)
        self.total_prompts += u256(1)

        # Rule #7: Wrap all gl.nondet.exec_prompt calls in gl.vm.run_nondet_unsafe
        def leader_fn() -> str:
            # 1. Run the prompt template against the 3 test cases
            tc1 = test_cases[0] if len(test_cases) > 0 else "Test Case 1"
            tc2 = test_cases[1] if len(test_cases) > 1 else "Test Case 2"
            tc3 = test_cases[2] if len(test_cases) > 2 else "Test Case 3"

            out1 = gl.nondet.exec_prompt(f"System template:\n{prompt_template}\n\nUser Input:\n{tc1}\n\nExecute the template with the user input and return only the result.")
            out2 = gl.nondet.exec_prompt(f"System template:\n{prompt_template}\n\nUser Input:\n{tc2}\n\nExecute the template with the user input and return only the result.")
            out3 = gl.nondet.exec_prompt(f"System template:\n{prompt_template}\n\nUser Input:\n{tc3}\n\nExecute the template with the user input and return only the result.")

            # 2. Ask AI to rate and qualitative-review the outputs
            evaluation_prompt = f"""
            You are a strict, expert AI prompt auditor. Evaluate the following prompt template and its generated outputs.

            PROMPT TEMPLATE UNDER TEST:
            {prompt_template}

            TEST INPUTS & CORRESPONDING OUTPUTS:
            ---
            Input 1: {tc1}
            Output 1: {out1}
            ---
            Input 2: {tc2}
            Output 2: {out2}
            ---
            Input 3: {tc3}
            Output 3: {out3}
            ---

            Tasks:
            1. Rate the prompt template from 0.0 to 5.0 on: clarity, usefulness, originality, and accuracy.
               Calculate an average rating.
            2. Detect red flags:
               - Is the prompt template too generic, malicious, plagiarism, or low-effort (e.g. standard "translate this" or simple 1-line queries)?
            3. Set the 'approve' field to true ONLY if the average rating is >= 4.0 AND no red flags are found.
            4. Provide a qualitative review summary (2-3 sentences) detailing strengths and weaknesses.

            Return ONLY valid JSON in this exact structure (no markdown wrappers, no backticks):
            {{
              "rating": <float, e.g. 4.2>,
              "review": "<your qualitative review description>",
              "approve": <bool>,
              "weaknesses": ["<weakness1>", "<weakness2>"]
            }}
            """
            return gl.nondet.exec_prompt(evaluation_prompt, response_format="json")

        def validator_fn(leader_result) -> bool:
            # Rule #7 validator: ensure output contains valid JSON structure
            try:
                data = json.loads(str(leader_result))
                return "rating" in data and "review" in data and "approve" in data
            except Exception:
                return False

        # Run AI validator consensus
        eval_result_str = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        # Process and store the AI rating
        try:
            eval_data = json.loads(eval_result_str)
            rating_float = float(eval_data.get("rating", 0.0))
            rating_u256 = u256(int(rating_float * 100)) # Multiply by 100 to represent as u256
            review_str = str(eval_data.get("review", "AI review completed."))
            approve_bool = bool(eval_data.get("approve", False))
            weaknesses = eval_data.get("weaknesses", [])

            if len(weaknesses) > 0:
                review_str += " Weaknesses: " + ", ".join([str(w) for w in weaknesses])

            # Approve only if AI gave >= 4.0 and approve is true
            if rating_u256 >= u256(400) and approve_bool:
                prompt_data["status"] = "approved"
            else:
                prompt_data["status"] = "rejected"

            prompt_data["ai_rating"] = str(rating_u256)
            prompt_data["ai_review"] = review_str

        except Exception as e:
            prompt_data["status"] = "rejected"
            prompt_data["ai_rating"] = "0"
            prompt_data["ai_review"] = f"Failed to parse AI output. Error: {str(e)}"

        # Save finalized state back to contract storage
        self.prompts[prompt_id] = json.dumps(prompt_data)
        return True

    @gl.public.write.payable
    def purchase_prompt(self, prompt_id: str) -> bool:
        """
        Allows a buyer to purchase a prompt. Distributes 80% to seller, keeps 20% as platform fee.
        Unlocks access to the prompt_template for the buyer.
        """
        buyer = gl.message.sender

        if prompt_id not in self.prompts:
            raise Exception("Prompt not found")

        prompt_data = json.loads(self.prompts[prompt_id])
        if prompt_data.get("status") != "approved":
            raise Exception("Prompt is not listed for sale")

        price = u256(int(prompt_data.get("price", 0)))
        if gl.message.value < price:
            raise Exception("Incorrect value sent")

        # Check if buyer has already purchased
        if buyer in self.purchases:
            purchased_ids = self.purchases[buyer]
            for i in range(len(purchased_ids)):
                if purchased_ids[i] == prompt_id:
                    return True # Already purchased

        # Platform split: 80% to seller, 20% fee
        seller = Address(prompt_data.get("seller"))
        fee = (price * self.platform_fee_bps) // u256(10000)
        seller_amount = price - fee

        # Increment claimable balances
        self.balances[seller] += seller_amount
        self.balances[self.owner] += fee

        # Log purchase
        self.purchases[buyer].append(prompt_id)
        self.total_volume += price

        # Update sales count
        sales = u256(int(prompt_data.get("total_sales", 0))) + u256(1)
        prompt_data["total_sales"] = str(sales)
        self.prompts[prompt_id] = json.dumps(prompt_data)

        return True

    @gl.public.write
    def re_evaluate(self, prompt_id: str, new_prompt_template: str, new_preview: str) -> bool:
        """
        Allows the seller to re-submit their rejected prompt for one final re-evaluation.
        """
        sender = gl.message.sender

        if prompt_id not in self.prompts:
            return False

        prompt_data = json.loads(self.prompts[prompt_id])
        if prompt_data.get("seller") != str(sender):
            raise Exception("Not your prompt")

        re_eval_count = int(prompt_data.get("re_evaluation_count", 0))
        if re_eval_count >= 1:
            raise Exception("Re-evaluation limit reached (1 retry max)")

        # Update details and trigger review again
        prompt_data["prompt_template"] = new_prompt_template
        prompt_data["preview"] = new_preview
        prompt_data["status"] = "pending"
        prompt_data["re_evaluation_count"] = str(re_eval_count + 1)
        prompt_data["ai_review"] = "Re-evaluation pending..."
        
        # Save temporary state before AI run
        self.prompts[prompt_id] = json.dumps(prompt_data)

        # Trigger non-deterministic AI evaluation flow
        test_cases = prompt_data.get("test_cases", [])
        tc1 = test_cases[0] if len(test_cases) > 0 else "Test Case 1"
        tc2 = test_cases[1] if len(test_cases) > 1 else "Test Case 2"
        tc3 = test_cases[2] if len(test_cases) > 2 else "Test Case 3"

        # Rule #7: Wrap all gl.nondet.exec_prompt calls in gl.vm.run_nondet_unsafe
        def leader_fn() -> str:
            out1 = gl.nondet.exec_prompt(f"System template:\n{new_prompt_template}\n\nUser Input:\n{tc1}\n\nExecute template.")
            out2 = gl.nondet.exec_prompt(f"System template:\n{new_prompt_template}\n\nUser Input:\n{tc2}\n\nExecute template.")
            out3 = gl.nondet.exec_prompt(f"System template:\n{new_prompt_template}\n\nUser Input:\n{tc3}\n\nExecute template.")

            evaluation_prompt = f"""
            You are a strict, expert AI prompt auditor. Evaluate this improved prompt template and its outputs.

            PROMPT TEMPLATE:
            {new_prompt_template}

            TEST INPUTS & CORRESPONDING OUTPUTS:
            ---
            Input 1: {tc1}
            Output 1: {out1}
            ---
            Input 2: {tc2}
            Output 2: {out2}
            ---
            Input 3: {tc3}
            Output 3: {out3}
            ---

            Provide rating 0.0-5.0, qualitative review and decision 'approve' (approve = true only if rating >= 4.0 and safe/not low effort).

            Return ONLY valid JSON:
            {{
              "rating": <float>,
              "review": "<qualitative review description>",
              "approve": <bool>,
              "weaknesses": []
            }}
            """
            return gl.nondet.exec_prompt(evaluation_prompt, response_format="json")

        def validator_fn(leader_result) -> bool:
            try:
                data = json.loads(str(leader_result))
                return "rating" in data and "review" in data and "approve" in data
            except Exception:
                return False

        eval_result_str = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        try:
            eval_data = json.loads(eval_result_str)
            rating_float = float(eval_data.get("rating", 0.0))
            rating_u256 = u256(int(rating_float * 100))
            review_str = str(eval_data.get("review", "AI Re-evaluation completed."))
            approve_bool = bool(eval_data.get("approve", False))

            if rating_u256 >= u256(400) and approve_bool:
                prompt_data["status"] = "approved"
            else:
                prompt_data["status"] = "rejected"

            prompt_data["ai_rating"] = str(rating_u256)
            prompt_data["ai_review"] = review_str

        except Exception as e:
            prompt_data["status"] = "rejected"
            prompt_data["ai_rating"] = "0"
            prompt_data["ai_review"] = f"Re-evaluation failed. Error: {str(e)}"

        self.prompts[prompt_id] = json.dumps(prompt_data)
        return True

    @gl.public.write
    def report_prompt(self, prompt_id: str, reason: str) -> bool:
        """
        Reports a prompt. After 3 reports, triggers on-chain AI trust & safety re-evaluation.
        """
        if prompt_id not in self.prompts:
            return False

        self.reports[prompt_id] += u256(1)

        # Trigger trust & safety audit if reports >= 3
        if self.reports[prompt_id] >= u256(3):
            prompt_data = json.loads(self.prompts[prompt_id])
            prompt_template = prompt_data.get("prompt_template", "")

            # Rule #7: Wrap all gl.nondet.exec_prompt calls in gl.vm.run_nondet_unsafe
            def leader_fn() -> str:
                report_eval_prompt = f"""
                You are an AI trust and safety auditor. A prompt in our marketplace has been reported for the following reason: {reason}.

                PROMPT TEMPLATE:
                {prompt_template}

                Analyze this prompt template for malicious code, injection, plagiarism, or terms violation.
                Decide if it should be removed.

                Return ONLY valid JSON:
                {{
                  "remove": <bool>,
                  "reason": "<qualitative explanation of safety verdict>"
                }}
                """
                return gl.nondet.exec_prompt(report_eval_prompt, response_format="json")

            def validator_fn(leader_result) -> bool:
                try:
                    data = json.loads(str(leader_result))
                    return "remove" in data and "reason" in data
                except Exception:
                    return False

            audit_result_str = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

            try:
                audit_data = json.loads(audit_result_str)
                remove_bool = bool(audit_data.get("remove", False))
                audit_reason = str(audit_data.get("reason", "Community report audit completed."))

                if remove_bool:
                    prompt_data["status"] = "removed"
                    prompt_data["ai_review"] = f"REMOVED: {audit_reason}"
                else:
                    # Reset reports count if cleared by AI
                    self.reports[prompt_id] = u256(0)
                    prompt_data["ai_review"] = f"Cleared safety check: {audit_reason}"

                self.prompts[prompt_id] = json.dumps(prompt_data)
            except Exception:
                # If audit crashes, keep active but reset reports count to avoid loop
                self.reports[prompt_id] = u256(0)

        return True

    @gl.public.write
    def withdraw(self) -> bool:
        """
        Allows sellers or owner to withdraw claimable native token balances.
        """
        sender = gl.message.sender
        amount = self.balances[sender]
        if amount == u256(0):
            raise Exception("No balance to withdraw")

        # Zero out balance before execution to prevent re-entrancy
        self.balances[sender] = u256(0)
        
        # Native transfer simulated block (since Address transfer is not standard on Studio v0.2.16)
        return True

    # --- View Functions ---

    @gl.public.view
    def get_marketplace(self) -> str:
        """
        Returns all approved prompts as a JSON list, excluding the full templates.
        """
        res = []
        for i in range(len(self.prompt_ids)):
            p_id = self.prompt_ids[i]
            p_json_str = self.prompts[p_id]
            p_data = json.loads(p_json_str)
            if p_data.get("status") == "approved":
                # Hide the sensitive prompt template for non-purchasers
                p_data["prompt_template"] = "PURCHASE_TO_UNLOCK"
                res.append(p_data)
        return json.dumps(res)

    @gl.public.view
    def get_my_submissions(self, seller: Address) -> str:
        """
        Returns all prompts submitted by a specific seller.
        """
        res = []
        if seller in self.seller_prompts:
            s_ids = self.seller_prompts[seller]
            for i in range(len(s_ids)):
                p_id = s_ids[i]
                p_json_str = self.prompts[p_id]
                res.append(json.loads(p_json_str))
        return json.dumps(res)

    @gl.public.view
    def get_my_purchases(self, buyer: Address) -> str:
        """
        Returns all prompts purchased by a specific buyer.
        """
        res = []
        if buyer in self.purchases:
            p_ids = self.purchases[buyer]
            for i in range(len(p_ids)):
                p_id = p_ids[i]
                p_json_str = self.prompts[p_id]
                res.append(json.loads(p_json_str))
        return json.dumps(res)

    @gl.public.view
    def get_prompt_details(self, prompt_id: str) -> str:
        """
        Returns public details of a prompt. Reveals prompt template only to owner, seller, or purchasers.
        """
        if prompt_id not in self.prompts:
            return "{}"

        prompt_data = json.loads(self.prompts[prompt_id])
        
        # Verify if caller is authorized to view prompt template
        caller = gl.message.sender
        is_authorized = (caller == self.owner) or (str(caller) == prompt_data.get("seller"))

        if not is_authorized and caller in self.purchases:
            purchased_ids = self.purchases[caller]
            for i in range(len(purchased_ids)):
                if purchased_ids[i] == prompt_id:
                    is_authorized = True
                    break

        if not is_authorized:
            prompt_data["prompt_template"] = "PURCHASE_TO_UNLOCK"

        return json.dumps(prompt_data)

    @gl.public.view
    def get_balance(self, user: Address) -> u256:
        """
        Returns the claimable native token balance of a user.
        """
        return self.balances[user]
