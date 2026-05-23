import React from "react";

interface RatingBadgeProps {
  rating: string | number; // 0-500 representing 0.00-5.00
  size?: "sm" | "md" | "lg";
}

export default function RatingBadge({ rating, size = "md" }: RatingBadgeProps) {
  const numericRating = typeof rating === "string" ? parseFloat(rating) / 100 : rating / 100;
  
  let colorClasses = "";
  if (numericRating >= 4.5) {
    colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
  } else if (numericRating >= 4.0) {
    colorClasses = "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
  } else {
    colorClasses = "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold rounded-md border",
    md: "px-2.5 py-1 text-sm font-semibold rounded-lg border",
    lg: "px-3.5 py-1.5 text-base font-bold rounded-xl border",
  };

  return (
    <div className={`inline-flex items-center gap-1 font-mono tracking-tight ${sizeClasses[size]} ${colorClasses}`}>
      <span>★</span>
      <span>{numericRating.toFixed(2)}</span>
    </div>
  );
}
