'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hashPassword } from '@/lib/password'

export async function getProfile(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
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
      data: { password: await hashPassword(password) }
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
