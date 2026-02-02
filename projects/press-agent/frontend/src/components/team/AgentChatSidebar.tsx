"use client";

/**
 * Agent Chat Sidebar
 * Multi-agent chat interface for interacting with Writer, Editor, and QA agents
 */

import { useState } from "react";
import { useCopilotChat, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotChatMessages, CopilotChatInput } from "@copilotkit/react-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AgentChatSidebarProps {
  requestId: string;
  pressRelease?: any;
  agentType: "writer" | "editor" | "qa";
  onAgentChange: (agent: "writer" | "editor" | "qa") => void;
  onApprove?: () => void;
  onRequestRevision?: (notes: string) => void;
}

const agents = {
  writer: {
    name: "Writer Agent",
    description: "Generate and refine press release content",
    model: "Claude 3.5 Sonnet",
    color: "bg-blue-500",
  },
  editor: {
    name: "Editor Agent",
    description: "Review for AP style and quality",
    model: "GPT-4o-mini",
    color: "bg-purple-500",
  },
  qa: {
    name: "QA Agent",
    description: "Quality checks and validation",
    model: "GPT-4o-mini",
    color: "bg-green-500",
  },
};

export function AgentChatSidebar({
  requestId,
  pressRelease,
  agentType,
  onAgentChange,
  onApprove,
  onRequestRevision,
}: AgentChatSidebarProps) {
  const [localPressRelease, setLocalPressRelease] = useState(pressRelease);

  // Provide context to the active agent
  useCopilotReadable({
    description: `Press release context for ${agentType} agent`,
    value: JSON.stringify({
      requestId,
      agentType,
      pressRelease: localPressRelease,
      agent: agents[agentType],
    }),
  });

  const { messages, setMessages, isLoading } = useCopilotChat();

  const handleAgentMessage = (message: string) => {
    // Agent-specific message handling
    switch (agentType) {
      case "writer":
        if (message.toLowerCase().includes("revise") || message.toLowerCase().includes("change")) {
          // Request revision from writer
          onRequestRevision?.(message);
        }
        break;
      case "editor":
        if (message.toLowerCase().includes("approve")) {
          onApprove?.();
        }
        break;
      case "qa":
        // QA agent provides quality reports
        break;
    }
  };

  return (
    <div className="flex flex-col h-full border-l">
      {/* Agent Selector */}
      <div className="border-b p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Select Agent</h3>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(agents) as Array<keyof typeof agents>).map((agent) => (
            <button
              key={agent}
              onClick={() => onAgentChange(agent)}
              className={`p-3 rounded-lg border-2 transition-all ${
                agentType === agent
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-muted"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${agents[agent].color}`} />
                <span className="text-sm font-medium">{agents[agent].name}</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                {agents[agent].model}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Active Agent Info */}
      <div className="border-b p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">{agents[agentType].name}</h4>
          <Badge variant="secondary" className="text-xs">
            {agents[agentType].model}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{agents[agentType].description}</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <CopilotChatMessages
          messages={messages}
          isLoading={isLoading}
          className="px-4 py-4"
        />
      </div>

      {/* Chat Input */}
      <div className="border-t p-4">
        <CopilotChatInput
          placeholder={`Ask ${agents[agentType].name}...`}
          className="text-sm"
        />
      </div>

      {/* Quick Actions */}
      <div className="border-t p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Quick Actions</p>

        {agentType === "writer" && (
          <div className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                // Generate new draft
              }}
            >
              Generate new draft
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                onRequestRevision?.("Make the headline more compelling");
              }}
            >
              Improve headline
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                onRequestRevision?.("Add more specific details and metrics");
              }}
            >
              Add more details
            </Button>
          </div>
        )}

        {agentType === "editor" && (
          <div className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                // Run AP style check
              }}
            >
              Check AP style
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                // Auto-correct minor issues
              }}
            >
              Auto-fix issues
            </Button>
            <Button
              size="sm"
              className="w-full justify-start text-xs bg-green-600 hover:bg-green-700"
              onClick={onApprove}
            >
              Approve & Send to QA
            </Button>
          </div>
        )}

        {agentType === "qa" && (
          <div className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                // Run full QA check
              }}
            >
              Run full quality check
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                // Check plagiarism
              }}
            >
              Check plagiarism
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                // Check AI detection
              }}
            >
              Check AI detection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
