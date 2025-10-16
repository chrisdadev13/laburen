// import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from 'ai';
import { auth } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import { db } from '@/db/drizzle';
import { salesOrders } from '@/db/schema';
import { nanoid } from 'nanoid';
import { desc, eq } from 'drizzle-orm';
import { searchDocsTool, getDocContentTool, listDocsTool } from '@/lib/rag-tools';
import { getChatById, getMessagesByChatId, saveChat, saveMessages } from '@/lib/db/queries';

import { env } from '@xenova/transformers';

// Force WASM backend (no native dependencies needed)
env.backends.onnx.wasm.proxy = false;


export const maxDuration = 30;

const REDIS_AUTH_PREFIX = 'user:authenticated:';

// Helper function to extract text content from UIMessage parts
function getMessageContent(message: UIMessage): string {
    if (!message.parts || message.parts.length === 0) return '';
    
    return message.parts
        .filter((part) => 'type' in part && part.type === 'text')
        .map((part) => 'text' in part ? part.text : '')
        .join(' ');
}

const createSignUpTool = (userId: string) => tool({
    description: "Sign up a new user with username and password. Use this when the user wants to create a new account.",
    inputSchema: z.object({
        username: z.string().describe("The username for the new account"),
        password: z.string().min(8).describe("The password (minimum 8 characters)"),
        email: z.email().describe("The user's email address"),
        name: z.string().optional().describe("The user's display name (optional, defaults to username)"),
    }),
    execute: async ({ username, password, email, name }) => {
        try {
            const result = await auth.api.signUpEmail({
                body: {
                    email,
                    password,
                    name: name || username,
                    username,
                },
            });

            // Mark user as authenticated in Redis (expires in 7 days)
            await redis.setex(`${REDIS_AUTH_PREFIX}${userId}`, 60 * 60 * 24 * 7, 'true');

            return {
                success: true,
                message: "Account created successfully! You are now signed in.",
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    name: result.user.name,
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "An unexpected error occurred",
            };
        }
    },
});

