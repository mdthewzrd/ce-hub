/**
 * Instagram Automation Hub - Professional 3D Design
 * Lavender Realm Theme with Proper Studio Design System
 */

'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Instagram,
  FileText,
  Calendar,
  BarChart3,
  RefreshCw,
  Clock,
  TrendingUp,
  Users,
  MessageSquare,
  Heart,
  Sparkles,
  Zap,
  Target,
  Plus,
  Settings
} from 'lucide-react';

const CAPTION_ENGINE_API = process.env.NEXT_PUBLIC_CAPTION_ENGINE_URL || 'http://localhost:3132';

interface Caption {
  id: number;
  hook: string;
  full_caption: string;
  category: string;
  target_keyword: string;
  generation_model: string;
  status: 'pending' | 'approved' | 'rejected' | 'posted';
  created_at: string;
}

interface DashboardStats {
  totalScraped: number;
  totalPosted: number;
  avgEngagement: number;
  affiliateClicks: number;
  pendingCaptions: number;
  scheduledPosts: number;
}

export default function InstagramDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalScraped: 0,
    totalPosted: 0,
    avgEngagement: 0,
    affiliateClicks: 0,
    pendingCaptions: 0,
    scheduledPosts: 0
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCaptions(), loadStats()]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
    setStats({
      totalScraped: captions.length,
      totalPosted: captions.filter(c => c.status === 'posted').length,
      avgEngagement: 0,
      affiliateClicks: 0,
      pendingCaptions: captions.filter(c => c.status === 'pending').length,
      scheduledPosts: 0
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string; text: string; border: string }> = {
      pending: {
        bg: 'bg-amber-950/80',
        text: 'text-amber-400',
        border: 'border-amber-900/50'
      },
      approved: {
        bg: 'bg-emerald-950/80',
        text: 'text-emerald-400',
        border: 'border-emerald-900/50'
      },
      rejected: {
        bg: 'bg-rose-950/80',
        text: 'text-rose-400',
        border: 'border-rose-900/50'
      },
      posted: {
        bg: 'bg-violet-950/80',
        text: 'text-violet-400',
        border: 'border-violet-900/50'
      },
      scheduled: {
        bg: 'bg-purple-950/80',
        text: 'text-purple-400',
        border: 'border-purple-900/50'
      }
    };
    const variant = variants[status] || variants.pending;
    return (
      <Badge className={`${variant.bg} ${variant.text} ${variant.border} border text-xs px-3 py-1.5 font-medium`}>
        {status}
      </Badge>
    );
  };

  const StatCard = ({
    icon: Icon,
    value,
    label,
    color = 'purple'
  }: {
    icon: any;
    value: number | string;
    label: string;
    color?: 'purple' | 'emerald' | 'amber' | 'blue' | 'pink' | 'violet';
  }) => {
    const colorClasses = {
      purple: 'text-purple-400',
      emerald: 'text-emerald-400',
      amber: 'text-amber-400',
      blue: 'text-blue-400',
      pink: 'text-pink-400',
      violet: 'text-violet-400'
    };

    const bgClasses = {
      purple: 'bg-purple-400/10',
      emerald: 'bg-emerald-400/10',
      amber: 'bg-amber-400/10',
      blue: 'bg-blue-400/10',
      pink: 'bg-pink-400/10',
      violet: 'bg-violet-400/10'
    };

    return (
      <div className="purple-surface rounded-xl p-12 hover:p-12 transition-all duration-200">
        <div className="px-4">
          <div className="flex items-start justify-between mb-10">
            <div className={`w-20 h-20 rounded-2xl ${bgClasses[color]} flex items-center justify-center`}>
              <Icon className={`w-9 h-9 ${colorClasses[color]}`} />
            </div>
            <div className="w-2 h-2 rounded-full bg-purple-primary/40"></div>
          </div>
          <div className="text-6xl font-bold purple-text mb-6 tracking-tight px-2">{value}</div>
          <div className="text-lg purple-muted uppercase tracking-widest font-medium px-2">{label}</div>
        </div>
      </div>
    );
  };

  const CaptionCard = ({ caption }: { caption: Caption }) => (
    <div className="purple-surface rounded-xl p-12 hover:p-12 transition-all duration-200">
      <div className="px-4">
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1 pr-8">
            <h3 className="text-xl font-semibold purple-text mb-6 leading-snug">{caption.hook}</h3>
            <div className="flex items-center gap-5 text-base purple-muted">
              <span className="capitalize px-4 py-2 rounded-lg bg-purple-surface-elevated border border-purple-border">
                {caption.category}
              </span>
              <span className="w-1.5 h-1.5 bg-purple-border rounded-full"></span>
              <span>{caption.generation_model}</span>
              <span className="w-1.5 h-1.5 bg-purple-border rounded-full"></span>
              <span>{new Date(caption.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          {getStatusBadge(caption.status)}
        </div>
        <p className="text-lg purple-text line-clamp-2 mb-8 leading-relaxed px-2">
          {caption.full_caption}
        </p>
        <div className="flex gap-6">
          <button className="btn-purple-outline flex-1 text-base h-14 font-medium">
            Details
          </button>
          <button className="btn-purple-primary flex-1 text-base h-14 font-medium">
            Approve
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="purple-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-20 py-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-10">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center glow-purple-md">
              <Instagram className="w-11 h-11 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold purple-text tracking-tight">Instagram Hub</h1>
              <p className="text-xl purple-muted mt-3">Content automation platform</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="btn-purple-ghost flex items-center gap-4 h-14 px-8"
            >
              <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium text-base">Refresh</span>
            </button>
            <button className="btn-purple-outline h-14 w-14 flex items-center justify-center p-0">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 mb-20">
          <StatCard
            icon={FileText}
            value={stats.totalScraped}
            label="Library"
            color="purple"
          />
          <StatCard
            icon={Zap}
            value={stats.totalPosted}
            label="Published"
            color="emerald"
          />
          <StatCard
            icon={Heart}
            value={`${stats.avgEngagement}%`}
            label="Engagement"
            color="amber"
          />
          <StatCard
            icon={Target}
            value={stats.affiliateClicks}
            label="Clicks"
            color="blue"
          />
          <StatCard
            icon={Clock}
            value={stats.pendingCaptions}
            label="Pending"
            color="violet"
          />
          <StatCard
            icon={Calendar}
            value={stats.scheduledPosts}
            label="Scheduled"
            color="pink"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
          <TabsList className="inline-flex h-14 bg-purple-surface rounded-2xl p-2.5 border border-purple-border shadow-lg">
            <TabsTrigger
              value="overview"
              className="px-8 rounded-xl data-[state=active]:bg-purple-surface-elevated data-[state=active]:text-purple-text text-purple-muted text-sm transition-all font-medium"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="scrape"
              className="px-8 rounded-xl data-[state=active]:bg-purple-surface-elevated data-[state=active]:text-purple-text text-purple-muted text-sm transition-all font-medium"
            >
              Scrape
            </TabsTrigger>
            <TabsTrigger
              value="captions"
              className="px-8 rounded-xl data-[state=active]:bg-purple-surface-elevated data-[state=active]:text-purple-text text-purple-muted text-sm transition-all font-medium"
            >
              Captions
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="px-8 rounded-xl data-[state=active]:bg-purple-surface-elevated data-[state=active]:text-purple-text text-purple-muted text-sm transition-all font-medium"
            >
              Schedule
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="px-8 rounded-xl data-[state=active]:bg-purple-surface-elevated data-[state=active]:text-purple-text text-purple-muted text-sm transition-all font-medium"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Recent Activity */}
              <div className="purple-surface-elevated rounded-xl p-12">
                <h2 className="text-base font-bold purple-text mb-10 uppercase tracking-wider">Recent Activity</h2>
                <div className="space-y-5">
                  {captions.slice(0, 5).map((caption) => (
                    <div
                      key={caption.id}
                      className="flex items-center gap-6 p-6 rounded-xl bg-purple-surface hover:bg-purple-surface-elevated transition-all duration-200 border border-purple-border"
                    >
                      <div className="w-14 h-14 rounded-xl bg-purple-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg purple-text truncate font-medium">{caption.hook}</p>
                        <p className="text-base purple-muted mt-2">
                          {caption.category} • {new Date(caption.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(caption.status)}
                    </div>
                  ))}
                  {captions.length === 0 && (
                    <div className="text-center py-20">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-muted/20" />
                      <p className="text-base purple-muted">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="purple-surface-elevated rounded-xl p-12">
                <h2 className="text-base font-bold purple-text mb-10 uppercase tracking-wider">Quick Actions</h2>
                <div className="space-y-5">
                  <button className="btn-purple-outline w-full justify-start h-16 text-left px-8">
                    <Zap className="w-6 h-6 mr-5 text-purple-400" />
                    <span className="font-medium text-lg">Run Scraper</span>
                  </button>
                  <button className="btn-purple-outline w-full justify-start h-16 text-left px-8">
                    <FileText className="w-6 h-6 mr-5 text-emerald-400" />
                    <span className="font-medium text-lg">Generate Captions</span>
                  </button>
                  <button className="btn-purple-outline w-full justify-start h-16 text-left px-8">
                    <Calendar className="w-6 h-6 mr-5 text-pink-400" />
                    <span className="font-medium text-lg">Schedule Post</span>
                  </button>
                  <button className="btn-purple-outline w-full justify-start h-16 text-left px-8">
                    <TrendingUp className="w-6 h-6 mr-5 text-blue-400" />
                    <span className="font-medium text-lg">View Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Scrape Tab */}
          <TabsContent value="scrape">
            <div className="purple-surface-elevated rounded-xl p-20 text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 mx-auto mb-10 flex items-center justify-center glow-purple-lg">
                <Instagram className="w-11 h-11 text-white" />
              </div>
              <h2 className="text-3xl font-bold purple-text mb-4">Content Discovery</h2>
              <p className="text-lg purple-muted mb-12 max-w-md mx-auto leading-relaxed">
                Scrape and organize source content from Instagram
              </p>
              <button className="btn-purple-primary h-14 px-12 text-lg">
                Configure Scraper
              </button>
            </div>
          </TabsContent>

          {/* Captions Tab */}
          <TabsContent value="captions">
            <div className="purple-surface-elevated rounded-xl p-12">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-lg font-bold purple-text uppercase tracking-wider">Caption Management</h2>
                  <p className="text-base purple-muted mt-3">Review and approve captions</p>
                </div>
                <button className="btn-purple-primary h-14 px-10 text-base">
                  <Plus className="w-6 h-6 mr-3" />
                  Generate New
                </button>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {captions.map((caption) => (
                  <CaptionCard key={caption.id} caption={caption} />
                ))}
                {captions.length === 0 && (
                  <div className="text-center py-24">
                    <FileText className="w-24 h-24 mx-auto mb-5 text-purple-muted/20" />
                    <p className="text-lg purple-muted">No captions yet</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <div className="purple-surface-elevated rounded-xl p-24 text-center">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 mx-auto mb-12 flex items-center justify-center glow-purple-lg">
                <Calendar className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-4xl font-bold purple-text mb-5">Content Calendar</h2>
              <p className="text-lg purple-muted mb-14 max-w-md mx-auto leading-relaxed">
                Schedule and manage upcoming posts
              </p>
              <button className="btn-purple-primary h-16 px-14 text-lg">
                Open Calendar
              </button>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="purple-surface-elevated rounded-xl p-12">
              <div className="mb-12">
                <h2 className="text-lg font-bold purple-text uppercase tracking-wider">Performance Analytics</h2>
                <p className="text-base purple-muted mt-3">Track engagement and growth</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="purple-surface rounded-xl p-10 text-center">
                  <Users className="w-11 h-11 mx-auto mb-6 text-purple-400" />
                  <div className="text-5xl font-bold purple-text mb-4">0</div>
                  <div className="text-base purple-muted uppercase tracking-widest font-medium">Followers</div>
                </div>

                <div className="purple-surface rounded-xl p-10 text-center">
                  <Heart className="w-11 h-11 mx-auto mb-6 text-pink-400" />
                  <div className="text-5xl font-bold purple-text mb-4">0</div>
                  <div className="text-base purple-muted uppercase tracking-widest font-medium">Avg Likes</div>
                </div>

                <div className="purple-surface rounded-xl p-10 text-center">
                  <MessageSquare className="w-11 h-11 mx-auto mb-6 text-blue-400" />
                  <div className="text-5xl font-bold purple-text mb-4">0</div>
                  <div className="text-base purple-muted uppercase tracking-widest font-medium">Comments</div>
                </div>

                <div className="purple-surface rounded-xl p-10 text-center">
                  <Target className="w-11 h-11 mx-auto mb-6 text-emerald-400" />
                  <div className="text-5xl font-bold purple-text mb-4">0</div>
                  <div className="text-base purple-muted uppercase tracking-widest font-medium">Clicks</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
