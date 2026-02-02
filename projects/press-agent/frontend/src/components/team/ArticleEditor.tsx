"use client";

/**
 * Article Editor Component
 * Displays and allows editing of press release content
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ArticleEditorProps {
  pressRelease: {
    headline?: string;
    subheadline?: string;
    lead_paragraph?: string;
    body_paragraphs?: string[];
    quotes?: Array<{ speaker: string; title?: string; text: string }>;
    about_section?: string;
    full_text?: string;
  };
  onEdit?: (content: any) => void;
  onSave?: () => void;
}

export function ArticleEditor({ pressRelease, onEdit, onSave }: ArticleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(pressRelease);

  const wordCount = pressRelease.full_text
    ? pressRelease.full_text.split(/\s+/).length
    : 0;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onEdit?.(editedContent);
    setIsEditing(false);
    onSave?.();
  };

  const handleCancel = () => {
    setEditedContent(pressRelease);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Press Release</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>Version {1}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Print
                </Button>
                <Button size="sm" onClick={handleEdit}>
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-950 rounded-lg shadow-sm p-8">
          {/* FOR IMMEDIATE RELEASE */}
          <div className="text-center mb-8">
            <p className="font-semibold text-sm uppercase tracking-wide">
              FOR IMMEDIATE RELEASE
            </p>
          </div>

          {/* Headline */}
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">
            {isEditing ? (
              <input
                type="text"
                value={editedContent.headline || ""}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, headline: e.target.value })
                }
                className="w-full text-center border-b-2 border-dashed focus:outline-none"
              />
            ) : (
              pressRelease.headline || "Headline Goes Here"
            )}
          </h1>

          {/* Subheadline */}
          {pressRelease.subheadline && (
            <p className="text-center text-muted-foreground mb-8">
              {isEditing ? (
                <input
                  type="text"
                  value={editedContent.subheadline || ""}
                  onChange={(e) =>
                    setEditedContent({ ...editedContent, subheadline: e.target.value })
                  }
                  className="w-full text-center border-b border-dashed focus:outline-none"
                />
              ) : (
                pressRelease.subheadline
              )}
            </p>
          )}

          {/* Dateline + Lead */}
          <div className="mb-6">
            <p className="font-semibold">SAN FRANCISCO, California –</p>
            {isEditing ? (
              <textarea
                value={editedContent.lead_paragraph || ""}
                onChange={(e) =>
                  setEditedContent({ ...editedContent, lead_paragraph: e.target.value })
                }
                className="w-full border border-dashed rounded p-2 focus:outline-none min-h-[100px]"
              />
            ) : (
              <p className="text-justify">
                {pressRelease.lead_paragraph || "Lead paragraph goes here..."}
              </p>
            )}
          </div>

          {/* Body Paragraphs */}
          <div className="space-y-4 mb-8">
            {(pressRelease.body_paragraphs || ["Body paragraph 1...", "Body paragraph 2..."]).map(
              (paragraph, index) => (
                <p key={index} className="text-justify">
                  {isEditing ? (
                    <textarea
                      value={editedContent.body_paragraphs?.[index] || paragraph}
                      onChange={(e) => {
                        const newParagraphs = [...(editedContent.body_paragraphs || pressRelease.body_paragraphs || [])];
                        newParagraphs[index] = e.target.value;
                        setEditedContent({ ...editedContent, body_paragraphs: newParagraphs });
                      }}
                      className="w-full border border-dashed rounded p-2 focus:outline-none min-h-[80px]"
                    />
                  ) : (
                    paragraph
                  )}
                </p>
              )
            )}
          </div>

          {/* Quotes */}
          {pressRelease.quotes && pressRelease.quotes.length > 0 && (
            <div className="space-y-6 mb-8">
              {pressRelease.quotes.map((quote, index) => (
                <blockquote key={index} className="border-l-4 border-primary pl-4 italic">
                  <p className="text-lg">"{quote.text}"</p>
                  <footer className="mt-2 text-sm font-medium not-italic">
                    — {quote.speaker}
                    {quote.title && <span>, {quote.title}</span>}
                  </footer>
                </blockquote>
              ))}
            </div>
          )}

          {/* About Section */}
          {pressRelease.about_section && (
            <div className="border-t pt-8">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-muted-foreground">
                {isEditing ? (
                  <textarea
                    value={editedContent.about_section || ""}
                    onChange={(e) =>
                      setEditedContent({ ...editedContent, about_section: e.target.value })
                    }
                    className="w-full border border-dashed rounded p-2 focus:outline-none min-h-[80px]"
                  />
                ) : (
                  pressRelease.about_section
                )}
              </p>
            </div>
          )}

          {/* End mark */}
          <div className="text-center mt-12 text-muted-foreground">
            ###
          </div>
        </div>
      </div>

      {/* Footer with quality indicators */}
      <div className="border-t px-6 py-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Quality Score:</span>
              <Badge variant="success" className="text-sm">88%</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Plagiarism:</span>
              <Badge variant="secondary" className="text-sm">3%</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">AI Detection:</span>
              <Badge variant="secondary" className="text-sm">12%</Badge>
            </div>
          </div>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            Approve for Delivery
          </Button>
        </div>
      </div>
    </div>
  );
}
