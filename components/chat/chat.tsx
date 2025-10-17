"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  ChatHeader,
  ChatInput,
  type ChatInputMessage,
  ChatInputWrapper,
  ChatList,
  ChatMessages,
  ChatStatusIndicators,
  ChatTitle,
  EmptyState,
} from "@/components/chat";
import { authClient } from "@/lib/auth-client";

interface ChatProps {
  initialMessages?: UIMessage[];
  currentChatId?: string;
  onNewChat?: () => void;
  isAuthed?: boolean;
}

export function Chat({
  initialMessages = [],
  currentChatId,
  onNewChat,
  isAuthed,
}: ChatProps) {
  const [text, setText] = useState<string>("");
  const [chatListOpen, setChatListOpen] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get current session state
  const { data: session } = authClient.useSession();

  // Use initial messages if provided, otherwise use chat state
  const dbMessages = initialMessages.length > 0 ? initialMessages : [];

  const { messages, sendMessage, status } = useChat({
    messages: dbMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages }) => {
        const lastMessage = messages[messages.length - 1] as ChatInputMessage;

        return {
          body: {
            message: lastMessage,
            id: currentChatId,
          },
        };
      },
    }),
  });

  const hasMessages = messages.length > 0 || initialMessages.length > 0;

  const handleSubmit = async (message: ChatInputMessage) => {
    if (!message.text?.trim()) return;

    // If user is not authenticated, check for auth commands
    if (!session) {
      const text = message.text.trim();

      // Handle sign in command: /signin {username} {password}
      if (text.startsWith("/signin ")) {
        const parts = text.split(" ");
        if (parts.length >= 3) {
          const username = parts[1];
          const password = parts.slice(2).join(" "); // Allow spaces in password

          toast.loading("Signing in...", { id: "signin" });

          try {
            const result = await authClient.signIn.username({
              username,
              password,
            });

            if (result.error) {
              toast.error(
                `Sign in failed: ${result.error.message || "Invalid credentials"}`,
                { id: "signin" },
              );
              // Send auth error to AI for user-friendly message
              sendMessage({
                text: `Authentication failed: ${result.error.message || "Invalid credentials"}`,
                metadata: { authError: "signin", originalCommand: text },
              });
              setText("");
              return;
            }

            toast.success("Sign in successful! Welcome back!", {
              id: "signin",
            });
            // If successful, send success message to AI for user feedback
            sendMessage({
              text: "Authentication successful! Welcome to the employee portal.",
              metadata: { authSuccess: "signin" },
            });
            setText("");
          } catch (error) {
            toast.error(
              `Sign in failed: ${error instanceof Error ? error.message : "Unknown error"}`,
              { id: "signin" },
            );
            // Send auth error to AI for user-friendly message
            sendMessage({
              text: `Authentication failed: ${error instanceof Error ? error.message : "Invalid credentials"}`,
              metadata: { authError: "signin", originalCommand: text },
            });
            setText("");
          }
        }
      }

      // Handle sign up command: /signup {email} {username} {password}
      if (text.startsWith("/signup ")) {
        const parts = text.split(" ");
        if (parts.length >= 4) {
          const email = parts[1];
          const username = parts[2];
          const password = parts.slice(3).join(" "); // Allow spaces in password

          toast.loading("Creating account...", { id: "signup" });

          try {
            const result = await authClient.signUp.email({
              email,
              username,
              password,
              name: username,
            });

            if (result.error) {
              toast.error(
                `Account creation failed: ${result.error.message || "Unable to create account"}`,
                { id: "signup" },
              );
              // Send auth error to AI for user-friendly message
              sendMessage({
                text: `Account creation failed: ${result.error.message || "Unable to create account"}`,
                metadata: { authError: "signup", originalCommand: text },
              });
              setText("");
              return;
            }

            toast.success("Account created successfully! Welcome!", {
              id: "signup",
            });
            // If successful, send success message to AI for user feedback
            sendMessage({
              text: "Account created successfully! Welcome to the employee portal.",
              metadata: { authSuccess: "signup" },
            });
            setText("");
          } catch (error) {
            toast.error(
              `Account creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
              { id: "signup" },
            );
            // Send auth error to AI for user-friendly message
            sendMessage({
              text: `Account creation failed: ${error instanceof Error ? error.message : "Unable to create account"}`,
              metadata: { authError: "signup", originalCommand: text },
            });
            setText("");
          }
        }
      }

      // If not an auth command, don't send message
      toast("Authentication required!");
      return;
    }

    // If user is authenticated, send message normally
    sendMessage({ text: message.text });
    window.history.replaceState({}, "", `/${currentChatId}`);
    setText("");
  };

  const handleSuggestionClick = async (suggestion: string) => {
    // If not authenticated, don't allow suggestions
    if (!session?.user?.id) {
      return;
    }

    // Send the suggestion as a message
    sendMessage({ text: suggestion });
    window.history.replaceState({}, "", `/${currentChatId}`);
  };

  const handleNewChatClick = () => {
    if (onNewChat) {
      onNewChat();
    }
    setChatListOpen(false);
  };

  // Create chat input without onSubmit - will be added by wrapper
  const chatInputBase = (
    <ChatInput
      text={text}
      setText={setText}
      textareaRef={textareaRef}
      onSubmit={handleSubmit}
      status={status}
      hasMessages={hasMessages}
    />
  );

  return (
    <div className="relative flex size-full overflow-hidden min-h-screen">
      <ChatHeader onOpenChatList={() => setChatListOpen(true)} />

      {/* Chat List Dialog */}
      <ChatList
        open={chatListOpen}
        onOpenChange={setChatListOpen}
        currentChatId={currentChatId}
        onNewChat={handleNewChatClick}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1">
        {hasMessages ? (
          <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full">
            <ChatTitle title="" />
            <Conversation className="flex-1 overflow-y-auto mb-38">
              <ConversationContent>
                <ChatMessages messages={messages} />
                <ChatStatusIndicators
                  agentStatus={null}
                  currentToolCall={null}
                  status={status}
                />
              </ConversationContent>
              <ConversationScrollButton />

              {/* Input wrapper inside Conversation to access StickToBottom context */}
              <div className="fixed bottom-0 left-0 right-0">
                <div className="w-full px-4 pb-4 max-w-2xl mx-auto">
                  <ChatInputWrapper onSubmit={handleSubmit}>
                    {chatInputBase}
                  </ChatInputWrapper>
                </div>
              </div>
            </Conversation>
          </div>
        ) : (
          <EmptyState
            onSuggestionClick={handleSuggestionClick}
            isAuthenticated={isAuthed}
          >
            {chatInputBase}
          </EmptyState>
        )}
      </div>
    </div>
  );
}
