// import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import { streamText, tool, stepCountIs, type UIMessage } from 'ai';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/db/drizzle';
import { salesOrders } from '@/db/schema';
import { nanoid } from 'nanoid';
import { desc, eq } from 'drizzle-orm';
import { searchDocsTool, getDocContentTool, listDocsTool } from '@/lib/rag-tools';
import { getChatById, getMessagesByChatId, saveChat, saveMessages } from '@/lib/db/queries';

export const maxDuration = 30;

// Helper function to extract text content from UIMessage parts
function getMessageContent(message: UIMessage): string {
    if (!message.parts || message.parts.length === 0) return '';

    return message.parts
        .filter((part) => 'type' in part && part.type === 'text')
        .map((part) => 'text' in part ? part.text : '')
        .join(' ');
}

// Type for database message parts
type DBMessagePart = {
    type: 'text';
    text: string;
};

// Type for database message
type DBMessage = {
    id: string;
    chatId: string;
    role: string;
    parts: DBMessagePart[];
    attachments: any[];
    createdAt: Date;
};

// Helper function to convert database message to ModelMessage format for AI SDK
function convertDBMessageToModelMessage(dbMessage: DBMessage) {
    const textContent = dbMessage.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text || '')
        .join(' ');

    return {
        role: dbMessage.role as 'user' | 'assistant' | 'system',
        content: textContent,
        parts: dbMessage.parts.map(part => ({
            type: part.type as 'text',
            text: part.text,
        })) as any,
    };
}

