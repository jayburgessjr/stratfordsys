import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import { prisma } from '@/lib/database/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)

          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
              image: true,
              passwordHash: true,
              role: true,
              kycStatus: true,
              amlStatus: true,
              twoFactorEnabled: true,
            }
          })

          if (!user || !user.passwordHash) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
          if (!isPasswordValid) {
            return null
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name || `${user.firstName} ${user.lastName}`.trim() || user.email,
            image: user.image,
            role: user.role,
            kycStatus: user.kycStatus,
            amlStatus: user.amlStatus,
            twoFactorEnabled: user.twoFactorEnabled,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.kycStatus = user.kycStatus
        token.amlStatus = user.amlStatus
        token.twoFactorEnabled = user.twoFactorEnabled
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.kycStatus = token.kycStatus as string
        session.user.amlStatus = token.amlStatus as string
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // For OAuth providers, create or update user with additional fields
      if (account?.provider !== 'credentials') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (existingUser) {
            // Update last login
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastLoginAt: new Date() }
            })
          }
        } catch (error) {
          console.error('Sign in callback error:', error)
          return false
        }
      }
      return true
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log sign-in event for audit trail
      if (user.id) {
        await prisma.userActivity.create({
          data: {
            userId: user.id,
            action: 'SIGN_IN',
            resource: 'AUTH',
            metadata: {
              provider: account?.provider,
              isNewUser,
              timestamp: new Date(),
            }
          }
        }).catch(error => console.error('Failed to log sign-in activity:', error))
      }
    },
    async signOut({ session, token }) {
      // Log sign-out event
      const userId = session?.user?.id || token?.sub
      if (userId) {
        await prisma.userActivity.create({
          data: {
            userId,
            action: 'SIGN_OUT',
            resource: 'AUTH',
            metadata: {
              timestamp: new Date(),
            }
          }
        }).catch(error => console.error('Failed to log sign-out activity:', error))
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      kycStatus: string
      amlStatus: string
      twoFactorEnabled: boolean
    }
  }

  interface User {
    role: string
    kycStatus: string
    amlStatus: string
    twoFactorEnabled: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    kycStatus: string
    amlStatus: string
    twoFactorEnabled: boolean
  }
}