import type { NextRequest } from "next/server";
import { auth } from '@/lib/auth';
import { getChatsByUserId } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // If no session, return unauthorized
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const chats = await getChatsByUserId(userId);
    return Response.json({ chats });
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    return Response.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}
