// Ejecuta una tarea sin bloquear la respuesta y sin poder romperla.
// No usamos `after()` de Next: en Cloudflare Pages (next-on-pages) Next no
// recibe `waitUntil` y `after()` lanza un error síncrono, lo que hacía que la
// acción devolviera 500 aunque el registro ya se hubiera guardado.
export function runInBackground(task: () => Promise<unknown>) {
  let promise: Promise<unknown>
  try {
    promise = task().catch((e) => console.error('Error en tarea en segundo plano', e))
  } catch (e) {
    console.error('Error en tarea en segundo plano', e)
    return
  }

  // next-on-pages expone el contexto del Worker en este símbolo global; waitUntil
  // mantiene vivo el Worker hasta que la tarea termine después de responder.
  const cfContext = (globalThis as any)[Symbol.for('__cloudflare-request-context__')]?.ctx
  try {
    cfContext?.waitUntil?.(promise)
  } catch {}
}
