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
    <div className="w-full max-w-4xl mx-auto p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
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
        
        <div className="flex items-center gap-3 p-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Upload photo"
          >
            <ImagePlus size={24} />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex-1 bg-slate-100 rounded-xl h-12 flex items-center px-4 border border-slate-200">
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
              placeholder="Ask a question or explain where you're stuck..."
              className="bg-transparent border-none focus:outline-none w-full text-slate-700 placeholder-slate-400 font-medium py-2 resize-none"
              disabled={disabled}
            />
          </div>

          <button
            type="submit"
            disabled={(!content.trim() && !image) || disabled}
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center transition-all shadow-lg",
              (!content.trim() && !image) || disabled
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
            )}
          >
            <Send size={20} className={cn(!disabled && "transform rotate-90")} />
          </button>
        </div>
      </form>
    </div>
  );
}
