import { z } from "zod";

export const chatMessageSchema = z.object({
  id: z.string().min(1).optional(),
  role: z.enum(["user", "assistant", "system"]).default("user"),
  content: z.string().min(1).max(8000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  sessionId: z.string().min(1).max(128).optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
