const WRITE_TIMEOUT_MS = 60_000

type ArkivErrorCategory =
  | "rate_limit"
  | "nonce_race"
  | "insufficient_funds"
  | "expired_entity"
  | "user_rejected"
  | "network"
  | "unknown"

interface ClassifiedError {
  category: ArkivErrorCategory
  message: string
  retryable: boolean
}

export function classifyArkivError(err: unknown): ClassifiedError {
  const msg = err instanceof Error ? err.message : String(err).toLowerCase()

  if (/429|rate.?limit/i.test(msg)) {
    return { category: "rate_limit", message: "Demasiadas solicitudes. Intent\u00e1 de nuevo en unos segundos.", retryable: true }
  }
  if (/nonce|already known|replacement.*underpriced|underpriced/i.test(msg)) {
    return { category: "nonce_race", message: "Conflicto de transacci\u00f3n. Reintentando autom\u00e1ticamente...", retryable: true }
  }
  if (/insufficient|funds|balance|glm/i.test(msg)) {
    return { category: "insufficient_funds", message: "Fondos insuficientes en tu wallet. Obten\u00e9 GLM del faucet: https://braga.hoodi.arkiv.network/faucet/", retryable: false }
  }
  if (/expired|already expired/i.test(msg)) {
    return { category: "expired_entity", message: "La entidad ya expir\u00f3 en Arkiv.", retryable: false }
  }
  if (/reject|denied|cancel|user reject/i.test(msg)) {
    return { category: "user_rejected", message: "Transacci\u00f3n rechazada.", retryable: false }
  }
  if (/network|fetch|timeout|ECONNREFUSED|ECONNRESET/i.test(msg)) {
    return { category: "network", message: "Error de conexi\u00f3n con la red Arkiv. Reintentando...", retryable: true }
  }

  return { category: "unknown", message: `Error inesperado: ${msg}`, retryable: false }
}

let writeChain: Promise<unknown> = Promise.resolve()

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error(`Operaci\u00f3n en Arkiv excedi\u00f3 el tiempo l\u00edmite de ${ms / 1000}s`)), ms)
    ),
  ])
}

export async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      const classified = classifyArkivError(e)
      if (!classified.retryable) throw e
      await new Promise((r) => setTimeout(r, 800 * (i + 1)))
    }
  }
  throw lastErr
}

export async function serializeWrite<T>(fn: () => Promise<T>): Promise<T> {
  const attempt = () => withRetry(() => withTimeout(fn(), WRITE_TIMEOUT_MS))
  const run = writeChain.then(attempt, attempt)
  writeChain = run.catch(() => {})
  return run
}