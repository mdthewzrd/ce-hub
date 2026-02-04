"use client";

/**
 * Request Queue Component
 * Kanban-style board for managing press requests
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency, truncate } from "@/lib/utils";

type RequestStatus = "incoming" | "in_progress" | "review" | "completed";

interface PressRequest {
  id: string;
  client_name: string;
  company: string;
  announcement_type: string;
  key_messages: string[];
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  selected_outlets: string[];
  status: RequestStatus;
  created_at: string;
  priority: "low" | "medium" | "high";
}

interface RequestQueueProps {
  onRequestClick?: (requestId: string) => void;
}

const mockRequests: PressRequest[] = [
  {
    id: "req-1",
    client_name: "Sarah Chen",
    company: "TechFlow AI",
    announcement_type: "funding_announcement",
    key_messages: ["Raised $10M Series A", "Expanding to EU markets", "Hiring 50 new engineers"],
    budget_min: 1000,
    budget_max: 3000,
    deadline: "2025-02-15",
    selected_outlets: ["techcrunch", "venturebeat"],
    status: "incoming",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    priority: "high",
  },
  {
    id: "req-2",
    client_name: "Marcus Johnson",
    company: "GreenLeaf Solutions",
    announcement_type: "product_launch",
    key_messages: ["Launching sustainable packaging", "Patented technology", "Partnership with major retailers"],
    budget_min: 500,
    budget_max: 1500,
    selected_outlets: ["entrepreneur", "business-insider"],
    status: "in_progress",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    priority: "medium",
  },
  {
    id: "req-3",
    client_name: "Elena Rodriguez",
    company: "MedTech Pro",
    announcement_type: "executive_hiring",
    key_messages: ["New CEO appointed", "Former VP at Google", "25 years healthcare experience"],
    budget_min: 2000,
    budget_max: 5000,
    selected_outlets: ["forbes", "bloomberg", "wsj"],
    status: "review",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    priority: "high",
  },
  {
    id: "req-4",
    client_name: "David Kim",
    company: "CloudSync Inc",
    announcement_type: "partnership",
    key_messages: ["Strategic partnership with AWS", "Integrated solutions", "Joint product launch"],
    budget_min: 1000,
    budget_max: 2000,
    selected_outlets: ["techcrunch", "venturebeat"],
    status: "completed",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    priority: "low",
  },
];

const columns = [
  { id: "incoming", title: "Incoming" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "completed", title: "Done" },
];

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels = {
  product_launch: "Product Launch",
  funding_announcement: "Funding",
  executive_hiring: "Executive Hire",
  partnership: "Partnership",
  acquisition: "Acquisition",
};

export function RequestQueue({ onRequestClick }: RequestQueueProps) {
  const [requests, setRequests] = useState<PressRequest[]>(mockRequests);
  const [draggedRequest, setDraggedRequest] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, requestId: string) => {
    setDraggedRequest(requestId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: RequestStatus) => {
    e.preventDefault();
    if (!draggedRequest) return;

    setRequests((prev) =>
      prev.map((req) =>
        req.id === draggedRequest ? { ...req, status: newStatus } : req
      )
    );
    setDraggedRequest(null);
  };

  const getRequestsByStatus = (status: RequestStatus) => {
    return requests.filter((req) => req.status === status);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Queue</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{requests.length} requests</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 min-w-max h-full">
          {columns.map((column) => {
            const columnRequests = getRequestsByStatus(column.id as RequestStatus);
            const count = columnRequests.length;

            return (
              <div
                key={column.id}
                className="w-72 flex-shrink-0 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id as RequestStatus)}
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-medium">{column.title}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </div>

                {/* Request Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {columnRequests.map((request) => (
                    <Card
                      key={request.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, request.id)}
                      onClick={() => onRequestClick?.(request.id)}
                      className="cursor-pointer border-glow card-elevated bg-card/50 hover:bg-card/80 transition-colors"
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{request.company}</p>
                            <p className="text-xs text-muted-foreground truncate">{request.client_name}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs px-1.5 py-0.5 ${priorityColors[request.priority]}`}
                          >
                            {request.priority}
                          </Badge>
                        </div>

                        <Badge variant="secondary" className="text-xs">
                          {statusLabels[request.announcement_type as keyof typeof statusLabels] || request.announcement_type}
                        </Badge>

                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {truncate(request.key_messages[0] || "", 60)}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatDate(request.created_at)}</span>
                          {request.budget_max && (
                            <span>{formatCurrency(request.budget_max)}</span>
                          )}
                        </div>

                        {request.selected_outlets.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{request.selected_outlets.length}</span>
                            <span>outlet{request.selected_outlets.length > 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {columnRequests.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-muted-foreground">No requests</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
