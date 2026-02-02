"use client";

/**
 * Onboarding Chat Component
 * Client-facing AI chat for press request onboarding
 */

import { useCopilotChat, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotChatMessages, CopilotChatInput } from "@copilotkit/react-ui";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface OnboardingChatProps {
  requestId: string;
  clientId: string;
  clientName?: string;
  onComplete?: (data: any) => void;
}

export function OnboardingChat({
  requestId,
  clientId,
  clientName = "there",
  onComplete,
}: OnboardingChatProps) {
  const [collectedData, setCollectedData] = useState<any>({});
  const [isComplete, setIsComplete] = useState(false);

  // Provide context to Copilot
  useCopilotReadable({
    description: "Press request onboarding context",
    value: JSON.stringify({
      requestId,
      clientId,
      clientName,
      collectedData,
      isComplete,
      requiredFields: [
        "announcement_type",
        "key_messages",
        "quotes",
        "company_description",
        "target_audience",
        "target_date",
      ],
    }),
  });

  const {
    messages,
    setMessages,
    appendMessage,
    deleteMessage,
    reloadMessages,
    stopGeneration,
    isLoading,
  } = useCopilotChat();

  // Watch for completion signal in messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      try {
        // Check if message contains JSON completion data
        const content = lastMessage.content;
        if (content.includes('"complete": true')) {
          const jsonStart = content.indexOf("{");
          const jsonEnd = content.lastIndexOf("}") + 1;
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const jsonData = JSON.parse(content.substring(jsonStart, jsonEnd));
            if (jsonData.complete && jsonData.data) {
              setCollectedData(jsonData.data);
              setIsComplete(true);
              onComplete?.(jsonData.data);
            }
          }
        }
      } catch (e) {
        // Not JSON yet, continue onboarding
      }
    }
  }, [messages, onComplete]);

  const initialMessage = {
    role: "assistant" as const,
    id: "welcome",
    content: `Welcome to Press Agent, ${clientName}! I'll help you create an effective press release.

Let's start with the basics. What type of announcement are you planning to make?

For example:
- Launching a new product or service
- Announcing funding or investment
- Hiring a new executive
- Forming a partnership
- Company acquisition
- Award or recognition
- Something else

What type of announcement do you have in mind?`,
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([initialMessage]);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Progress indicator */}
      <div className="border-b px-6 py-4 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Press Release Onboarding</h2>
          {isComplete && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Complete
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {["announcement_type", "key_messages", "quotes", "company", "audience", "date"].map((field, i) => {
            const isFilled = Object.keys(collectedData).some((k) => k.includes(field) || collectedData[k]);
            return (
              <div
                key={field}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  isFilled ? "bg-primary" : "bg-muted"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto">
        <CopilotChatMessages
          messages={messages}
          isLoading={isLoading}
          className="px-6 py-4"
        />
      </div>

      {/* Chat input */}
      <div className="border-t p-4">
        <CopilotChatInput
          placeholder="Tell me about your announcement..."
          className="max-w-3xl mx-auto"
          disabled={isComplete}
        />
      </div>

      {/* Collected data preview (debug view) */}
      {process.env.NODE_ENV === "development" && Object.keys(collectedData).length > 0 && (
        <Card className="m-4 p-4 bg-muted/50">
          <p className="text-xs font-mono text-muted-foreground">
            {JSON.stringify(collectedData, null, 2)}
          </p>
        </Card>
      )}
    </div>
  );
}