const createSignInTool = (userId: string) => tool({
    description: "Sign in an existing user with their username and password. Use this when the user wants to log in.",
    inputSchema: z.object({
        username: z.string().describe("The user's username"),
        password: z.string().describe("The user's password"),
    }),
    execute: async ({ username, password }) => {
        try {
            const result = await auth.api.signInUsername({
                body: {
                    username,
                    password,
                }
            });

            if (!result) {
                return {
                    success: false,
                    error: "Sign in failed",
                };
            }

            // Mark user as authenticated in Redis (expires in 7 days)
            await redis.setex(`${REDIS_AUTH_PREFIX}${userId}`, 60 * 60 * 24 * 7, 'true');

            return {
                success: true,
                message: "Successfully signed in!",
                user: {
                    id: result.user.id,
                    username: result.user.username,
                    email: result.user.email,
                    name: result.user.name,
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "An unexpected error occurred",
            };
        }
    },
});

const createSignOutTool = (userId: string) => tool({
    description: "Sign out the current user. Use this when the user wants to log out.",
    inputSchema: z.object({}),
    execute: async () => {
        try {
            // Remove authentication flag from Redis
            await redis.del(`${REDIS_AUTH_PREFIX}${userId}`);

            return {
                success: true,
                message: "Successfully signed out. You'll need to sign in again to continue using the service.",
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "An unexpected error occurred",
            };
        }
    },
});

const createSalesOrderTool = (userId: string) => tool({
    description: "Create a new sales order in the system. Use this when the user wants to place an order or record a sale.",
    inputSchema: z.object({
        customerName: z.string().describe("The name of the customer placing the order"),
        customerEmail: z.email().describe("The customer's email address"),
        productName: z.string().describe("The name of the product being ordered"),
        quantity: z.number().int().positive().describe("The quantity of products ordered"),
        unitPrice: z.number().positive().describe("The price per unit of the product"),
    }),
    execute: async ({ customerName, customerEmail, productName, quantity, unitPrice }) => {
        try {
            const totalAmount = quantity * unitPrice;
            const orderNumber = `ORD-${Date.now()}-${nanoid(6).toUpperCase()}`;
            const orderId = nanoid();

            await db.insert(salesOrders).values({
                id: orderId,
                orderNumber,
                customerName,
                customerEmail,
                productName,
                quantity,
                unitPrice: unitPrice.toFixed(2),
                totalAmount: totalAmount.toFixed(2),
                status: "pending",
                userId,
            });

            return {
                success: true,
                message: "Sales order created successfully!",
                order: {
                    id: orderId,
                    orderNumber,
                    customerName,
                    customerEmail,
                    productName,
                    quantity,
                    unitPrice: unitPrice.toFixed(2),
                    totalAmount: totalAmount.toFixed(2),
                    status: "pending",
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to create sales order",
            };
        }
    },
});

const getRecentOrdersTool = (userId: string) => tool({
    description: "Retrieve recent sales orders. Use this when the user wants to view, list, or check their orders.",
    inputSchema: z.object({
        limit: z.number().int().positive().max(50).optional().describe("Number of orders to retrieve (max 50, default 10)"),
    }),
    execute: async ({ limit = 10 }) => {
        try {
            const orders = await db
                .select()
                .from(salesOrders)
                .where(eq(salesOrders.userId, userId))
                .orderBy(desc(salesOrders.orderDate))
                .limit(limit);

            if (orders.length === 0) {
                return {
                    success: true,
                    message: "No orders found.",
                    orders: [],
                };
            }

            return {
                success: true,
                message: `Found ${orders.length} order(s).`,
                orders: orders.map(order => ({
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    customerEmail: order.customerEmail,
                    productName: order.productName,
                    quantity: order.quantity,
                    unitPrice: order.unitPrice,
                    totalAmount: order.totalAmount,
                    status: order.status,
                    orderDate: order.orderDate,
                })),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to retrieve orders",
            };
        }
    },
});

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: req.headers,
    });

    // If no session, return unauthorized
    if (!session?.user?.id) {
        return new Response('Unauthorized - No session found', { status: 401 });
    }

    const userId = session.user.id;

    // Check if user is authenticated in Redis
    const isAuthenticated = await redis.get(`${REDIS_AUTH_PREFIX}${userId}`);

    const { message, id: chatId }: { message: UIMessage; id?: string } = await req.json();

    // Generate or use provided chat ID
    const id = chatId || nanoid();

    // Check if chat exists, if not create it
    const existingChat = await getChatById(id);
    if (!existingChat) {
        // Generate title from first user message
        const firstUserMessage = message;
        const messageContent = firstUserMessage ? getMessageContent(firstUserMessage) : '';
        const title = messageContent.substring(0, 100) || 'New Chat';
        
        await saveChat({
            id,
            userId,
            title,
            visibility: 'private',
        });
    }

    // Save user message to database
    const lastMessage = message;
    if (lastMessage?.role === 'user') {
        await saveMessages([{
            id: lastMessage.id || nanoid(),
            chatId: id,
            role: lastMessage.role,
            content: getMessageContent(lastMessage),
        }]);
    }

    const systemPrompt = isAuthenticated
        ? `You are an intelligent employee assistant designed to help staff members with their daily work needs. You have access to a comprehensive company knowledge base and can assist with various tasks.

**Your Capabilities:**

📚 **Knowledge Base Access:**
- Search company documentation, policies, procedures, and technical guides
- Retrieve specific documents and information
- Answer questions about products, services, policies, and processes
- Always cite sources from the knowledge base when providing information

📝 **Information Management:**
- Help employees create and track sales orders
- Retrieve order history and status
- Assist with customer information management

🔍 **How to Help:**
- When employees ask questions, first search the knowledge base for accurate, official information
- Provide clear, concise answers with references to source documents
- If information isn't in the knowledge base, let them know and offer to help in other ways
- Be proactive in suggesting related information that might be helpful

**Available Tools:**
- searchDocs: Search the knowledge base semantically
- getDocContent: Retrieve full document content
- listDocs: Show all available documentation
- createSalesOrder: Create new sales orders
- getRecentOrders: View order history
- signOut: Sign out when done

Be professional, helpful, and efficient. You're here to make employees' work easier and help them find the information they need quickly.`
        : `You are an employee authentication assistant. Access to the employee portal requires authentication.

**Welcome to the Employee Portal**

To access the system and its resources, you need to sign in or create an account.

**For New Employees (Sign Up):**
1. Welcome them to the team
2. Collect: username, email, and password (minimum 8 characters)
3. Use the signUp tool to create their account

**For Existing Employees (Sign In):**
1. Welcome them back
2. Request their username and password
3. Use the signIn tool to authenticate

Be friendly and professional. Only assist with authentication - all other features require signing in first.`;

    const messages = await getMessagesByChatId(id);

    const result = streamText({
        model: xai("grok-4"),
        system: systemPrompt,
        messages: convertToModelMessages(
            messages.map(msg => ({
                role: msg.role as 'user' | 'assistant' | 'system',
                content: msg.content,
                createdAt: msg.createdAt,
                id: msg.id,
                parts: [{ type: 'text', text: msg.content }],
            }))
        ),
        maxRetries: 5,
        stopWhen: stepCountIs(5),
        tools: {
            signUp: createSignUpTool(userId),
            signIn: createSignInTool(userId),
            signOut: createSignOutTool(userId),
            createSalesOrder: createSalesOrderTool(userId),
            getRecentOrders: getRecentOrdersTool(userId),
            searchDocs: searchDocsTool,
            getDocContent: getDocContentTool,
            listDocs: listDocsTool,
        },
        onFinish: async ({ text, toolCalls }) => {
            // Save assistant message to database
            await saveMessages([{
                id: nanoid(),
                chatId: id,
                role: 'assistant',
                content: text || JSON.stringify(toolCalls),
            }]);
        },
    });

    return result.toUIMessageStreamResponse();
}