"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  time: string;
}

const suggestedQuestions = [
  "What skills should I learn next?",
  "How can I improve my portfolio?",
  "Suggest freelancing platforms",
  "Review my recent submission",
];

export function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);

  const [input, setInput] = useState("");

  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load previous chat history

  useEffect(() => {
    loadHistory();
  }, []);

  // Auto scroll

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, isTyping]);

  const loadHistory = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch("/api/chat/history", {
        method: "GET",

        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      const formattedMessages = (data.messages || []).map((msg: any) => ({
        id: msg.id,

        role: msg.role,

        content: msg.message,

        time: new Date(msg.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("History loading error:", error);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now(),

      role: "user",

      content: text,

      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);

    setInput("");

    setIsTyping(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("User session not found");
      }

      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${session.access_token}`,
        },

        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Chat failed");
      }

      const aiMsg: Message = {
        id: Date.now() + 1,

        role: "assistant",

        content: data.reply || "No response received.",

        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,

        {
          id: Date.now() + 2,

          role: "assistant",

          content: error.message || "Something went wrong.",

          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Card className="flex flex-col h-[100%] border-border/50">
      <div className="border-b border-border/50 p-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>

        <div>
          <h3 className="font-semibold text-foreground text-sm">
            AI Career Assistant
          </h3>

          <p className="text-xs text-emerald-600">Online</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4" ref={scrollRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" && "flex-row-reverse",
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className={cn(
                    "text-xs",
                    msg.role === "assistant"
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",

                  msg.role === "assistant"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>

                <p
                  className={cn(
                    "text-[10px] mt-1",

                    msg.role === "assistant"
                      ? "text-muted-foreground"
                      : "text-primary-foreground/70",
                  )}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>

              <div className="bg-secondary rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />

                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />

                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border/50 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="flex items-center gap-1 rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Sparkles className="h-3 w-3" />

              {q}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Ask your AI assistant..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            className="flex-1"
          />

          <Button
            onClick={() => sendMessage(input)}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
