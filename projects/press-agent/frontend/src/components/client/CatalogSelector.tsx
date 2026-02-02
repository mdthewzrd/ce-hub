"use client";

/**
 * Catalog Selector Component
 * Client-facing media outlet catalog with selection and pricing
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface MediaOutlet {
  id: string;
  name: string;
  category: string;
  domain: string;
  audience_reach: string;
  base_price: number;
  expedited_price?: number;
  word_count_min: number;
  word_count_max: number;
  requirements?: string;
}

interface CatalogSelectorProps {
  onComplete?: (selectedOutlets: string[], totalPrice: number) => void;
}

const mockOutlets: MediaOutlet[] = [
  {
    id: "techcrunch",
    name: "TechCrunch",
    category: "Technology",
    domain: "techcrunch.com",
    audience_reach: "8M+ monthly readers",
    base_price: 299,
    expedited_price: 499,
    word_count_min: 400,
    word_count_max: 800,
  },
  {
    id: "venturebeat",
    name: "VentureBeat",
    category: "Technology",
    domain: "venturebeat.com",
    audience_reach: "5M+ monthly readers",
    base_price: 249,
    expedited_price: 399,
    word_count_min: 400,
    word_count_max: 750,
  },
  {
    id: "wired",
    name: "WIRED",
    category: "Technology",
    domain: "wired.com",
    audience_reach: "15M+ monthly readers",
    base_price: 499,
    expedited_price: 799,
    word_count_min: 500,
    word_count_max: 1000,
  },
  {
    id: "business-insider",
    name: "Business Insider",
    category: "Business",
    domain: "businessinsider.com",
    audience_reach: "50M+ monthly readers",
    base_price: 199,
    expedited_price: 349,
    word_count_min: 400,
    word_count_max: 800,
  },
  {
    id: "forbes",
    name: "Forbes",
    category: "Business",
    domain: "forbes.com",
    audience_reach: "80M+ monthly readers",
    base_price: 399,
    expedited_price: 699,
    word_count_min: 500,
    word_count_max: 900,
  },
  {
    id: "bloomberg",
    name: "Bloomberg",
    category: "Finance",
    domain: "bloomberg.com",
    audience_reach: "100M+ monthly readers",
    base_price: 599,
    expedited_price: 999,
    word_count_min: 500,
    word_count_max: 1000,
  },
  {
    id: "wsj",
    name: "Wall Street Journal",
    category: "Finance",
    domain: "wsj.com",
    audience_reach: "10M+ subscribers",
    base_price: 799,
    expedited_price: 1299,
    word_count_min: 600,
    word_count_max: 1200,
  },
  {
    id: "entrepreneur",
    name: "Entrepreneur",
    category: "Business",
    domain: "entrepreneur.com",
    audience_reach: "12M+ monthly readers",
    base_price: 179,
    expedited_price: 299,
    word_count_min: 400,
    word_count_max: 750,
  },
];

const categories = ["All", "Technology", "Business", "Finance", "Health", "General"];

export function CatalogSelector({ onComplete }: CatalogSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedOutlets, setSelectedOutlets] = useState<Set<string>>(new Set());
  const [expedited, setExpedited] = useState<Set<string>>(new Set());
  const [onboardingData, setOnboardingData] = useState<any>(null);

  useEffect(() => {
    // Load onboarding data from session storage
    const data = sessionStorage.getItem("pressRequestData");
    if (data) {
      setOnboardingData(JSON.parse(data));
    }
  }, []);

  const filteredOutlets = mockOutlets.filter(
    (outlet) => selectedCategory === "All" || outlet.category === selectedCategory
  );

  const totalPrice = Array.from(selectedOutlets).reduce((sum, outletId) => {
    const outlet = mockOutlets.find((o) => o.id === outletId);
    if (!outlet) return sum;
    const price = expedited.has(outletId)
      ? (outlet.expedited_price || outlet.base_price * 1.5)
      : outlet.base_price;
    return sum + price;
  }, 0);

  const handleToggleOutlet = (outletId: string) => {
    const newSelected = new Set(selectedOutlets);
    if (newSelected.has(outletId)) {
      newSelected.delete(outletId);
      expedited.delete(outletId);
    } else {
      newSelected.add(outletId);
    }
    setSelectedOutlets(newSelected);
    setExpedited(new Set(expedited));
  };

  const handleToggleExpedited = (outletId: string) => {
    const newExpedited = new Set(expedited);
    if (newExpedited.has(outletId)) {
      newExpedited.delete(outletId);
    } else {
      newExpedited.add(outletId);
    }
    setExpedited(newExpedited);
  };

  const handleSubmit = () => {
    if (selectedOutlets.size === 0) return;

    const requestData = {
      ...onboardingData,
      selected_outlets: Array.from(selectedOutlets),
      expedited_outlets: Array.from(expedited),
      total_price: totalPrice,
    };

    sessionStorage.setItem("pressRequestData", JSON.stringify(requestData));
    onComplete?.(Array.from(selectedOutlets), totalPrice);

    // Redirect to confirmation/tracking
    window.location.href = "/tracking?submitted=true";
  };

  return (
    <div className="space-y-6">
      {/* Onboarding Summary */}
      {onboardingData && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Your Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Type:</span>{" "}
                <span className="capitalize">{onboardingData.announcement_type?.replace(/_/g, " ")}</span>
              </div>
              {onboardingData.key_messages && onboardingData.key_messages.length > 0 && (
                <div>
                  <span className="font-medium">Key Points:</span>
                  <ul className="list-disc list-inside text-muted-foreground ml-2 mt-1">
                    {onboardingData.key_messages.slice(0, 3).map((msg: string, i: number) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Outlet Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOutlets.map((outlet) => {
          const isSelected = selectedOutlets.has(outlet.id);
          const isExpedited = expedited.has(outlet.id);
          const price = isExpedited
            ? (outlet.expedited_price || outlet.base_price * 1.5)
            : outlet.base_price;

          return (
            <Card
              key={outlet.id}
              className={`cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-primary" : "hover:shadow-md"
              }`}
              onClick={() => handleToggleOutlet(outlet.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleToggleOutlet(outlet.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <CardTitle className="text-base">{outlet.name}</CardTitle>
                      <CardDescription className="text-xs">{outlet.domain}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">{outlet.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p>{outlet.audience_reach}</p>
                  <p className="text-xs mt-1">
                    {outlet.word_count_min}-{outlet.word_count_max} words
                  </p>
                </div>

                {isSelected && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Standard</span>
                      <span className="font-medium">{formatCurrency(outlet.base_price)}</span>
                    </div>

                    {outlet.expedited_price && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isExpedited}
                            onChange={() => handleToggleExpedited(outlet.id)}
                            onClick={(e) => e.stopPropagation()}
                            id={`expedited-${outlet.id}`}
                          />
                          <Label htmlFor={`expedited-${outlet.id}`} className="text-sm cursor-pointer">
                            Expedited (24-48h)
                          </Label>
                        </div>
                        <span className="font-medium text-green-600">
                          {formatCurrency(outlet.expedited_price)}
                        </span>
                      </div>
                    )}

                    {outlet.requirements && (
                      <p className="text-xs text-muted-foreground italic">{outlet.requirements}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Bar */}
      {selectedOutlets.size > 0 && (
        <Card className="sticky bottom-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedOutlets.size} outlet{selectedOutlets.size > 1 ? "s" : ""} selected
                </p>
                <p className="text-2xl font-bold">{formatCurrency(totalPrice)}</p>
              </div>
              <Button size="lg" onClick={handleSubmit}>
                Submit Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
