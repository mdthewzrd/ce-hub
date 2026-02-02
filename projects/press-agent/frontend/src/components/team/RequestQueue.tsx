"use client";

/**
 * Request Queue Component
 * Kanban-style board for managing press requests
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  { id: "incoming", title: "Incoming", color: "bg-blue-500" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-500" },
  { id: "review", title: "Review", color: "bg-purple-500" },
  { id: "completed", title: "Completed", color: "bg-green-500" },
];

const priorityColors = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
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
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
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
      <div className="border-b px-6 py-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Request Queue</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Filter</Button>
            <Button variant="outline" size="sm">Sort</Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 min-w-max h-full">
          {columns.map((column) => {
            const columnRequests = getRequestsByStatus(column.id as RequestStatus);

            return (
              <div
                key={column.id}
                className="w-80 flex-shrink-0 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id as RequestStatus)}
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold">{column.title}</h3>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {columnRequests.length}
                  </span>
                </div>

                {/* Request Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {columnRequests.map((request) => (
                    <Card
                      key={request.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, request.id)}
                      onClick={() => onRequestClick?.(request.id)}
                      className="cursor-move hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm font-medium">
                              {request.company}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {request.client_name}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={priorityColors[request.priority]}
                          >
                            {request.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Badge variant="secondary" className="text-xs">
                          {statusLabels[request.announcement_type as keyof typeof statusLabels] || request.announcement_type}
                        </Badge>

                        <p className="text-sm text-muted-foreground">
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
                            <span>{request.selected_outlets.length} outlet</span>
                            {request.selected_outlets.length > 1 && <span>s</span>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {columnRequests.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No requests
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
