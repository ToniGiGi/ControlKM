import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword, isHashed } from '@/lib/password'

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).trim() },
          include: { employee: true }
        })

        if (!user) return null

        const isValid = await verifyPassword(credentials.password as string, user.password)
        if (!isValid) return null

        // Migración transparente: si la contraseña todavía estaba en texto plano, se re-guarda con hash
        if (!isHashed(user.password)) {
          const hashed = await hashPassword(credentials.password as string)
          await prisma.user.update({ where: { id: user.id }, data: { password: hashed } }).catch(() => {})
        }

        return {
          id: user.id,
          email: user.email,
          name: user.employee?.nombre || null,
          role: user.role,
          employeeId: user.employee?.id || null
        } as any
      }
    })
  ]
})
