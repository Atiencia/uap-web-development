"use client";
import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";

export default function Page() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Rate limiting 
  const [sessionMessageCount, setSessionMessageCount] = useState(0);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const MAX_SESSION_MESSAGES = 50; // Límite por sesión

  // Usar el hook useChat del AI SDK
  const { messages, input, setInput, handleSubmit, isLoading, stop, error } = useChat({
    api: "/api/chat",
    onError: (error: Error) => {
      console.error("Error en el chat:", error);
      // Detectar error de rate limit
      if (error.message.includes("429") || error.message.includes("Too Many Requests")) {
        setRateLimitError("⏸️ Has alcanzado el límite de mensajes. Por favor espera unos minutos.");
      }
    },
    onFinish: () => {
      // Incrementar contador de sesión al finalizar respuesta
      setSessionMessageCount(prev => prev + 1);
    },
  });

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "52px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Verificar límite de sesión
    if (sessionMessageCount >= MAX_SESSION_MESSAGES) {
      setRateLimitError(`⏸️ Límite de ${MAX_SESSION_MESSAGES} mensajes por sesión alcanzado. Recarga la página para continuar.`);
      return;
    }
    
    setRateLimitError(null);
    handleSubmit(e);
  }

  function onStop() {
    stop();
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="px-4 py-8 sticky ">
        <div className="container mx-auto max-w-xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">ChatBot AI</h1>
            <div className="text-sm text-gray-500">
              {sessionMessageCount}/{MAX_SESSION_MESSAGES} mensajes
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-xl px-4 py-6">
          {/* Mostrar error de rate limit */}
          {(rateLimitError || error) && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                {rateLimitError || error?.message}
              </p>
            </div>
          )}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">¿En qué puedo ayudarte hoy?</h2>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap break-words ${
                      m.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === "user" }
                </div>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start mt-6">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="px-4 py-12 flex items-center justify-center">
        <div className="container mx-auto max-w-xl">
          <form onSubmit={onSubmit} className="relative">
            <div className="flex items-end gap-2 rounded-3xl border border-gray-300 bg-white shadow-sm focus-within:border-gray-400 focus-within:shadow-md transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                }}
                placeholder="Pregunta lo que quieras"
                rows={1}
                className="flex-1 resize-none bg-transparent px-4 py-3 outline-none max-h-48 overflow-y-auto text-gray-900 placeholder:text-gray-400"
                style={{
                  minHeight: "52px",
                  maxHeight: "200px",
                }}
                maxLength={8000}
                disabled={isLoading || sessionMessageCount >= MAX_SESSION_MESSAGES}
              />
              
              <div className="flex items-center gap-2 pr-2 pb-2">
                {isLoading ? (
                  <button
                    type="button"
                    onClick={onStop}
                    className="rounded-full p-2 bg-gray-200 hover:bg-gray-300 transition-colors"
                    title="Detener generación"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-gray-700"
                    >
                      <rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || sessionMessageCount >= MAX_SESSION_MESSAGES}
                    className="rounded-full p-2 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
                    title="Enviar mensaje"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={input.trim() && sessionMessageCount < MAX_SESSION_MESSAGES ? "text-white" : "text-gray-400"}
                    >
                      <path
                        d="M7 11L12 6L17 11M12 18V7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </form>
          <p className="text-xs text-gray-500 text-center mt-2">
            Presiona Enter para enviar:)
          </p>
        </div>
      </footer>
    </div>
  );
}
