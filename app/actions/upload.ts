'use server'

import { uploadToR2 } from '@/lib/r2'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_TYPES_WITH_PDF = [...ALLOWED_TYPES, 'application/pdf']

export async function uploadImage(formData: FormData, folder: 'vehiculos' | 'empleados' | 'licencias' | 'firmas') {
  const file = formData.get('file') as File | null
  if (!file) throw new Error('No se recibió ningún archivo')
  const allowedTypes = folder === 'licencias' ? ALLOWED_TYPES_WITH_PDF : ALLOWED_TYPES
  if (!allowedTypes.includes(file.type)) throw new Error('Formato de archivo no soportado')
  if (file.size > MAX_SIZE) throw new Error('El archivo supera el tamaño máximo de 5MB')

  const ext = file.type.split('/')[1]
  const key = `${folder}/${crypto.randomUUID()}.${ext}`
  const buffer = new Uint8Array(await file.arrayBuffer())

  return uploadToR2(key, buffer, file.type)
}
