// Shared transport bounds. Callers replace upstream errors with their own safe code.
export const withProviderDeadline = async (operation, timeoutMs) => {
  const controller = new AbortController()
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error('Provider timeout')) }, timeoutMs)
  })
  try { return await Promise.race([operation(controller.signal), timeout]) }
  finally { clearTimeout(timer); controller.abort() }
}

export const readBounded = async (response, maxBytes) => {
  const length = Number(response.headers.get('content-length'))
  if (Number.isFinite(length) && length > maxBytes) {
    await response.body?.cancel()
    throw new Error('Provider response too large')
  }
  if (!response.body) return Buffer.alloc(0)
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) return Buffer.concat(chunks, size)
      size += value.byteLength
      if (size > maxBytes) throw new Error('Provider response too large')
      chunks.push(Buffer.from(value))
    }
  } finally { void reader.cancel().catch(() => {}) }
}
