import React, { useRef, useState } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MathInputProps {
  onSendMessage: (content: string, image?: string) => void;
  disabled?: boolean;
}

export function MathInput({ onSendMessage, disabled }: MathInputProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !image) || disabled) return;
    
    onSendMessage(content, image || undefined);
    setContent("");
    setImage(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-1 md:px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-lg md:shadow-xl overflow-hidden"
      >
        {image && (
          <div className="relative inline-block m-4 p-1 bg-slate-50 rounded-lg border border-slate-200">
            <img
              src={image}
              alt="Preview"
              className="h-20 w-20 object-cover rounded-md"
            />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-2 md:gap-3 p-2 md:p-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shrink-0"
            title="Upload photo"
          >
            <ImagePlus size={24} className="md:w-6 md:h-6 w-5 h-5" />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex-1 bg-slate-100 rounded-xl min-h-[44px] md:h-12 flex items-center px-3 md:px-4 border border-slate-200">
            <textarea
              rows={1}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask a question..."
              className="bg-transparent border-none focus:outline-none w-full text-slate-700 placeholder-slate-400 font-medium py-2 resize-none text-sm md:text-base"
              disabled={disabled}
            />
          </div>

          <button
            type="submit"
            disabled={(!content.trim() && !image) || disabled}
            className={cn(
              "h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center transition-all shadow-lg shrink-0",
              (!content.trim() && !image) || disabled
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
            )}
          >
            <Send size={18} className={cn("md:w-5 md:h-5 w-4 h-4", !disabled && "transform rotate-90")} />
          </button>
        </div>
      </form>
    </div>
  );
}
