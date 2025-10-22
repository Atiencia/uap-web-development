// Rate limiting para backend
// Almacena contadores en memoria (para producción usar Redis/Vercel KV)

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60 * 60 * 1000) {
    // Por defecto: 60 requests por hora
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    // Si no existe o ya expiró, crear nueva entrada
    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.limits.set(identifier, newEntry);
      
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    // Si alcanzó el límite
    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Incrementar contador
    entry.count++;
    
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // Limpiar entradas expiradas (opcional, para evitar memory leaks)
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Instancia global (60 requests por hora)
export const rateLimiter = new RateLimiter(60, 60 * 60 * 1000);

// Cleanup cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 10 * 60 * 1000);
}
