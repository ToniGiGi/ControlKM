import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'

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

        // Verificación simple temporal (en producción usar bcrypt)
        if (credentials.password === user.password) {
          return { 
            id: user.id, 
            email: user.email, 
            name: user.employee?.nombre || null,
            role: user.role, 
            employeeId: user.employee?.id || null 
          } as any
        }

        return null
      }
    })
  ]
})
