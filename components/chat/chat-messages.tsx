"use client";

import type { UIMessage, ToolUIPart } from "ai";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

interface ChatMessagesProps {
  messages: UIMessage[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <>
      {messages.map(({ parts, ...message }) => {
        const textParts = parts.filter((part) => part.type === "text");
        const sourceParts = parts.filter((part) => part.type === "source-url");
        const toolParts = parts.filter((part) => part.type.startsWith("tool-"));
        const textContent = textParts
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("");
        return (
          <div key={message.id}>
            {/* Render text content in message */}
            {/* Render tool calls */}
            {toolParts.length > 0 && message.role === "assistant" && (
              <div className="max-w-[80%] mb-4 space-y-2">
                {toolParts.map((part, index) => {
                  if (!("type" in part) || !part.type.startsWith("tool-")) {
                    return null;
                  }

                  const toolPart = part as ToolUIPart;
                  const toolName = toolPart.type.split("-").slice(1).join("-");

                  return (
                    <Tool key={`${message.id}-tool-${index}`}>
                      <ToolHeader
                        title={toolName}
                        type={toolPart.type}
                        state={toolPart.state}
                      />
                      <ToolContent>
                        {"input" in toolPart && toolPart.input ? (
                          <ToolInput input={toolPart.input as any} />
                        ) : null}
                        {"output" in toolPart || "errorText" in toolPart ? (
                          <ToolOutput
                            output={toolPart.output ?? undefined}
                            errorText={toolPart.errorText}
                          />
                        ) : null}
                      </ToolContent>
                    </Tool>
                  );
                })}
              </div>
            )}
            {textParts.length > 0 && (
              <Message from={message.role}>
                <MessageContent variant="flat" className="max-w-[80%]">
                  <Response>{textContent}</Response>
                </MessageContent>
              </Message>
            )}
            {/* Render sources at the bottom */}
            {sourceParts.length > 0 && message.role === "assistant" && (
              <div className="max-w-[80%] mb-4">
                <Sources>
                  <SourcesTrigger count={sourceParts.length} />
                  <SourcesContent>
                    {sourceParts.map((part, index) => {
                      const sourcePart = part as {
                        url: string;
                        title?: string;
                      };
                      return (
                        <Source
                          key={`${message.id}-source-${index}`}
                          href={sourcePart.url}
                          title={sourcePart.title || sourcePart.url}
                        />
                      );
                    })}
                  </SourcesContent>
                </Sources>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
