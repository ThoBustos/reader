"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChatMessage, ContextMode, SaveToDocType } from "@/types";
import { QUICK_PROMPTS } from "@/lib/llm/prompts";
import { useHotkeys, SHORTCUTS } from "@/components/primitives/useHotkeys";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Sparkles,
  Copy,
  Check,
  FileText,
  BookOpen,
  MousePointer2,
  Loader2,
  Lightbulb,
  HelpCircle,
  StickyNote,
} from "lucide-react";

interface ChatPanelProps {
  paperId: string;
  currentPage: number;
  selectedText?: string;
  onCopyToNotes?: (content: string) => void;
}

// Natural language save commands
const SAVE_COMMANDS: Array<{
  pattern: RegExp;
  type: SaveToDocType;
  extractContent?: boolean;
}> = [
  { pattern: /^save (that |this )?(as )?insight/i, type: "insight" },
  { pattern: /^save (that |this )?(as )?question/i, type: "question" },
  { pattern: /^save (that |this )?(to )?notes?/i, type: "note" },
  { pattern: /^add question:?\s*(.+)/i, type: "question", extractContent: true },
  { pattern: /^highlight:?\s*(.+)/i, type: "highlight", extractContent: true },
  { pattern: /^add insight:?\s*(.+)/i, type: "insight", extractContent: true },
  { pattern: /^add note:?\s*(.+)/i, type: "note", extractContent: true },
];

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveType, setSaveType] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const copyToClipboard = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
    onCopyToNotes?.(content);
  };

  // Save content to sidecar
  const saveToDoc = async (
    type: SaveToDocType,
    content: string,
    messageId: string
  ) => {
    try {
      const res = await fetch("/api/notes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId,
          type,
          content,
          page: currentPage,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSavedId(messageId);
      setSaveType(type);
      setTimeout(() => {
        setSavedId(null);
        setSaveType(null);
      }, 2000);
    } catch (error) {
      console.error("Save to doc error:", error);
    }
  };

  // Detect natural language save commands
  const detectSaveCommand = (
    text: string
  ): { type: SaveToDocType; content?: string } | null => {
    for (const cmd of SAVE_COMMANDS) {
      const match = text.match(cmd.pattern);
      if (match) {
        if (cmd.extractContent && match[1]) {
          return { type: cmd.type, content: match[1].trim() };
        }
        // Use last assistant message content
        const lastAssistant = [...messages]
          .reverse()
          .find((m) => m.role === "assistant");
        if (lastAssistant) {
          return { type: cmd.type, content: lastAssistant.content };
        }
      }
    }
    return null;
  };

  const sendMessage = async (messageText: string = input) => {
    if (!messageText.trim() || isLoading) return;

    // Check for save commands
    const saveCmd = detectSaveCommand(messageText);
    if (saveCmd && saveCmd.content) {
      await saveToDoc(saveCmd.type, saveCmd.content, "command");
      setInput("");
      // Add confirmation message
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: messageText,
          timestamp: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `✓ Saved to ${saveCmd.type}s section.`,
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

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
    <div className="flex h-full flex-col bg-[var(--surface)]">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
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
      <div className="shrink-0 flex gap-2 overflow-x-auto border-b border-[var(--border)] px-4 py-2">
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

      {/* Messages - scrollable area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4"
      >
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-[var(--muted)] py-4">
              <p className="font-medium text-[var(--text)]">Ask questions about this paper</p>
              <div className="mt-4 text-left space-y-2 mx-auto max-w-xs">
                <p className="text-xs"><span className="text-[var(--accent)]">Pass 1:</span> "Summarize in 3-5 bullets"</p>
                <p className="text-xs"><span className="text-[var(--accent)]">Pass 2:</span> Select text → "Explain this"</p>
                <p className="text-xs"><span className="text-[var(--accent)]">Pass 3:</span> "What are the limitations?"</p>
              </div>
              <p className="mt-4 text-xs opacity-75">
                Say "save that insight" to keep notes
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={message.id || `msg-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-lg px-3 py-2 ${
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
                {message.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none text-[var(--text)] [&_*]:text-[var(--text)] [&_strong]:text-[var(--text)] [&_a]:text-[var(--primary)]">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="rounded bg-[var(--surface)] px-1 py-0.5 text-xs font-mono" {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className={`block rounded bg-[var(--surface)] p-2 text-xs font-mono overflow-x-auto ${className}`} {...props}>
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => <pre className="mb-2 overflow-x-auto">{children}</pre>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-[var(--accent)] pl-3 italic opacity-80">
                            {children}
                          </blockquote>
                        ),
                        h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] underline">
                            {children}
                          </a>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto mb-2">
                            <table className="min-w-full text-xs border-collapse">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => <th className="border border-[var(--border)] px-2 py-1 bg-[var(--surface)] font-semibold">{children}</th>,
                        td: ({ children }) => <td className="border border-[var(--border)] px-2 py-1">{children}</td>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                )}

                {/* Action buttons for assistant messages */}
                {message.role === "assistant" && message.content && !message.content.startsWith("✓") && (
                  <div className="mt-2 flex flex-wrap gap-1 border-t border-[var(--border)]/30 pt-2">
                    {/* Copy button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 text-xs opacity-50 hover:opacity-100"
                      onClick={() => copyToClipboard(message.content, message.id || `msg-${index}`)}
                    >
                      {copiedId === (message.id || `msg-${index}`) ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>

                    {/* Save to doc buttons */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 text-xs opacity-50 hover:opacity-100"
                      onClick={() => saveToDoc("insight", message.content, message.id || `msg-${index}`)}
                    >
                      {savedId === (message.id || `msg-${index}`) && saveType === "insight" ? (
                        <>
                          <Check className="h-3 w-3 text-green-500" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Lightbulb className="h-3 w-3" />
                          + Insight
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 text-xs opacity-50 hover:opacity-100"
                      onClick={() => saveToDoc("question", message.content, message.id || `msg-${index}`)}
                    >
                      {savedId === (message.id || `msg-${index}`) && saveType === "question" ? (
                        <>
                          <Check className="h-3 w-3 text-green-500" />
                          Saved
                        </>
                      ) : (
                        <>
                          <HelpCircle className="h-3 w-3" />
                          + Question
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 text-xs opacity-50 hover:opacity-100"
                      onClick={() => saveToDoc("note", message.content, message.id || `msg-${index}`)}
                    >
                      {savedId === (message.id || `msg-${index}`) && saveType === "note" ? (
                        <>
                          <Check className="h-3 w-3 text-green-500" />
                          Saved
                        </>
                      ) : (
                        <>
                          <StickyNote className="h-3 w-3" />
                          + Note
                        </>
                      )}
                    </Button>
                  </div>
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[var(--border)] p-4">
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
