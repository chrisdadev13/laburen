import { Chat } from "@/components/chat";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Page() {

  const session = await auth.api.getSession({
    headers: await headers() 
  });

  return <Chat currentChatId={generateUUID()} isAuthed={!!session?.user?.id} />;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}