import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Chat } from "@/components/chat";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById(id);

  if (!chat) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers() 
  });

  if (!session) {
    redirect("/api/auth/guest");
  }

  if (chat.visibility === "private") {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId(id);
  const uiMessages = messagesFromDb.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    parts: msg.parts as any, // Cast database JSON parts to UIMessagePart array
    attachments: msg.attachments as any, // Cast database JSON attachments
    createdAt: msg.createdAt,
  }));

  console.dir(messagesFromDb, {depth: null})
  console.dir(uiMessages, {depth: null})

  return (
    <Chat
      initialMessages={uiMessages}
      currentChatId={chat.id}
    />
  );
}