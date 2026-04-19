import React, { useState } from "react";
import { CreditCard, Rocket, ShieldCheck, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { cn } from "@/lib/utils";

const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY || "");

export function PaymentButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Checkout URL was not returned");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className={cn(
          "relative group overflow-hidden px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3",
          isLoading && "animate-pulse"
        )}
      >
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        {isLoading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <CreditCard size={20} />
        )}
        <div className="flex flex-col items-start leading-tight">
          <span className="text-xs font-normal opacity-80">One-time payment</span>
          <span className="text-lg">Get Lifetime Access • $100</span>
        </div>
      </button>

      <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-green-500" />
          Secure Checkout
        </div>
        <div className="flex items-center gap-2">
          <Rocket size={14} className="text-orange-400" />
          Instant Activation
        </div>
      </div>
      
      {error && (
        <p className="text-xs font-bold text-red-500 mt-2 bg-red-50 px-3 py-1 rounded-full border border-red-100">
          {error}
        </p>
      )}
    </div>
  );
}
