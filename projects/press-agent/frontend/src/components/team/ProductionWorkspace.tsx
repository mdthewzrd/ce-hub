"use client";

/**
 * Production Workspace Component
 * Split-panel workspace for press release production
 */

import { useState } from "react";
import { AgentChatSidebar } from "./AgentChatSidebar";
import { ArticleEditor } from "./ArticleEditor";

interface ProductionWorkspaceProps {
  requestId: string;
  initialData?: {
    pressRelease?: any;
    status?: string;
  };
}

const mockPressRelease = {
  headline: "TechFlow AI Raises $10M Series A to Expand AI-Powered Workflow Platform",
  subheadline: "Funding will fuel EU market expansion and hiring of 50 new engineers",
  lead_paragraph:
    "TechFlow AI, a leading provider of intelligent workflow automation solutions, today announced the completion of a $10 million Series A funding round led by Vertex Ventures with participation from existing investors. The capital will be used to accelerate the company's expansion into European markets and scale its engineering team.",
  body_paragraphs: [
    "The funding comes at a time of rapid growth for TechFlow AI, which has seen its platform adopted by more than 500 enterprise customers worldwide. The company's AI-powered workflow automation has helped businesses reduce operational costs by an average of 40% while increasing productivity by 60%.",
    "\"This investment validates our vision of making intelligent automation accessible to every enterprise,\" said Sarah Chen, CEO of TechFlow AI. \"We're excited to bring our platform to European businesses and build a team that can continue to innovate at the intersection of AI and workflow optimization.\"",
    "TechFlow AI plans to open new offices in London, Berlin, and Paris in the coming quarters, with a goal of serving 1,000 enterprise customers by the end of 2026. The company is also hiring across all departments, with a focus on machine learning engineers, sales representatives, and customer success managers.",
  ],
  quotes: [
    {
      speaker: "Sarah Chen",
      title: "CEO",
      text: "This investment validates our vision of making intelligent automation accessible to every enterprise.",
    },
    {
      speaker: "Marcus Johnson",
      title: "Partner, Vertex Ventures",
      text: "TechFlow AI has demonstrated exceptional product-market fit and a clear path to becoming the category leader in AI-powered workflow automation.",
    },
  ],
  about_section:
    "TechFlow AI is a San Francisco-based company providing intelligent workflow automation solutions for enterprises. The company's platform uses advanced machine learning to automate complex business processes, helping organizations reduce costs and increase productivity. Founded in 2021, TechFlow AI serves over 500 customers worldwide.",
  full_text: "",
};

export function ProductionWorkspace({ requestId, initialData }: ProductionWorkspaceProps) {
  const [activeAgent, setActiveAgent] = useState<"writer" | "editor" | "qa">("writer");
  const [pressRelease, setPressRelease] = useState(initialData?.pressRelease || mockPressRelease);

  const handleAgentChange = (agent: "writer" | "editor" | "qa") => {
    setActiveAgent(agent);
  };

  const handleApprove = () => {
    console.log("Approved press release");
    // Move to next stage
  };

  const handleRequestRevision = (notes: string) => {
    console.log("Revision requested:", notes);
    // Send revision request to writer
  };

  const handleEdit = (content: any) => {
    setPressRelease(content);
  };

  return (
    <div className="flex h-full">
      {/* Article Editor - Main Panel */}
      <div className="flex-1">
        <ArticleEditor
          pressRelease={pressRelease}
          onEdit={handleEdit}
          onSave={() => console.log("Saved")}
        />
      </div>

      {/* Agent Chat Sidebar - Right Panel */}
      <div className="w-96">
        <AgentChatSidebar
          requestId={requestId}
          pressRelease={pressRelease}
          agentType={activeAgent}
          onAgentChange={handleAgentChange}
          onApprove={handleApprove}
          onRequestRevision={handleRequestRevision}
        />
      </div>
    </div>
  );
}
