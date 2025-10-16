"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useState } from "react";
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
import { DefaultChatTransport, type UIMessage } from "ai";

interface ChatProps {
  initialMessages?: UIMessage[];
  currentChatId?: string;
  onNewChat?: () => void;
}

export function Chat({
  initialMessages = [],
  currentChatId,
  onNewChat,
}: ChatProps) {
  const [text, setText] = useState<string>("");
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
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
    if (message.text?.trim()) {
      // Only create anonymous session if user doesn't have one
      if (!session) {
        try {
          await authClient.signIn.anonymous();
        } catch (error) {
          console.error("Failed to create anonymous session:", error);
          return; // Don't send message if session creation failed
        }
      }

      sendMessage({ text: message.text });
      setText("");
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    // Only create anonymous session if user doesn't have one
    if (!session) {
      try {
        await authClient.signIn.anonymous();
      } catch (error) {
        console.error("Failed to create anonymous session:", error);
        return; // Don't send message if session creation failed
      }
    }

    // Send the suggestion as a message
    sendMessage({ text: suggestion });
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
      useWebSearch={useWebSearch}
      setUseWebSearch={setUseWebSearch}
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
          <EmptyState onSuggestionClick={handleSuggestionClick}>
            {chatInputBase}
          </EmptyState>
        )}
      </div>
    </div>
  );
}
