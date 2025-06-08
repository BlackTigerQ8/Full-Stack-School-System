import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Civil ID or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        let user = null;

        // First, try to find user by civil ID in Admin, Teacher, Parent, or Student tables
        const admin = await prisma.admin.findUnique({
          where: { civilId: credentials.identifier },
          include: { user: true },
        });

        if (admin?.user) {
          user = admin.user;
        } else {
          const teacher = await prisma.teacher.findUnique({
            where: { civilId: credentials.identifier },
            include: { user: true },
          });

          if (teacher?.user) {
            user = teacher.user;
          } else {
            const parent = await prisma.parent.findUnique({
              where: { civilId: credentials.identifier },
              include: { user: true },
            });

            if (parent?.user) {
              user = parent.user;
            } else {
              // Check Student table
              const student = await prisma.student.findUnique({
                where: { civilId: credentials.identifier },
                include: { user: true },
              });

              if (student?.user) {
                user = student.user;
              } else {
                // For admin only: also try username if civil ID doesn't work
                const adminByUsername = await prisma.admin.findUnique({
                  where: { username: credentials.identifier },
                  include: { user: true },
                });

                if (adminByUsername?.user) {
                  user = adminByUsername.user;
                }
              }
            }
          }
        }

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/api/auth/signin",
  },
};
