import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins"
import { db } from "@/db/drizzle";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins"
import * as authSchema from "@/db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: authSchema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [username(), nextCookies(), anonymous()]
});