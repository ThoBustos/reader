import { z } from "zod";

// Schema for multiple-choice questions
export const MultipleChoiceQuestionSchema = z.object({
  type: z.literal("multiple-choice"),
  question: z.string().describe("The question to ask"),
  options: z.array(z.string()).length(4).describe("Exactly 4 answer options"),
  correctIndex: z.number().min(0).max(3).describe("Index of correct answer (0-3)"),
  explanation: z.string().describe("Why this answer is correct"),
  source: z.string().optional().describe("Page reference, e.g. 'p. 5'"),
});

// Schema for open-ended questions
export const OpenEndedQuestionSchema = z.object({
  type: z.literal("open-ended"),
  question: z.string().describe("The question to ask"),
  expectedAnswer: z.string().describe("Model answer"),
  keyPoints: z.array(z.string()).describe("Key points answer should cover"),
  explanation: z.string().describe("Full explanation of the answer"),
  source: z.string().optional().describe("Page reference, e.g. 'p. 5'"),
});

// Union of question types
export const QuizQuestionSchema = z.discriminatedUnion("type", [
  MultipleChoiceQuestionSchema,
  OpenEndedQuestionSchema,
]);

// Schema for quiz generation response
export const QuizQuestionsSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});

// Schema for answer evaluation
export const AnswerEvaluationSchema = z.object({
  isCorrect: z.boolean().describe("Whether the answer is sufficiently correct"),
  score: z.number().min(0).max(100).describe("Score from 0-100"),
  feedback: z.string().describe("Feedback explaining the evaluation"),
  matchedPoints: z.array(z.string()).describe("Key points that were covered"),
});

// Type exports (inferred from schemas)
export type MultipleChoiceQuestionZod = z.infer<typeof MultipleChoiceQuestionSchema>;
export type OpenEndedQuestionZod = z.infer<typeof OpenEndedQuestionSchema>;
export type QuizQuestionZod = z.infer<typeof QuizQuestionSchema>;
export type QuizQuestionsZod = z.infer<typeof QuizQuestionsSchema>;
export type AnswerEvaluationZod = z.infer<typeof AnswerEvaluationSchema>;
