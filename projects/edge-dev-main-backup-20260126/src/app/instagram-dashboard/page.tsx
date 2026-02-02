/**
 * Unified Instagram Automation Dashboard
 * Single interface for scraping, captions, scheduling, and analytics
 * Traderra/Edge Dev Theme
 */

'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Instagram,
  FileText,
  Calendar,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  MessageSquare,
  Heart
} from 'lucide-react';
const CAPTION_ENGINE_API = process.env.NEXT_PUBLIC_CAPTION_ENGINE_URL || 'http://localhost:3132';

// Types
interface SourceContent {
  id: number;
  original_url: string;
  account: string;
  content_type: 'reel' | 'post' | 'story';
  original_likes: number;
  original_comments: number;
  scraped_at: string;
  status: 'pending' | 'processed' | 'skipped';
}

interface PostedContent {
  id: number;
  source_id: number | null;
  caption_id: number | null;
  media_url: string | null;
  posted_at: string | null;
  our_likes: number;
  our_comments: number;
  our_shares: number;
  our_views: number;
  affiliate_clicks: number;
  status: 'scheduled' | 'posted' | 'failed';
}

interface Caption {
  id: number;
  hook: string;
  full_caption: string;
  category: string;
  target_keyword: string;
  generation_model: string;
  status: 'pending' | 'approved' | 'rejected' | 'posted';
  created_at: string;
  quality_score?: number;
}

