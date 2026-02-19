import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { QuizConfig, QuizQuestion, QuizDifficulty } from "@/types";
import {
  QuizQuestionsSchema,
  AnswerEvaluationSchema,
  type AnswerEvaluationZod,
} from "./quiz-schemas";

// Difficulty instructions for question generation
const difficultyInstructions: Record<QuizDifficulty, string> = {
  skim: `Difficulty: SKIM (Easy)
- Test basic recall of main ideas from abstract and conclusions
- Questions should be answerable after a quick read
- MC distractors should be clearly from different topics or obviously wrong
- Open-ended: expect 1-2 sentence answers covering obvious points
- Focus on: main thesis, key conclusions, basic terminology`,

  read: `Difficulty: READ (Medium)
- Test comprehension of methodology, key findings, and core concepts
- Questions require understanding the paper's argument and flow
- MC distractors should be plausible but incomplete or slightly off
- Open-ended: expect short paragraph explaining "how" and "why"
- Focus on: methods, key findings, definitions, stated implications`,

  study: `Difficulty: STUDY (Hard)
- Test ability to analyze relationships, implications, and limitations
- Questions require connecting ideas across sections
- MC distractors should involve subtle distinctions and partial truths
- Open-ended: expect synthesis from multiple parts of the paper
- Focus on: unstated implications, limitations, methodology critique, connections between findings`,

  master: `Difficulty: MASTER (Expert)
- Test critical evaluation, unstated assumptions, and edge cases
- Questions should challenge even someone who's read the paper multiple times
- MC distractors should reflect common expert misconceptions in the field
- Open-ended: expect critique, comparison to related work, or proposed extensions
- Focus on: assumptions, generalizability, theoretical gaps, what the paper doesn't say`
};

// Evaluation strictness by difficulty
const evaluationStrictness: Record<QuizDifficulty, string> = {
  skim: `Be generous: accept paraphrasing, partial answers covering the main point count as correct.
A response showing basic understanding should pass.`,

  read: `Be fair: core concepts must be present, but allow different phrasing.
A response covering most key points should pass.`,

  study: `Be precise: terminology should be accurate, connections must be explicit.
A response needs strong coverage of key points with clear reasoning.`,

  master: `Be rigorous: expect expert-level depth, nuance, and critical thinking.
Only thorough, insightful responses demonstrating mastery should pass.`
};

// Pass thresholds by difficulty
export const difficultyThresholds: Record<QuizDifficulty, number> = {
  skim: 50,
  read: 60,
  study: 70,
  master: 80
};

// Build quiz generation prompt
function buildQuizPrompt(paperContent: string, config: QuizConfig): string {
  const difficultyGuide = difficultyInstructions[config.difficulty];

  const typeInstructions = config.questionTypes.map((type) => {
    if (type === "multiple-choice") {
      return `For multiple-choice questions:
- Create questions with exactly 4 options where only 1 is correct
- Distractor difficulty should match the overall difficulty level
- Include the correctIndex (0-3) for the correct answer
- Include "type": "multiple-choice" for each MC question`;
    } else {
      return `For open-ended questions:
- Question depth should match the difficulty level
- Include 3-5 key points the answer should cover (more nuanced for harder difficulties)
- Provide a model expectedAnswer appropriate to the difficulty
- Include "type": "open-ended" for each open-ended question`;
    }
  }).join("\n\n");

  let scopeInstruction = "";
  if (config.scope === "pages" && config.scopeDetail && typeof config.scopeDetail === "object") {
    scopeInstruction = `Focus questions on content from pages ${config.scopeDetail.start} to ${config.scopeDetail.end}.`;
  } else if (config.scope === "selection" && typeof config.scopeDetail === "string") {
    scopeInstruction = `Focus questions on this selected text: "${config.scopeDetail}"`;
  }

  return `You are generating quiz questions to test understanding of an academic paper.
Generate exactly ${config.questionCount} questions.

${difficultyGuide}

Question types to include: ${config.questionTypes.join(", ")}
${config.questionTypes.length > 1 ? `Mix the question types roughly equally.` : ""}

${typeInstructions}

${scopeInstruction}

For all questions:
- Include the source page reference when possible (e.g., "p. 5")
- Explanations should help the reader learn, not just state the answer

Paper content:
${paperContent}

Respond with valid JSON in this exact structure:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "...",
      "source": "p. X"
    },
    {
      "type": "open-ended",
      "question": "...",
      "expectedAnswer": "...",
      "keyPoints": ["point1", "point2", "point3"],
      "explanation": "...",
      "source": "p. X"
    }
  ]
}`;
}

// Build answer evaluation prompt
function buildEvaluationPrompt(
  question: string,
  expected: string,
  keyPoints: string[],
  userAnswer: string,
  difficulty: QuizDifficulty = "study"
): string {
  const strictnessGuide = evaluationStrictness[difficulty];
  const threshold = difficultyThresholds[difficulty];

  return `Evaluate this answer to a quiz question about an academic paper.

Question: ${question}

Expected answer: ${expected}

Key points that should be covered:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

User's answer: ${userAnswer}

Evaluation strictness (${difficulty.toUpperCase()} difficulty):
${strictnessGuide}

Pass threshold: ${threshold}% (score >= ${threshold} means correct)

Respond with valid JSON:
{
  "isCorrect": true/false,
  "score": 0-100,
  "feedback": "explanation of evaluation",
  "matchedPoints": ["points that were covered"]
}`;
}

// Generate quiz questions using Gemini
export async function generateQuizQuestionsGemini(
  genAI: GoogleGenerativeAI,
  pdfBase64: string,
  config: QuizConfig,
  modelName: string = "gemini-2.5-flash"
): Promise<QuizQuestion[]> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = buildQuizPrompt("[PDF content provided as attachment]", config);

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "application/pdf",
        data: pdfBase64,
      },
    },
    { text: prompt },
  ]);

  const responseText = result.response.text();
  const parsed = QuizQuestionsSchema.parse(JSON.parse(responseText));
  return parsed.questions as QuizQuestion[];
}

// Evaluate open-ended answer using Gemini
export async function evaluateAnswerGemini(
  genAI: GoogleGenerativeAI,
  question: string,
  expectedAnswer: string,
  keyPoints: string[],
  userAnswer: string,
  difficulty: QuizDifficulty = "study",
  modelName: string = "gemini-2.5-flash"
): Promise<AnswerEvaluationZod> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = buildEvaluationPrompt(question, expectedAnswer, keyPoints, userAnswer, difficulty);
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  return AnswerEvaluationSchema.parse(JSON.parse(responseText));
}

// Generate quiz questions using Claude
export async function generateQuizQuestionsClaude(
  anthropic: Anthropic,
  documentText: string,
  config: QuizConfig
): Promise<QuizQuestion[]> {
  const prompt = buildQuizPrompt(documentText, config);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Extract text from response
  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Parse and validate with Zod
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON in Claude response");
  }

  const parsed = QuizQuestionsSchema.parse(JSON.parse(jsonMatch[0]));
  return parsed.questions as QuizQuestion[];
}

// Evaluate open-ended answer using Claude
export async function evaluateAnswerClaude(
  anthropic: Anthropic,
  question: string,
  expectedAnswer: string,
  keyPoints: string[],
  userAnswer: string,
  difficulty: QuizDifficulty = "study"
): Promise<AnswerEvaluationZod> {
  const prompt = buildEvaluationPrompt(question, expectedAnswer, keyPoints, userAnswer, difficulty);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON in Claude response");
  }

  return AnswerEvaluationSchema.parse(JSON.parse(jsonMatch[0]));
}
