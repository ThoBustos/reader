"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Sparkles,
  FileText,
  Keyboard,
  Target,
  Brain,
  CheckCircle,
  MessageSquare,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

export default function GuidePage() {
  return (
    <AppShell>
      <div className="h-full overflow-auto bg-[var(--background)]">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <h1 className="text-3xl font-bold text-[var(--text)]">Reader Guide</h1>
          <p className="mt-2 text-[var(--muted)]">
            How to read papers effectively with AI assistance.
          </p>

          {/* Quick Start */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--text)]">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              Quick Start
            </h2>
            <div className="mt-4 grid gap-3">
              <div className="flex items-start gap-3 rounded-lg bg-[var(--surface)] p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-sm font-medium">1</div>
                <div>
                  <p className="font-medium text-[var(--text)]">Add a PDF</p>
                  <p className="text-sm text-[var(--muted)]">Drag & drop or click "Add Paper" in the Library</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-[var(--surface)] p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-sm font-medium">2</div>
                <div>
                  <p className="font-medium text-[var(--text)]">Read & Ask</p>
                  <p className="text-sm text-[var(--muted)]">Use the AI chat to summarize, explain, or ask questions</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-[var(--surface)] p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-sm font-medium">3</div>
                <div>
                  <p className="font-medium text-[var(--text)]">Save Insights</p>
                  <p className="text-sm text-[var(--muted)]">Click "+ Insight" or say "save that insight" to keep notes</p>
                </div>
              </div>
            </div>
          </section>

          {/* The 3-Pass Method */}
          <section className="mt-12">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--text)]">
              <Target className="h-5 w-5 text-[var(--accent)]" />
              The 3-Pass Method
            </h2>
            <p className="mt-2 text-[var(--muted)]">
              A proven approach to reading academic papers efficiently, developed by S. Keshav.
            </p>

            {/* Pass 1 */}
            <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-2">
                <Badge className="bg-[var(--primary)]">Pass 1</Badge>
                <h3 className="font-semibold text-[var(--text)]">Quick Scan (5-10 min)</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Get a bird's-eye view. Decide if it's worth reading further.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span className="text-[var(--text)]">Read title, abstract, and introduction</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span className="text-[var(--text)]">Read section headings only</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span className="text-[var(--text)]">Glance at figures and tables</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span className="text-[var(--text)]">Read the conclusion</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded bg-[var(--background)] p-3">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-sm text-[var(--muted)]">
                  <strong className="text-[var(--text)]">AI Tip:</strong> Ask "Summarize this paper in 3-5 bullet points"
                </span>
              </div>
            </div>

            {/* Pass 2 */}
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-2">
                <Badge className="bg-[var(--primary)]">Pass 2</Badge>
                <h3 className="font-semibold text-[var(--text)]">Comprehension (30-60 min)</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Understand the main content. Don't worry about proofs or details yet.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span className="text-[var(--text)]">Read the paper with more care, but skip complex math</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span className="text-[var(--text)]">Understand figures, diagrams, and illustrations</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span className="text-[var(--text)]">Note down unfamiliar terms and questions</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span className="text-[var(--text)]">Mark relevant references to read later</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded bg-[var(--background)] p-3">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-sm text-[var(--muted)]">
                  <strong className="text-[var(--text)]">AI Tip:</strong> Select confusing text and ask "Explain this simply"
                </span>
              </div>
            </div>

            {/* Pass 3 */}
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-2">
                <Badge className="bg-[var(--primary)]">Pass 3</Badge>
                <h3 className="font-semibold text-[var(--text)]">Deep Understanding (1-5 hours)</h3>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Virtually re-implement the paper. Challenge every assumption.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span className="text-[var(--text)]">Understand every statement and proof</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span className="text-[var(--text)]">Identify implicit assumptions</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span className="text-[var(--text)]">Think about how you would present the ideas</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                  <span className="text-[var(--text)]">Note potential improvements and future work</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded bg-[var(--background)] p-3">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-sm text-[var(--muted)]">
                  <strong className="text-[var(--text)]">AI Tip:</strong> Ask "What are the limitations?" or "What would you challenge?"
                </span>
              </div>
            </div>
          </section>

          {/* AI-Assisted Reading Tips */}
          <section className="mt-12">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--text)]">
              <Brain className="h-5 w-5 text-[var(--accent)]" />
              AI-Assisted Reading Tips
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-[var(--surface)] p-4">
                <MessageSquare className="h-5 w-5 shrink-0 text-[var(--primary)] mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--text)]">Use Quick Prompts</p>
                  <p className="text-sm text-[var(--muted)]">
                    Click "Summarize", "Key Arguments", or "Methodology" for instant analysis
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-[var(--surface)] p-4">
                <Lightbulb className="h-5 w-5 shrink-0 text-[var(--primary)] mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--text)]">Save As You Go</p>
                  <p className="text-sm text-[var(--muted)]">
                    Say "save that insight" or click "+ Insight" to build your notes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-[var(--surface)] p-4">
                <FileText className="h-5 w-5 shrink-0 text-[var(--primary)] mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--text)]">Context Modes</p>
                  <p className="text-sm text-[var(--muted)]">
                    Toggle between Full Doc, Current Page, or Selection for focused answers
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="mt-12">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--text)]">
              <Keyboard className="h-5 w-5 text-[var(--accent)]" />
              Keyboard Shortcuts
            </h2>
            <div className="mt-4 rounded-lg border border-[var(--border)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface)]">
                    <th className="px-4 py-2 text-left font-medium text-[var(--text)]">Action</th>
                    <th className="px-4 py-2 text-left font-medium text-[var(--text)]">Shortcut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr>
                    <td className="px-4 py-2 text-[var(--text)]">Toggle sidebar</td>
                    <td className="px-4 py-2"><kbd className="rounded bg-[var(--surface)] px-2 py-0.5 text-xs">⌘ B</kbd></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--text)]">Next / Previous page</td>
                    <td className="px-4 py-2"><kbd className="rounded bg-[var(--surface)] px-2 py-0.5 text-xs">J</kbd> / <kbd className="rounded bg-[var(--surface)] px-2 py-0.5 text-xs">K</kbd></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--text)]">Focus chat</td>
                    <td className="px-4 py-2"><kbd className="rounded bg-[var(--surface)] px-2 py-0.5 text-xs">⌘ J</kbd></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--text)]">Send message</td>
                    <td className="px-4 py-2"><kbd className="rounded bg-[var(--surface)] px-2 py-0.5 text-xs">⌘ Enter</kbd></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--text)]">Command palette</td>
                    <td className="px-4 py-2"><kbd className="rounded bg-[var(--surface)] px-2 py-0.5 text-xs">⌘ K</kbd></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--text)]">Mark done / reading</td>
                    <td className="px-4 py-2"><kbd className="rounded bg-[var(--surface)] px-2 py-0.5 text-xs">M</kbd></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-[var(--text)]">Search papers</td>
                    <td className="px-4 py-2"><kbd className="rounded bg-[var(--surface)] px-2 py-0.5 text-xs">/</kbd></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-12 border-t border-[var(--border)] pt-6 text-center text-sm text-[var(--muted)]">
            <p>Happy reading!</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