export default function InstagramDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sourceContent, setSourceContent] = useState<SourceContent[]>([]);
  const [postedContent, setPostedContent] = useState<PostedContent[]>([]);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [loading, setLoading] = useState(false);

  // Brand Voice State
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [selectedTone, setSelectedTone] = useState('engaging');
  const [selectedPersona, setSelectedPersona] = useState('expert');

  const [stats, setStats] = useState({
    totalScraped: 0,
    totalPosted: 0,
    avgEngagement: 0,
    affiliateClicks: 0,
    pendingCaptions: 0,
    scheduledPosts: 0
  });

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      await Promise.all([
        loadSourceContent(),
        loadPostedContent(),
        loadCaptions(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSourceContent = async () => {
    // TODO: Implement API call
    setSourceContent([]);
  };

  const loadPostedContent = async () => {
    // TODO: Implement API call
    setPostedContent([]);
  };

  const loadCaptions = async () => {
    try {
      const res = await fetch(`${CAPTION_ENGINE_API}/api/captions?limit=20`);
      const data = await res.json();
      setCaptions(data.captions || []);
    } catch (error) {
      console.error('Failed to load captions:', error);
    }
  };

  const loadStats = async () => {
    // TODO: Calculate from source and posted content
    setStats({
      totalScraped: 0,
      totalPosted: 0,
      avgEngagement: 0,
      affiliateClicks: 0,
      pendingCaptions: captions.filter(c => c.status === 'pending').length,
      scheduledPosts: 0
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; textColor: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-[#1a1a1a] border border-[#D4AF37]', textColor: 'text-[#D4AF37]', icon: <Clock className="w-3 h-3" /> },
      approved: { color: 'bg-[#0a2a0a] border border-[#10b981]', textColor: 'text-[#10b981]', icon: <CheckCircle2 className="w-3 h-3" /> },
      rejected: { color: 'bg-[#1a0a0a] border border-[#ef4444]', textColor: 'text-[#ef4444]', icon: <XCircle className="w-3 h-3" /> },
      posted: { color: 'bg-[#0a0a2a] border border-[#3b82f6]', textColor: 'text-[#3b82f6]', icon: <CheckCircle2 className="w-3 h-3" /> },
      processed: { color: 'bg-[#0a2a0a] border border-[#10b981]', textColor: 'text-[#10b981]', icon: <CheckCircle2 className="w-3 h-3" /> },
      scheduled: { color: 'bg-[#1a0a2a] border border-[#a855f7]', textColor: 'text-[#a855f7]', icon: <Calendar className="w-3 h-3" /> },
      failed: { color: 'bg-[#1a0a0a] border border-[#ef4444]', textColor: 'text-[#ef4444]', icon: <XCircle className="w-3 h-3" /> }
    };

    const variant = variants[status] || variants.pending;
    return (
      <Badge className={`${variant.color} ${variant.textColor} border`}>
        <span className="flex items-center gap-1">
          {variant.icon}
          {status}
        </span>
      </Badge>
    );
  };

  return (
    <div className="min-h-screen studio-bg">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#B8860B] bg-clip-text text-transparent flex items-center gap-3">
              <Instagram className="w-10 h-10 text-[#D4AF37]" />
              Instagram Automation Hub
            </h1>
            <p className="text-studio-muted mt-2">
              Unified dashboard for content discovery, caption generation, and performance tracking
            </p>
          </div>
          <Button
            onClick={loadAllData}
            disabled={loading}
            variant="outline"
            className="gap-2 studio-border bg-studio-surface text-studio-text hover:bg-[#1a1a1a] hover:text-[#D4AF37] border-studio-border"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="studio-card metric-tile">
            <div className="metric-tile-label text-[#D4AF37]">Content Library</div>
            <div className="metric-tile-value studio-text number-font">{stats.totalScraped}</div>
            <div className="text-xs text-studio-muted">Scraped items</div>
          </div>

          <div className="studio-card metric-tile">
            <div className="metric-tile-label text-[#D4AF37]">Posts Live</div>
            <div className="metric-tile-value studio-text number-font">{stats.totalPosted}</div>
            <div className="text-xs text-studio-muted">Published content</div>
          </div>

          <div className="studio-card metric-tile">
            <div className="metric-tile-label text-[#D4AF37]">Avg Engagement</div>
            <div className="metric-tile-value studio-text number-font">{stats.avgEngagement}%</div>
            <div className="text-xs text-studio-muted flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#10b981]" />
              Rate
            </div>
          </div>

          <div className="studio-card metric-tile">
            <div className="metric-tile-label text-[#D4AF37]">Affiliate Clicks</div>
            <div className="metric-tile-value studio-text number-font">{stats.affiliateClicks}</div>
            <div className="text-xs text-studio-muted">Link in bio</div>
          </div>

          <div className="studio-card metric-tile">
            <div className="metric-tile-label text-[#D4AF37]">Pending</div>
            <div className="metric-tile-value studio-text number-font">{stats.pendingCaptions}</div>
            <div className="text-xs text-studio-muted">Awaiting review</div>
          </div>

          <div className="studio-card metric-tile">
            <div className="metric-tile-label text-[#D4AF37]">Scheduled</div>
            <div className="metric-tile-value studio-text number-font">{stats.scheduledPosts}</div>
            <div className="text-xs text-studio-muted">Upcoming posts</div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-studio-surface border-studio-border border">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#D4AF37]">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="scrape" className="gap-2 data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#D4AF37]">
              <RefreshCw className="w-4 h-4" />
              Scrape
            </TabsTrigger>
            <TabsTrigger value="captions" className="gap-2 data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#D4AF37]">
              <FileText className="w-4 h-4" />
              Captions
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2 data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#D4AF37]">
              <Calendar className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-[#D4AF37]">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="studio-card studio-surface studio-border">
                <CardHeader>
                  <CardTitle className="text-studio-text">Recent Activity</CardTitle>
                  <CardDescription className="text-studio-muted">Latest actions across the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {captions.slice(0, 5).map((caption) => (
                        <div key={caption.id} className="flex items-start gap-3 p-3 bg-[#0a0a0a] border border-studio-border rounded-lg hover:border-[#D4AF37] transition-colors">
                          <FileText className="w-5 h-5 text-[#D4AF37] mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-studio-text truncate">
                              {caption.hook}
                            </p>
                            <p className="text-xs text-studio-muted mt-1">
                              {caption.category} • {new Date(caption.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(caption.status)}
                        </div>
                      ))}
                      {captions.length === 0 && (
                        <div className="text-center text-studio-muted py-8">
                          No recent activity
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="studio-card studio-surface studio-border">
                <CardHeader>
                  <CardTitle className="text-studio-text">Quick Actions</CardTitle>
                  <CardDescription className="text-studio-muted">Common tasks and operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start gap-3 bg-studio-surface text-studio-text border-studio-border hover:bg-[#1a1a1a] hover:text-[#D4AF37]">
                    <RefreshCw className="w-4 h-4" />
                    Run Scraper
                  </Button>
                  <Button className="w-full justify-start gap-3 bg-studio-surface text-studio-text border-studio-border hover:bg-[#1a1a1a] hover:text-[#D4AF37]">
                    <FileText className="w-4 h-4" />
                    Generate Captions
                  </Button>
                  <Button className="w-full justify-start gap-3 bg-studio-surface text-studio-text border-studio-border hover:bg-[#1a1a1a] hover:text-[#D4AF37]">
                    <Calendar className="w-4 h-4" />
                    Schedule Post
                  </Button>
                  <Button className="w-full justify-start gap-3 bg-studio-surface text-studio-text border-studio-border hover:bg-[#1a1a1a] hover:text-[#D4AF37]">
                    <BarChart3 className="w-4 h-4" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Scrape Tab */}
          <TabsContent value="scrape">
            <Card className="studio-card studio-surface studio-border">
              <CardHeader>
                <CardTitle className="text-studio-text">Content Discovery</CardTitle>
                <CardDescription className="text-studio-muted">Scrape and organize source content from Instagram</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-studio-muted py-12">
                  <Instagram className="w-16 h-16 mx-auto mb-4 text-studio-muted" />
                  <p className="text-lg font-medium text-studio-text">Content Scraper</p>
                  <p className="text-sm mt-2">Configure scraping targets and run discovery jobs</p>
                  <Button className="mt-6 bg-[#D4AF37] text-black hover:bg-[#B8860B]">Configure Scraper</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Captions Tab */}
          <TabsContent value="captions">
            <div className="space-y-6">
              {/* Brand Voice Controls */}
              <Card className="studio-card studio-surface studio-border">
                <CardHeader>
                  <CardTitle className="text-studio-text">🎨 Brand Voice Settings</CardTitle>
                  <CardDescription className="text-studio-muted">Customize how AI generates your captions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category Selector */}
                  <div>
                    <label className="text-sm font-medium text-studio-text mb-3 block">📁 Content Category</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {[
                        { value: 'general', label: 'General', emoji: '🎯' },
                        { value: 'motivation', label: 'Motivation', emoji: '💪' },
                        { value: 'fitness', label: 'Fitness', emoji: '🏋️' },
                        { value: 'business', label: 'Business', emoji: '💼' },
                        { value: 'lifestyle', label: 'Lifestyle', emoji: '✨' },
                        { value: 'education', label: 'Education', emoji: '📚' },
                        { value: 'entertainment', label: 'Entertainment', emoji: '🎭' },
                        { value: 'travel', label: 'Travel', emoji: '✈️' },
                        { value: 'food', label: 'Food', emoji: '🍕' },
                        { value: 'fashion', label: 'Fashion', emoji: '👗' },
                      ].map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setSelectedCategory(cat.value)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            selectedCategory === cat.value
                              ? 'border-[#C13584] bg-gradient-to-br from-[rgba(193,53,132,0.15)] to-[rgba(131,58,180,0.15)] text-[#C13584]'
                              : 'border-studio-border bg-studio-surface text-studio-muted hover:border-[#D4AF37]'
                          }`}
                        >
                          <div className="text-2xl mb-1">{cat.emoji}</div>
                          <div className="text-xs font-medium">{cat.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tone Selector */}
                  <div>
                    <label className="text-sm font-medium text-studio-text mb-3 block">🎨 Caption Tone</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { value: 'engaging', label: 'Engaging', emoji: '⚡' },
                        { value: 'informative', label: 'Informative', emoji: '📖' },
                        { value: 'casual', label: 'Casual', emoji: '😊' },
                        { value: 'professional', label: 'Professional', emoji: '🎩' },
                        { value: 'inspiring', label: 'Inspiring', emoji: '🌟' },
                        { value: 'playful', label: 'Playful', emoji: '🎮' },
                        { value: 'urgent', label: 'Urgent', emoji: '🚨' },
                        { value: 'emotional', label: 'Emotional', emoji: '💭' },
                      ].map((tone) => (
                        <button
                          key={tone.value}
                          onClick={() => setSelectedTone(tone.value)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            selectedTone === tone.value
                              ? 'border-[#833AB4] bg-gradient-to-br from-[rgba(131,58,180,0.15)] to-[rgba(193,53,132,0.15)] text-[#833AB4]'
                              : 'border-studio-border bg-studio-surface text-studio-muted hover:border-[#D4AF37]'
                          }`}
                        >
                          <div className="text-2xl mb-1">{tone.emoji}</div>
                          <div className="text-xs font-medium">{tone.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Persona Selector */}
                  <div>
                    <label className="text-sm font-medium text-studio-text mb-3 block">👤 Brand Persona</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        { value: 'expert', label: 'Helpful Expert', emoji: '🧠' },
                        { value: 'friend', label: 'Fun Friend', emoji: '😄' },
                        { value: 'luxury', label: 'Luxury Brand', emoji: '💎' },
                        { value: 'leader', label: 'Inspirational Leader', emoji: '👑' },
                        { value: 'relatable', label: 'Casual & Relatable', emoji: '🤗' },
                        { value: 'edgy', label: 'Bold & Edgy', emoji: '🔥' },
                        { value: 'professional', label: 'Professional Authority', emoji: '🎯' },
                        { value: 'creative', label: 'Playful & Creative', emoji: '🎨' },
                        { value: 'authentic', label: 'Authentic & Raw', emoji: '💯' },
                      ].map((persona) => (
                        <button
                          key={persona.value}
                          onClick={() => setSelectedPersona(persona.value)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            selectedPersona === persona.value
                              ? 'border-[#E1306C] bg-gradient-to-br from-[rgba(225,48,108,0.15)] to-[rgba(131,58,180,0.15)] text-[#E1306C]'
                              : 'border-studio-border bg-studio-surface text-studio-muted hover:border-[#D4AF37]'
                          }`}
                        >
                          <div className="text-2xl mb-1">{persona.emoji}</div>
                          <div className="text-xs font-medium">{persona.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Selection Summary */}
                  <div className="p-4 bg-[#0a0a0a] border border-studio-border rounded-lg">
                    <div className="text-sm text-studio-muted">
                      <span className="text-studio-text font-medium">Current Brand Voice:</span> {selectedCategory} + {selectedTone} + {selectedPersona}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Caption Management */}
              <Card className="studio-card studio-surface studio-border">
                <CardHeader>
                  <CardTitle className="text-studio-text">Caption Management</CardTitle>
                  <CardDescription className="text-studio-muted">Review, edit, and approve AI-generated captions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {captions.map((caption) => (
                        <div key={caption.id} className="p-4 border border-studio-border rounded-lg hover:border-[#D4AF37] transition-colors bg-[#0a0a0a]">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-studio-text mb-1">
                                {caption.hook}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-studio-muted">
                                <span className="capitalize">{caption.category}</span>
                                <span>•</span>
                                <span>{caption.generation_model}</span>
                                <span>•</span>
                                <span>{new Date(caption.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {getStatusBadge(caption.status)}
                          </div>
                          <p className="text-sm text-studio-muted line-clamp-3">
                            {caption.full_caption}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" className="flex-1 bg-studio-surface text-studio-text border-studio-border hover:bg-[#1a1a1a]">
                              View Details
                            </Button>
                            <Button size="sm" className="flex-1 bg-[#D4AF37] text-black hover:bg-[#B8860B]">
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                      {captions.length === 0 && (
                        <div className="text-center text-studio-muted py-12">
                          <FileText className="w-16 h-16 mx-auto mb-4 text-studio-muted" />
                          <p>No captions yet. Generate your first caption to get started.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card className="studio-card studio-surface studio-border">
              <CardHeader>
                <CardTitle className="text-studio-text">Posting Schedule</CardTitle>
                <CardDescription className="text-studio-muted">Manage your content calendar and posting queue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-studio-muted py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-studio-muted" />
                  <p className="text-lg font-medium text-studio-text">Content Calendar</p>
                  <p className="text-sm mt-2">Schedule and manage upcoming posts</p>
                  <Button className="mt-6 bg-[#D4AF37] text-black hover:bg-[#B8860B]">Open Calendar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="studio-card studio-surface studio-border">
              <CardHeader>
                <CardTitle className="text-studio-text">Performance Analytics</CardTitle>
                <CardDescription className="text-studio-muted">Track engagement, growth, and affiliate performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-[#0a0a0a] to-[#111111] border border-studio-border rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 text-[#D4AF37]" />
                    <div className="text-2xl font-bold text-studio-text number-font">0</div>
                    <div className="text-sm text-studio-muted">Followers</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-[#0a0a0a] to-[#111111] border border-studio-border rounded-lg">
                    <Heart className="w-8 h-8 mx-auto mb-2 text-[#D4AF37]" />
                    <div className="text-2xl font-bold text-studio-text number-font">0</div>
                    <div className="text-sm text-studio-muted">Avg Likes</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-[#0a0a0a] to-[#111111] border border-studio-border rounded-lg">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[#D4AF37]" />
                    <div className="text-2xl font-bold text-studio-text number-font">0</div>
                    <div className="text-sm text-studio-muted">Avg Comments</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-[#0a0a0a] to-[#111111] border border-studio-border rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-[#10b981]" />
                    <div className="text-2xl font-bold text-studio-text number-font">0</div>
                    <div className="text-sm text-studio-muted">Affiliate Clicks</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
