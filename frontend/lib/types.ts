export interface Prompt {
  id: string;
  seller: string;
  title: string;
  description: string;
  category: "coding" | "writing" | "marketing" | "design" | "data";
  target_model: "GPT-4" | "Claude" | "Generic" | string;
  price: string; // stored as wei string
  prompt_template: string;
  preview: string;
  test_cases: string[];
  ai_rating: string; // 0-500 representing 0.00-5.00
  ai_review: string;
  status: "pending" | "approved" | "rejected" | "removed";
  total_sales: string;
  created_at: string;
  re_evaluation_count: string;
}

export interface ReviewVerdict {
  rating: number;
  review: string;
  approve: boolean;
  weaknesses: string[];
}
