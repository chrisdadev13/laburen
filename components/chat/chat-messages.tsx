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

        // Handle both AI SDK format (tool-{toolName}) and database format (tool-call)
        const toolParts = parts.filter((part) =>
          part.type === "tool-call" ||
          (typeof part.type === "string" && part.type.startsWith("tool-"))
        );

        const textContent = textParts
          .map((part) => (part.type === "text" ? part.text : ""))
          .join("");

        return (
          <div key={message.id}>
            {/* Render tool calls - handle both formats */}
            {toolParts.length > 0 && message.role === "assistant" && (
              <div className="max-w-[80%] mb-4 space-y-2">
                {toolParts.map((part, index) => {
                  if (!("type" in part)) {
                    return null;
                  }

                  // Handle database format (tool-call with combined structure)
                  if (part.type === "tool-call") {
                    const toolCallPart = part as any;
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
                            <ToolInput input={toolUIPart.input as React.ReactNode} />
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
                  }

                  // Handle AI SDK format (tool-{toolName} with direct properties)
                  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
                    const toolPart = part as ToolUIPart;
                    const toolName = part.type.replace("tool-", "");

                    return (
                      <Tool key={`${message.id}-tool-${index}`}>
                        <ToolHeader
                          title={toolName}
                          type={toolPart.type}
                          state={toolPart.state}
                        />
                        <ToolContent>
                          {toolPart.input ? (
                            <ToolInput input={toolPart.input as React.ReactNode} />
                          ) : null}
                          {(toolPart.output || toolPart.errorText) && (
                            <ToolOutput
                              output={toolPart.output}
                              errorText={toolPart.errorText}
                            />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }

                  return null;
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
