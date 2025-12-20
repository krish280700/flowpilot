import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/app/lib/prisma";

// NextAuth configuration
export const authOptions: NextAuthOptions = {
    providers: [
        // Login with GitHub account
        GithubProvider({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || "",
        }),

        // Login with email + password
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Find user by email
                const user = await prisma.user.findUnique({
                    where: { email: credentials?.email },
                });

                // Check if password matches (bcrypt comparison)
                if (user && credentials && await compare(credentials.password, user.password || "")) {
                    return user;
                }
                return null;
            },
        }),
    ],

    // JWT = store user info in encrypted token (stateless)
    session: { strategy: "jwt" },

    // Callbacks = customize behavior
    callbacks: {
        // Add user ID to JWT token
        async jwt({ token, user }) {
            if (user) (token as any).id = user.id;
            return token;
        },
        // Add user ID to session object
        async session({ session, token }) {
            if (session.user) (session.user as any).id = (token as any).id;
            return session;
        },
    },

    pages: {
        signIn: "/auth/signin",  // Custom login page
        // signUp: "/auth/signup",  // Custom signup page (Not a valid NextAuth page option)
    },
};

// Export handler for /api/auth/* routes
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };