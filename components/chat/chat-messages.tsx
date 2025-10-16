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
        const toolCallParts = parts.filter((part) => part.type === "tool-call");
        const textContent = textParts
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("");
        return (
          <div key={message.id}>
            {/* Render text content in message */}
            {/* Render tool calls */}
            {toolCallParts.length > 0 && message.role === "assistant" && (
              <div className="max-w-[80%] mb-4 space-y-2">
                {toolCallParts.map((part, index) => {
                  if (!("type" in part) || part.type !== "tool-call") {
                    return null;
                  }

                  // Convert our database structure to ToolUIPart interface
                  const toolCallPart = part as any; // Database part structure
                  const toolUIPart: ToolUIPart = {
                    type: `tool-${toolCallPart.toolName}`,
                    toolCallId: toolCallPart.toolCallId,
                    state: toolCallPart.result ? "output-available" : "input-available",
                    input: toolCallPart.args,
                    output: toolCallPart.result?.success !== false ? toolCallPart.result : undefined,
                    errorText: toolCallPart.result?.success === false ? toolCallPart.result?.error || "Tool execution failed" : undefined,
                  };

                  return (
                    <Tool key={`${message.id}-tool-${index}`}>
                      <ToolHeader
                        title={toolCallPart.toolName}
                        type={toolUIPart.type}
                        state={toolUIPart.state}
                      />
                      <ToolContent>
                        {toolUIPart.input ? (
                          <ToolInput input={toolUIPart.input as any} />
                        ) : null}
                        {(toolUIPart.output || toolUIPart.errorText) && (
                          <ToolOutput
                            output={toolUIPart.output}
                            errorText={toolUIPart.errorText}
                          />
                        )}
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
