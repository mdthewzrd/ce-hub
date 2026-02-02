/**
 * Caption Approval Dashboard
 * View, edit, approve, and schedule AI-generated captions
 */

'use client';

import { useState, useEffect } from 'react';

// Types
interface Caption {
  id: number;
  hook: string;
  story_body: string;
  value_prop: string;
  cta_comment: string;
  cta_follow: string;
  full_caption: string;
  hashtag_string: string;
  category: string;
  target_keyword: string;
  generation_model: string;
  status: 'pending' | 'approved' | 'rejected' | 'posted';
  created_at: string;
}

interface ScoreResult {
  overall_score: number;
  grade: string;
  breakdown: {
    hook: number;
    story: number;
    cta: number;
    formatting: number;
    emoji: number;
    hashtags: number;
  };
  issues: string[];
  suggestions: string[];
}

interface QueueItem {
  id: number;
  video_url: string;
  caption_id: number;
  post_status: string;
  scheduled_at?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3131';

export default function CaptionApprovalDashboard() {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<Caption | null>(null);
  const [editingCaption, setEditingCaption] = useState<string>('');
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  // Generate new caption
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    category: 'motivation',
    theme: '',
    target_keyword: 'FREE',
    emotion: 'inspiring',
    use_premium: false
  });

  // Load captions on mount
  useEffect(() => {
    loadCaptions();
  }, [filter]);

  const loadCaptions = async () => {
    try {
      const status = filter === 'all' ? undefined : filter;
      const res = await fetch(`${API_BASE}/api/captions?status=${status || ''}&limit=50`);
      const data = await res.json();
      setCaptions(data.captions || []);
    } catch (error) {
      console.error('Failed to load captions:', error);
    }
  };

  const selectCaption = async (caption: Caption) => {
    setSelectedCaption(caption);
    setEditingCaption(caption.full_caption);

    // Score the caption
    try {
      const res = await fetch(`${API_BASE}/api/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: caption.full_caption,
          category: caption.category
        })
      });
      const scoreData = await res.json();
      setScore(scoreData);
    } catch (error) {
      console.error('Failed to score caption:', error);
    }
  };

  const generateCaption = async () => {
    if (!generateForm.theme) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateForm)
      });
      const data = await res.json();

      if (data.success) {
        await loadCaptions();
        setShowGenerate(false);
        setGenerateForm({ ...generateForm, theme: '' });
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to generate:', error);
      alert('Failed to generate caption');
    } finally {
      setLoading(false);
    }
  };

  const updateCaptionStatus = async (captionId: number, status: string) => {
    try {
      await fetch(`${API_BASE}/api/captions/${captionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await loadCaptions();
      if (selectedCaption?.id === captionId) {
        setSelectedCaption({ ...selectedCaption, status: status as any });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-yellow-100 text-yellow-800';
    if (grade.startsWith('C')) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Caption Approval Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Review, edit, and approve AI-generated captions
            </p>
          </div>
          <button
            onClick={() => setShowGenerate(!showGenerate)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <span>✨</span> Generate New Caption
          </button>
        </div>

        {/* Generate Form */}
        {showGenerate && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Generate Caption</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={generateForm.category}
                  onChange={(e) => setGenerateForm({ ...generateForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="motivation">Motivation</option>
                  <option value="fitness">Fitness</option>
                  <option value="business">Business/Money</option>
                  <option value="lifestyle">Lifestyle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Keyword (ManyChat trigger)
                </label>
                <input
                  type="text"
                  value={generateForm.target_keyword}
                  onChange={(e) => setGenerateForm({ ...generateForm, target_keyword: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="FREE"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme / Topic
                </label>
                <input
                  type="text"
                  value={generateForm.theme}
                  onChange={(e) => setGenerateForm({ ...generateForm, theme: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 2-minute morning routine that changed my life"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emotion
                </label>
                <select
                  value={generateForm.emotion}
                  onChange={(e) => setGenerateForm({ ...generateForm, emotion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="inspiring">Inspiring</option>
                  <option value="urgent">Urgent</option>
                  <option value="friendly">Friendly</option>
                  <option value="controversial">Controversial</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={generateForm.use_premium}
                    onChange={(e) => setGenerateForm({ ...generateForm, use_premium: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Use Premium Model (GPT-4o-mini)</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowGenerate(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={generateCaption}
                disabled={loading || !generateForm.theme}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Generate Caption'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Caption List */}
          <div className="col-span-1 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-2">
                {(['all', 'pending', 'approved'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium capitalize ${
                      filter === f
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {captions.map((caption) => (
                <div
                  key={caption.id}
                  onClick={() => selectCaption(caption)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedCaption?.id === caption.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {caption.hook}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 capitalize">
                        {caption.category} • {caption.generation_model}
                      </p>
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                      caption.status === 'approved' ? 'bg-green-100 text-green-800' :
                      caption.status === 'posted' ? 'bg-blue-100 text-blue-800' :
                      caption.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {caption.status}
                    </span>
                  </div>
                </div>
              ))}
              {captions.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No captions found
                </div>
              )}
            </div>
          </div>

          {/* Caption Editor */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            {selectedCaption ? (
              <div className="p-6">
                {/* Score Badge */}
                {score && (
                  <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl font-bold ${getScoreColor(score.overall_score)}`}>
                        {score.overall_score}
                      </div>
                      <div>
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(score.grade)}`}>
                          Grade: {score.grade}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Overall Quality Score
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <div>Model: {selectedCaption.generation_model}</div>
                      <div>Category: {selectedCaption.category}</div>
                    </div>
                  </div>
                )}

                {/* Score Breakdown */}
                {score && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {Object.entries(score.breakdown).map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 capitalize">{key}</div>
                        <div className={`text-lg font-semibold ${getScoreColor(value as number)}`}>
                          {value}/100
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Caption Editor */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Caption (Editable)
                  </label>
                  <textarea
                    value={editingCaption}
                    onChange={(e) => setEditingCaption(e.target.value)}
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                </div>

                {/* Issues & Suggestions */}
                {score && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {score.issues.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-red-800 mb-2">
                          ❌ Issues ({score.issues.length})
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {score.issues.map((issue, i) => (
                            <li key={i}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {score.suggestions.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">
                          💡 Suggestions ({score.suggestions.length})
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {score.suggestions.map((suggestion, i) => (
                            <li key={i}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateCaptionStatus(selectedCaption.id, 'approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <span>✅</span> Approve
                    </button>
                    <button
                      onClick={() => updateCaptionStatus(selectedCaption.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <span>❌</span> Reject
                    </button>
                  </div>
                  <button
                    onClick={() => {/* TODO: Schedule post */}}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <span>📅</span> Schedule Post
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p>Select a caption to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
