'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getProfile(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      employee: true
    }
  })
  return user
}

export async function updateProfile(userId: string, data: any) {
  const { telefono, password, licenciaBase64 } = data

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("Usuario no encontrado")

  if (password && password.trim() !== '') {
    await prisma.user.update({
      where: { id: userId },
      data: { password }
    })
  }

  if (data.employeeId) {
    const employeeId = data.employeeId
    if (employeeId) {
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          telefono: telefono || undefined,
          licencia: licenciaBase64 || undefined
        }
      })
    }
  }

  revalidatePath('/perfil')
  return { success: true }
}
