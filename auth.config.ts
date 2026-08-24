import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth')
      const isLoginRoute = nextUrl.pathname === '/login'

      if (isApiAuthRoute) return true
      if (isLoginRoute) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
        return true
      }
      return isLoggedIn
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.employeeId = (user as any).employeeId
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string | null | undefined
        ;(session.user as any).employeeId = token.employeeId as string | null
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
