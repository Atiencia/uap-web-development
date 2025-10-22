import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { chatRequestSchema } from "@/lib/schema";
import { sanitizeInput } from "@/lib/sanitize";
import { rateLimiter } from "@/lib/rateLimit";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Obtener IP del cliente
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
               req.headers.get("x-real-ip") || 
               "unknown";

    // Verificar rate limit
    const { allowed, remaining, resetTime } = rateLimiter.check(ip);
    
    if (!allowed) {
      const waitTime = Math.ceil((resetTime - Date.now()) / 1000 / 60); // minutos
      return new Response(
        JSON.stringify({ 
          error: "Too Many Requests", 
          message: `Límite de mensajes alcanzado. Espera ${waitTime} minutos.`,
          retryAfter: resetTime 
        }), 
        { 
          status: 429,
          headers: { 
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetTime.toString(),
            "Retry-After": waitTime.toString()
          }
        }
      );
    }

    const json = await req.json();
    const parsed = chatRequestSchema.safeParse(json);
    
    if (!parsed.success) {
      console.error("[API /chat] Validation error:", parsed.error);
      return new Response(JSON.stringify({ error: "Bad Request", details: parsed.error }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response("API Key not configured", { status: 500 });
    }

    // Sanitizar todos los mensajes entrantes y remover el campo id
    const messages = parsed.data.messages.map((m) => ({
      role: m.role,
      content: sanitizeInput(m.content),
    }));

    const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku";

    // Configurar OpenRouter como proveedor con el AI SDK
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      headers: {
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": process.env.SITE_TITLE || "ChatBot AI",
      },
    });

    // Usar streamText del AI SDK para streaming
    const result = await streamText({
      model: openrouter(model),
      messages,
      temperature: 0.7,
    });

    // Retornar el stream con headers de rate limit
    const response = result.toAIStreamResponse();
    response.headers.set("X-RateLimit-Limit", "60");
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", resetTime.toString());
    
    return response;
  } catch (err: unknown) {
    console.error("[API /chat] Error:", err);
    const status = (err as { status?: number })?.status ?? 500;
    return new Response("Internal Server Error", { status });
  }
}
