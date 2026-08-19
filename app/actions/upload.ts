'use server'

import { uploadToR2 } from '@/lib/r2'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function uploadImage(formData: FormData, folder: 'vehiculos' | 'empleados') {
  const file = formData.get('file') as File | null
  if (!file) throw new Error('No se recibió ningún archivo')
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Formato de imagen no soportado')
  if (file.size > MAX_SIZE) throw new Error('La imagen supera el tamaño máximo de 5MB')

  const ext = file.type.split('/')[1]
  const key = `${folder}/${crypto.randomUUID()}.${ext}`
  const buffer = new Uint8Array(await file.arrayBuffer())

  return uploadToR2(key, buffer, file.type)
}