// Helper function to convert UIMessage to database message format
function convertToDBMessage(uiMessage: UIMessage, chatId: string) {
    return {
        id: uiMessage.id || nanoid(),
        chatId,
        role: uiMessage.role,
        parts: (uiMessage.parts || []).map(part => ({
            type: part.type as 'text',
            text: 'text' in part ? part.text : '',
        })),
        attachments: [], // TODO: Handle attachments if needed
    };
}

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

    // If no session, return helpful auth instructions (no AI tokens used!)
    if (!session?.user?.id) {
        return new Response(
            JSON.stringify({
                messages: [{
                    id: nanoid(),
                    role: 'assistant',
                    content: `🔐 **Welcome to the Employee Portal**

To access the system and its features, you need to authenticate first.

**Sign In (Existing Account):**
Use this command format:
\`/signin {username} {password}\`

**Sign Up (New Account):**
Use this command format:
\`/signup {email} {username} {password}\`

Once you authenticate successfully, you'll have access to:
- 📚 Knowledge base search and documentation
- 📝 Sales order creation and management
- 🔍 Order history and status tracking
- And much more!

Please use one of the authentication commands above to get started.`,
                    parts: [{
                        type: 'text',
                        text: `🔐 **Welcome to the Employee Portal**

To access the system and its features, you need to authenticate first.

**Sign In (Existing Account):**
Use this command format:
\`/signin {username} {password}\`

**Sign Up (New Account):**
Use this command format:
\`/signup {email} {username} {password}\`

Once you authenticate successfully, you'll have access to:
- 📚 Knowledge base search and documentation
- 📝 Sales order creation and management
- 🔍 Order history and status tracking
- And much more!

Please use one of the authentication commands above to get started.`
                    }],
                    createdAt: new Date(),
                }]
            }),
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    const userId = session.user.id;

    const { message, id: chatId }: { message: UIMessage & { metadata?: { authError?: string; authSuccess?: string; originalCommand?: string } }; id?: string } = await req.json();

    // Generate or use provided chat ID
    const id = chatId || nanoid();

    // Check if this is an auth success message
    const isAuthSuccess = message?.metadata?.authSuccess;

    if (isAuthSuccess && message.metadata) {
        // Return hardcoded welcome message for successful authentication (no AI tokens used!)
        const successMessages = {
            signin: "🎉 Sign in successful! Welcome back to the employee portal. You now have access to all features including knowledge base search, sales order management, and more. How can I help you today?",
            signup: "🎉 Account created successfully! Welcome to the employee portal. You now have access to all features including knowledge base search, sales order management, and more. How can I help you today?"
        };

        return new Response(
            JSON.stringify({
                messages: [{
                    id: nanoid(),
                    role: 'assistant',
                    content: successMessages[message.metadata.authSuccess as keyof typeof successMessages] || "🎉 Authentication successful! Welcome to the employee portal.",
                    parts: [{
                        type: 'text',
                        text: successMessages[message.metadata.authSuccess as keyof typeof successMessages] || "🎉 Authentication successful! Welcome to the employee portal."
                    }],
                    createdAt: new Date(),
                }]
            }),
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    // Check if this is an auth error message
    const isAuthError = message?.metadata?.authError;

    if (isAuthError && message.metadata) {
        // Return hardcoded auth error message (no AI tokens used!)
        const errorMessages = {
            signin: "❌ Sign in failed! Please check your username and password and try again.",
            signup: "❌ Account creation failed! Please check your information and try again."
        };

        return new Response(
            JSON.stringify({
                messages: [{
                    id: nanoid(),
                    role: 'assistant',
                    content: errorMessages[message.metadata.authError as keyof typeof errorMessages] || "❌ Authentication failed. Please try again.",
                    parts: [{
                        type: 'text',
                        text: errorMessages[message.metadata.authError as keyof typeof errorMessages] || "❌ Authentication failed. Please try again."
                    }],
                    createdAt: new Date(),
                }]
            }),
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    // Check if this is a new user session (just authenticated)
    const existingChat = await getChatById(id);
    const isNewSession = !existingChat && !message; // No existing chat and no message means welcome

    if (isNewSession) {
        // Return hardcoded welcome message for new authentication
        return new Response(
            JSON.stringify({
                messages: [{
                    id: nanoid(),
                    role: 'assistant',
                    content: "Yay, you're in! 🎉 Welcome to the employee portal. You now have access to all features including knowledge base search, sales order management, and more. How can I help you today?",
                    parts: [{
                        type: 'text',
                        text: "Yay, you're in! 🎉 Welcome to the employee portal. You now have access to all features including knowledge base search, sales order management, and more. How can I help you today?"
                    }],
                    createdAt: new Date(),
                }]
            }),
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    // Check if chat exists, if not create it
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

    // Save user message to database (if this isn't a new session)
    if (message && message.role === 'user') {
        await saveMessages([convertToDBMessage(message, id)]);
    }

    const systemPrompt = `You are an intelligent employee assistant designed to help staff members with their daily work needs. You have access to a comprehensive company knowledge base and can assist with various tasks.

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

Be professional, helpful, and efficient. You're here to make employees' work easier and help them find the information they need quickly.`;

    const messages = await getMessagesByChatId(id);

    const result = streamText({
        model: xai("grok-4"),
        system: systemPrompt,
        messages: messages.map(msg => convertDBMessageToModelMessage(msg as DBMessage)),
        maxRetries: 5,
        stopWhen: stepCountIs(5),
        tools: {
            createSalesOrder: createSalesOrderTool(userId),
            getRecentOrders: getRecentOrdersTool(userId),
            searchDocs: searchDocsTool,
            getDocContent: getDocContentTool,
            listDocs: listDocsTool,
        },
        onFinish: async (opts) => {
            console.dir(opts, {depth: null})
            // Build parts array for assistant message

            const parts: Array<{ type: string; text?: string; toolCallId?: string; toolName?: string; args?: any; result?: any; output?: any }> = [];

            // Add text content if present
            if (opts.text?.trim()) {
                parts.push({ type: 'text', text: opts.text });
            }

            // Extract tool calls from steps and combine with results
            if (opts.steps && opts.steps.length > 0) {
                opts.steps.forEach((step: any) => {
                    if (step.content && Array.isArray(step.content)) {
                        // Group tool calls with their results
                        const toolCallMap = new Map();

                        step.content.forEach((contentItem: any) => {
                            if (contentItem.type === 'tool-call') {
                                toolCallMap.set(contentItem.toolCallId, {
                                    type: 'tool-call',
                                    toolCallId: contentItem.toolCallId,
                                    toolName: contentItem.toolName,
                                    args: contentItem.input || (contentItem as any).args || {},
                                    result: null, // Will be filled when we find the result
                                });
                            } else if (contentItem.type === 'tool-result') {
                                const existingCall = toolCallMap.get(contentItem.toolCallId);
                                if (existingCall) {
                                    existingCall.result = contentItem.output || contentItem.result || {};
                                } else {
                                    // Result without call (shouldn't happen but handle it)
                                    parts.push({
                                        type: 'tool-result',
                                        toolCallId: contentItem.toolCallId,
                                        toolName: contentItem.toolName,
                                        output: contentItem.output || contentItem.result || {},
                                    });
                                }
                            }
                        });

                        // Add all complete tool calls (with or without results)
                        toolCallMap.forEach((toolCall) => {
                            parts.push(toolCall);
                        });
                    }
                });
            }

            // Fallback: check if toolCalls exists at top level (shouldn't happen but just in case)
            if (opts.toolCalls && opts.toolCalls.length > 0) {
                opts.toolCalls.forEach((toolCall: any) => {
                    parts.push({
                        type: 'tool-call',
                        toolCallId: toolCall.toolCallId,
                        toolName: toolCall.toolName,
                        args: (toolCall as any).args || (toolCall as any).arguments || toolCall.input || {},
                    });
                });
            }

            // Save assistant message to database
            if (parts.length > 0) {
                await saveMessages([{
                    id: nanoid(),
                    chatId: id,
                    role: 'assistant',
                    parts,
                    attachments: [],
                }]);
            }
        },
    });

    return result.toUIMessageStreamResponse();
}