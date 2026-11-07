/**
 * Lightweight in-memory circuit breaker for InsForge backend database requests.
 * Prevents cascading latency and retry storms when the remote backend is unavailable (503/timeout).
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  cooldownMs?: number; // Time circuit remains OPEN before allowing a probe (default: 30000ms)
  timeoutMs?: number; // Request timeout in milliseconds (default: 1500ms)
}

export class InsforgeCircuitBreaker {
  private state: CircuitState = "CLOSED";
  private lastFailureTime = 0;
  private isProbeInFlight = false;
  private readonly cooldownMs: number;
  private readonly defaultTimeoutMs: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.cooldownMs = options.cooldownMs ?? 30000;
    this.defaultTimeoutMs = options.timeoutMs ?? 1500;
  }

  public getState(): CircuitState {
    if (this.state === "OPEN") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.cooldownMs) {
        this.state = "HALF_OPEN";
      }
    }
    return this.state;
  }

  public isAvailable(): boolean {
    const currentState = this.getState();
    if (currentState === "CLOSED") return true;
    if (currentState === "HALF_OPEN") {
      if (!this.isProbeInFlight) {
        this.isProbeInFlight = true;
        return true;
      }
      return false; // Other concurrent requests fast-fail while probe is running
    }
    return false; // OPEN
  }

  public recordSuccess(): void {
    this.state = "CLOSED";
    this.isProbeInFlight = false;
    this.lastFailureTime = 0;
  }

  public recordFailure(error?: any): void {
    // Client errors (4xx) should NOT trip the circuit breaker
    if (error && typeof error === "object") {
      const status = error.status || error.statusCode;
      if (status && status >= 400 && status < 500 && status !== 408) {
        this.isProbeInFlight = false;
        return;
      }
    }

    this.state = "OPEN";
    this.lastFailureTime = Date.now();
    this.isProbeInFlight = false;
  }

  public reset(): void {
    this.state = "CLOSED";
    this.isProbeInFlight = false;
    this.lastFailureTime = 0;
  }

  /**
   * Executes a database task with circuit-breaker protection and timeout race.
   */
  public async execute<T>(
    task: () => Promise<T>,
    fallback: T,
    timeoutMs: number = this.defaultTimeoutMs
  ): Promise<{ data: T; isFallback: boolean; error?: any }> {
    if (!this.isAvailable()) {
      return {
        data: fallback,
        isFallback: true,
        error: new Error("Circuit breaker open: backend unavailable"),
      };
    }

    let timer: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) => {
      timer = setTimeout(() => resolve({ isTimeout: true }), timeoutMs);
    });

    try {
      const result = await Promise.race([task(), timeoutPromise]);

      if (timer) clearTimeout(timer);

      if (result && typeof result === "object" && "isTimeout" in result) {
        this.recordFailure(new Error(`Operation timed out after ${timeoutMs}ms`));
        return {
          data: fallback,
          isFallback: true,
          error: new Error("Database query timeout"),
        };
      }

      // Check if result contains an InsForge 5xx error
      const resObj = result as any;
      if (resObj && resObj.error) {
        const msg = String(resObj.error.message || "");
        if (
          msg.includes("503") ||
          msg.includes("No backend services") ||
          msg.includes("NETWORK_ERROR") ||
          msg.includes("Failed to fetch")
        ) {
          this.recordFailure(resObj.error);
          return { data: fallback, isFallback: true, error: resObj.error };
        }
      }

      this.recordSuccess();
      return { data: result as T, isFallback: false };
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      this.recordFailure(err);
      return { data: fallback, isFallback: true, error: err };
    }
  }
}

// Global singleton instance for server runtime
export const insforgeCircuitBreaker = new InsforgeCircuitBreaker({
  cooldownMs: 30000,
  timeoutMs: 1500,
});
