'use server'

import { getPrisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hashPassword, verifyPassword } from '@/lib/password'

export async function getProfile(email: string) {
  const prisma = getPrisma()
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      employee: {
        include: {
          sucursalRef: { select: { id: true, name: true } },
          departamentoRef: { select: { id: true, name: true } },
        }
      }
    }
  })
  return user
}

export async function updateProfile(userId: string, data: any) {
  const {
    telefono, password, currentPassword, licenciaUrl, licencia,
    licenciaVigenciaInicio, vencimientoLicencia,
  } = data

  const prisma = getPrisma()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("Usuario no encontrado")

  if (password && password.trim() !== '') {
    if (!currentPassword || currentPassword.trim() === '') {
      throw new Error('Debes ingresar tu contraseña actual para cambiarla.')
    }
    const isValid = await verifyPassword(currentPassword, user.password)
    if (!isValid) {
      throw new Error('La contraseña actual no es correcta.')
    }
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
          telefono: telefono !== undefined ? (telefono || null) : undefined,
          licencia: licencia !== undefined ? (licencia || null) : undefined,
          licenciaUrl: licenciaUrl !== undefined ? (licenciaUrl || null) : undefined,
          licenciaVigenciaInicio: licenciaVigenciaInicio !== undefined
            ? (licenciaVigenciaInicio ? new Date(licenciaVigenciaInicio) : null)
            : undefined,
          vencimientoLicencia: vencimientoLicencia !== undefined
            ? (vencimientoLicencia ? new Date(vencimientoLicencia) : null)
            : undefined,
        }
      })
    }
  }

  revalidatePath('/perfil')
  return { success: true }
}
