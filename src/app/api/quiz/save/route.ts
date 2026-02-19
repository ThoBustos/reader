import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import matter from "gray-matter";
import { getPaper } from "@/lib/store/papers";
import { QuizSession, QuizStats, QuizHistoryEntry } from "@/types";

// Update frontmatter with quiz stats
function updateQuizStats(mdPath: string, session: QuizSession): void {
  const content = fs.readFileSync(mdPath, "utf-8");
  const { data: frontmatter, content: body } = matter(content);

  // Get existing quiz_stats or create new
  const existingStats = (frontmatter.quiz_stats || {}) as Partial<QuizStats>;
  const score = session.score || { correct: 0, total: session.questions.length };
  const scorePercent = Math.round((score.correct / score.total) * 100);

  const newStats: QuizStats = {
    attempts: (existingStats.attempts || 0) + 1,
    best_score: Math.max(existingStats.best_score || 0, scorePercent),
    last_attempt: new Date().toISOString().split("T")[0],
  };

  const newFm = { ...frontmatter, quiz_stats: newStats };
  const newContent = matter.stringify(body, newFm);
  fs.writeFileSync(mdPath, newContent);
}

// Append quiz history entry to ## Quiz History section
function appendQuizHistory(mdPath: string, session: QuizSession): void {
  let content = fs.readFileSync(mdPath, "utf-8");
  const sectionHeader = "## Quiz History";

  // Find missed questions
  const missed = session.answers
    .filter((a) => !a.isCorrect && !a.skipped)
    .map((a) => {
      const q = session.questions[a.questionIndex];
      let correctAnswer = "";
      let userAnswer = "";

      if (q.type === "multiple-choice") {
        correctAnswer = q.options[q.correctIndex];
        userAnswer = typeof a.userAnswer === "number" ? q.options[a.userAnswer] : String(a.userAnswer);
      } else {
        correctAnswer = q.expectedAnswer;
        userAnswer = String(a.userAnswer);
      }

      return {
        question: q.question,
        userAnswer,
        correctAnswer,
      };
    });

  const score = session.score || { correct: 0, total: session.questions.length };
  const scorePercent = Math.round((score.correct / score.total) * 100);
  const date = new Date().toISOString().split("T")[0];

  // Build history entry
  let historyEntry = `\n### ${date} - Score: ${score.correct}/${score.total} (${scorePercent}%)`;

  if (missed.length > 0) {
    historyEntry += "\n**Missed:**";
    for (const m of missed) {
      historyEntry += `\n- Q: ${m.question}`;
      historyEntry += `\n  - Your answer: ${m.userAnswer}`;
      historyEntry += `\n  - Correct: ${m.correctAnswer}`;
    }
  }

  // Check if section exists
  const idx = content.indexOf(sectionHeader);
  if (idx === -1) {
    // Add section at end
    content = content.trimEnd() + `\n\n${sectionHeader}${historyEntry}\n`;
  } else {
    // Insert after section header
    const afterHeader = idx + sectionHeader.length;
    content =
      content.slice(0, afterHeader) + historyEntry + content.slice(afterHeader);
  }

  fs.writeFileSync(mdPath, content);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session } = body as { session: QuizSession };

    if (!session || !session.paperId) {
      return NextResponse.json(
        { error: "Quiz session required" },
        { status: 400 }
      );
    }

    const paper = getPaper(session.paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Update frontmatter stats
    updateQuizStats(paper.sidecarPath, session);

    // Append history entry
    appendQuizHistory(paper.sidecarPath, session);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quiz save error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to save quiz results: ${errorMessage}` },
      { status: 500 }
    );
  }
}
