"use server";

import { prisma } from "@/app/lib/prisma";
import { hashPassword } from "@/app/lib/password";

interface SignUpInput {
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
}

/**
 * Sign up new user
 * 1. Validate input
 * 2. Check if email already exists
 * 3. Hash password
 * 4. Create user in database
 * 5. Auto-create default workspace
 * 6. Return success/error
 */
export async function signUp(input: SignUpInput) {
    try {
        const { email, name, password, confirmPassword } = input;

        // Validation 1: Check passwords match
        if (password !== confirmPassword) {
            return {
                error: "Passwords do not match",
                success: false,
            };
        }

        // Validation 2: Check password length
        if (password.length < 8) {
            return {
                error: "Password must be at least 8 characters",
                success: false,
            };
        }

        // Validation 3: Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                error: "Invalid email format",
                success: false,
            };
        }

        // Validation 4: Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return {
                error: "Email already registered",
                success: false,
            };
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });

        // Auto-create default workspace for new user
        const workspace = await prisma.workspace.create({
            data: {
                name: `${name}'s Workspace`,
                slug: `workspace-${user.id.slice(0, 8)}`,
            },
        });

        // Add user as OWNER of their workspace
        await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId: workspace.id,
                role: "OWNER",
            },
        });

        return {
            success: true,
            message: "Account created successfully",
        };
    } catch (error) {
        console.error("Sign up error:", error);
        return {
            error: "Something went wrong. Please try again.",
            success: false,
        };
    }
}