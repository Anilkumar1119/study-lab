import { z } from 'zod';

export const score = (previous: number, measured: number) => Math.round(previous * .7 + measured * .3);
export function nextReview(mastery: number, now = new Date()) {
  const days = mastery < 60 ? 1 : mastery < 80 ? 3 : 7;
  return new Date(now.getTime() + days * 86_400_000);
}
const short = z.string().trim().min(1).max(100);
export const exercise = z.object({
  subject: short, topic: short, concepts: z.array(short).min(1).max(8),
  explanation: z.string().trim().max(7000), previousQuestion: z.string().max(400).default('')
});
export const aiFeedback = z.object({
  summary: z.string().min(1).max(1400), question: z.string().min(1).max(400),
  misconceptions: z.array(z.string().min(1).max(350)).max(6),
  scores: z.array(z.object({ concept: short, score: z.number().int().min(0).max(100) })).min(1).max(8)
});
export type Exercise = z.infer<typeof exercise>;
export type Feedback = Omit<z.infer<typeof aiFeedback>, 'scores'> & { scores: { concept: string; score: number }[] | null; imageAnalyzed?: boolean };

export function practiceFeedback(topic: string, concepts: string[]): Feedback {
  return {
    summary: 'Your explanation was saved for practice. Claude grading is unavailable in this session.',
    question: 'I’m new to ' + topic + '. Could you explain ' + concepts.at(-1) + ' with a simple example and show why it works?',
    misconceptions: [], scores: null
  };
}

export type Concept = { subject: string; concept: string; mastery: number; attempts: number; review_at: string };
export type Session = { id: string; subject: string; topic: string; explanation: string; feedback: Feedback; created_at: string };
export type Dashboard = { role: 'student' | 'teacher'; classCode: string; studentCount: number; concepts: Concept[]; sessions: Session[] };
