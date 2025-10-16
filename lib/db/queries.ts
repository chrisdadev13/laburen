import { db } from '@/db/drizzle';
import { chat, message } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// Chat queries
export async function getChatById(chatId: string) {
  const [result] = await db
    .select()
    .from(chat)
    .where(eq(chat.id, chatId))
    .limit(1);

  return result;
}

export async function saveChat({
  id,
  userId,
  title,
  visibility = 'private',
}: {
  id: string;
  userId: string;
  title: string;
  visibility?: 'public' | 'private';
}) {
  const [result] = await db
    .insert(chat)
    .values({
      id,
      userId,
      title,
      visibility,
      createdAt: new Date(),
    })
    .returning();

  return result;
}

export async function getChatsByUserId(userId: string) {
  return await db
    .select()
    .from(chat)
    .where(eq(chat.userId, userId))
    .orderBy(desc(chat.createdAt));
}

// Message queries
export async function getMessagesByChatId(chatId: string) {
  return await db
    .select()
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(message.createdAt);
}

export async function saveMessage({
  id,
  chatId,
  role,
  parts,
  attachments,
}: {
  id: string;
  chatId: string;
  role: string;
  parts: any[];
  attachments: any[];
}) {
  const [result] = await db
    .insert(message)
    .values({
      id,
      chatId,
      role,
      parts,
      attachments,
      createdAt: new Date(),
    })
    .returning();

  return result;
}

export async function saveMessages(messages: Array<{
  id: string;
  chatId: string;
  role: string;
  parts: any[];
  attachments: any[];
}>) {
  if (messages.length === 0) return [];

  return await db
    .insert(message)
    .values(
      messages.map((msg) => ({
        ...msg,
        createdAt: new Date(),
      }))
    )
    .returning();
}
