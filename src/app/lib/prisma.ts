import "dotenv/config"; // Ensure env variables are loaded
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg"; // Import the adapter
import pg from "pg"

// Get the database URL from environment variables
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable not set');
}

// Instantiate the database driver's Pool
const pool = new pg.Pool({ connectionString });

// Instantiate the Prisma adapter
const adapter = new PrismaPg(pool);

// Extend the global scope to store the prisma client in development
declare global {
    var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
    // Production: Create fresh client with the adapter
    prisma = new PrismaClient({
        adapter, // Pass the adapter to the constructor
        log: ['warn', 'error'],
    });
} else {
    // Development: Reuse global connection
    if (!global.prisma) {
        global.prisma = new PrismaClient({
            adapter, // Pass the adapter to the constructor
            log: ['warn', 'error'],
        });
    }

    prisma = global.prisma;
}

export { prisma };
