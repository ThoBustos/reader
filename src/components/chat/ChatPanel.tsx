"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChatMessage, ContextMode } from "@/types";
import { QUICK_PROMPTS } from "@/lib/llm/prompts";
import { useHotkeys, SHORTCUTS } from "@/components/primitives/useHotkeys";
import {
  Send,
  Sparkles,
  Copy,
  FileText,
  BookOpen,
  MousePointer2,
  Loader2,
} from "lucide-react";

interface ChatPanelProps {
  paperId: string;
  currentPage: number;
  selectedText?: string;
  onCopyToNotes?: (content: string) => void;
}

export function ChatPanel({
  paperId,
  currentPage,
  selectedText,
  onCopyToNotes,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contextMode, setContextMode] = useState<ContextMode>("full-document");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    fetch(`/api/chat?paperId=${paperId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
        }
      })
      .catch(console.error);
  }, [paperId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Update context mode when text is selected
  useEffect(() => {
    if (selectedText) {
      setContextMode("selection");
    }
  }, [selectedText]);

  // Keyboard shortcuts
  useHotkeys(SHORTCUTS.focusChat, () => {
    inputRef.current?.focus();
  });

  useHotkeys(SHORTCUTS.toggleContext, () => {
    const modes: ContextMode[] = ["full-document", "current-page", "selection"];
    const currentIndex = modes.indexOf(contextMode);
    setContextMode(modes[(currentIndex + 1) % modes.length]);
  });

  const sendMessage = async (messageText: string = input) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
      context:
        contextMode === "selection" && selectedText
          ? { selection: selectedText }
          : contextMode === "current-page"
            ? { page: currentPage }
            : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId,
          message: messageText,
          context: userMessage.context,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: m.content + text }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Failed to send message"}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  const contextIcon = {
    "full-document": <FileText className="h-3 w-3" />,
    "current-page": <BookOpen className="h-3 w-3" />,
    selection: <MousePointer2 className="h-3 w-3" />,
  };

  const contextLabel = {
    "full-document": "Full Doc",
    "current-page": `Page ${currentPage}`,
    selection: "Selection",
  };

  return (
    <div className="flex h-full flex-col bg-[var(--surface)] border-l border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent)]" />
          <span className="font-medium text-[var(--text)]">AI Assistant</span>
        </div>
        <Badge
          variant="outline"
          className="cursor-pointer gap-1 text-xs"
          onClick={() => {
            const modes: ContextMode[] = [
              "full-document",
              "current-page",
              "selection",
            ];
            const currentIndex = modes.indexOf(contextMode);
            setContextMode(modes[(currentIndex + 1) % modes.length]);
          }}
        >
          {contextIcon[contextMode]}
          {contextLabel[contextMode]}
        </Badge>
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--border)] px-4 py-2">
        {Object.entries(QUICK_PROMPTS)
          .slice(0, 4)
          .map(([key, prompt]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => sendMessage(prompt)}
              disabled={isLoading}
            >
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
            </Button>
          ))}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-[var(--muted)]">
              Ask questions about this paper. The AI can see the full document
              including figures and tables.
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--background)] text-[var(--text)]"
                }`}
              >
                {message.context?.selection && (
                  <div className="mb-2 border-l-2 border-[var(--accent)] pl-2 text-xs italic opacity-75">
                    &quot;{message.context.selection.slice(0, 100)}
                    {message.context.selection.length > 100 ? "..." : ""}&quot;
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.role === "assistant" && message.content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 gap-1 text-xs opacity-50 hover:opacity-100"
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      onCopyToNotes?.(message.content);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-[var(--background)] px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--muted)]" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-[var(--border)] p-4">
        {selectedText && contextMode === "selection" && (
          <div className="mb-2 rounded bg-[var(--background)] p-2 text-xs text-[var(--muted)]">
            <span className="font-medium">Selected:</span> &quot;
            {selectedText.slice(0, 100)}
            {selectedText.length > 100 ? "..." : ""}&quot;
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this paper... (⌘+Enter to send)"
            className="min-h-[60px] resize-none bg-[var(--background)] text-[var(--text)]"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
