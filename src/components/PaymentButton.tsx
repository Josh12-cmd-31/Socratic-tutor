import React, { useState } from "react";
import { CreditCard, Rocket, ShieldCheck, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export function PaymentButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handlePayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!showEmailInput) {
      setShowEmailInput(true);
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initialize payment");
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Payment URL was not returned");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      {showEmailInput ? (
        <form onSubmit={handlePayment} className="w-full space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="email"
              placeholder="Enter your email to receive access"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-medium text-slate-700"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3",
              isLoading && "animate-pulse"
            )}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
            Pay $100 via Paystack
          </button>
          <button 
            type="button"
            onClick={() => setShowEmailInput(false)}
            className="w-full text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            disabled={isLoading}
          >
            Back
          </button>
        </form>
      ) : (
        <button
          onClick={() => handlePayment()}
          disabled={isLoading}
          className={cn(
            "relative group overflow-hidden px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3",
            isLoading && "animate-pulse"
          )}
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <CreditCard size={20} />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs font-normal opacity-80">One-time payment</span>
            <span className="text-lg">Get Lifetime Access • $100</span>
          </div>
        </button>
      )}

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
