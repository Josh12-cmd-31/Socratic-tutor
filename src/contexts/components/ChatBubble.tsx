import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, LineChart as ChartIcon } from "lucide-react";
import type { Message } from "@/lib/gemini";
import { useState } from "react";
import { MathChart } from "./MathChart";

interface ChatBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onTermClick?: (term: string) => void;
}

export function ChatBubble({ message, isStreaming, onTermClick }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  // Process content to replace [[Term]] with a clickable format
  const processedContent = message.content.replace(/\[\[(.*?)\]\]/g, (_, p1) => `[${p1}](glossary:${p1})`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full mb-8",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
        isUser ? "bg-orange-100 ml-4" : "bg-indigo-100 mr-4"
      )}>
        <span className="text-lg">{isUser ? "🎒" : "🎓"}</span>
      </div>

      <div
        className={cn(
          "max-w-[90%] md:max-w-[70%] space-y-3",
          isUser ? "items-end flex flex-col" : "items-start flex flex-col"
        )}
      >
        <div
          className={cn(
            "p-3.5 md:p-5 rounded-2xl shadow-sm border",
            isUser
              ? "bg-indigo-600 text-white rounded-tr-none border-indigo-500 shadow-indigo-100"
              : "bg-white border-slate-100 text-slate-700 rounded-tl-none"
          )}
        >
          {message.image && (
            <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 bg-white p-1 shadow-inner">
              <img
                src={message.image}
                alt="Uploaded problem"
                className="max-h-[350px] w-auto object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          
          <div className={cn(
            "markdown-body",
            isUser ? "text-white font-medium" : "text-slate-700"
          )}>
            <ReactMarkdown
              components={{
                code: ({ node, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, () => "");
                  
                  if (match && match[1] === "svg") {
                    return (
                      <div 
                        className="my-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-center overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: codeString }}
                      />
                    );
                  }

                  if (match && match[1] === "chart") {
                    try {
                      const chartData = JSON.parse(codeString);
                      return <MathChart {...chartData} />;
                    } catch (e) {
                      return <code className={className} {...props}>{children}</code>;
                    }
                  }

                  return <code className={className} {...props}>{children}</code>;
                },
                a: ({ node, ...props }) => {
                  if (props.href?.startsWith("glossary:")) {
                    const term = props.href.split(":")[1];
                    return (
                      <button
                        onClick={() => onTermClick?.(term)}
                        className={cn(
                          "font-bold underline decoration-2 underline-offset-2 transition-colors",
                          isUser 
                            ? "text-white decoration-white/30 hover:decoration-white" 
                            : "text-indigo-600 decoration-indigo-200 hover:decoration-indigo-600"
                        )}
                      >
                        {props.children}
                      </button>
                    );
                  }
                  return <a {...props} />;
                }
              }}
            >
              {processedContent}
            </ReactMarkdown>
            {isStreaming && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="inline-block w-1 h-4 bg-current ml-1 align-middle"
              />
            )}
          </div>
        </div>
        
        <div className={cn(
          "text-[10px] uppercase tracking-widest font-bold opacity-70 flex items-center justify-between w-full",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <div className={cn(isUser ? "mr-1" : "ml-1")}>
            {isUser ? "You • Just now" : "Tutor Assistant • Just now"}
          </div>
          
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-2 ml-4">
              <button 
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                className={cn(
                  "p-1 rounded-md transition-all",
                  feedback === 'up' ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                )}
                title="Helpful"
              >
                <ThumbsUp size={12} className={cn(feedback === 'up' && "fill-current")} />
              </button>
              <button 
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                className={cn(
                  "p-1 rounded-md transition-all",
                  feedback === 'down' ? "text-orange-600 bg-orange-50" : "text-slate-400 hover:text-orange-600 hover:bg-slate-100"
                )}
                title="Not helpful"
              >
                <ThumbsDown size={12} className={cn(feedback === 'down' && "fill-current")} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
