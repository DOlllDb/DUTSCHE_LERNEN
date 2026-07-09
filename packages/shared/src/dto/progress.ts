import { z } from 'zod';

const wordStatusSchema = z.enum(['known', 'learning']);

export const progressSchema = z.object({
  doneDays: z.record(z.string(), z.literal(true)),
  wordStatus: z.record(z.string(), wordStatusSchema),
  testScores: z.record(
    z.string(),
    z.object({ score: z.number().int().min(0), total: z.number().int().min(0) })
  ),
});
export type ProgressDto = z.infer<typeof progressSchema>;

export const quizResultRequestSchema = z.object({
  testDay: z.number().int().positive(),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
});
export type QuizResultRequest = z.infer<typeof quizResultRequestSchema>;
