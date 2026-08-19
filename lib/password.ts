import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export function isHashed(value: string) {
  return /^\$2[aby]?\$/.test(value)
}

// Se usa la API síncrona de bcryptjs: la versión async internamente llama a
// setImmediate para trocear el trabajo, y esa API de Node no existe en el Edge Runtime.
export async function hashPassword(plain: string) {
  return bcrypt.hashSync(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, stored: string) {
  if (isHashed(stored)) {
    return bcrypt.compareSync(plain, stored)
  }
  // Contraseña heredada guardada en texto plano (antes del hash con bcrypt)
  return plain === stored
}
