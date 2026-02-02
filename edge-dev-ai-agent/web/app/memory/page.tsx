/**
 * Memory Page - Clean Design
 */

'use client';

import { useState } from 'react';
import { searchMemory } from '@/lib/api';
import { Search, Brain, MessageSquare, FolderOpen, Sparkles } from 'lucide-react';

export default function MemoryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await searchMemory(query, 10);
      setResults(data.results);
    } catch (err) {
      setError(err as Error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">Memory Search</h1>
          <p className="text-sm text-text-muted">
            Search through past conversations, projects, and learnings
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for strategies, patterns, insights..."
                className="input pl-10"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn btn-primary"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="card bg-error/5 border-error/20 mb-6">
            <p className="text-sm font-medium text-error">Search error</p>
            <p className="text-xs text-error">{error.message}</p>
          </div>
        )}

        {/* Initial state */}
        {!hasSearched && !error && (
          <div className="card text-center p-12">
            <Brain className="mx-auto mb-4 h-12 w-12 text-text-muted" />
            <h3 className="mb-2 text-base font-medium">Search the knowledge base</h3>
            <p className="text-sm text-text-muted">
              Enter a query to search through stored conversations and projects.
            </p>
          </div>
        )}

        {/* No results */}
        {hasSearched && !loading && results.length === 0 && !error && (
          <div className="card text-center p-12">
            <Search className="mx-auto mb-4 h-12 w-12 text-text-muted" />
            <h3 className="mb-2 text-base font-medium">No results found</h3>
            <p className="text-sm text-text-muted">
              Try different keywords or check your spelling.
            </p>
          </div>
        )}

        {/* Results */}
        {hasSearched && !loading && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted">
              Found {results.length} {results.length === 1 ? 'result' : 'results'}
            </p>
            {results.map((result, index) => (
              <ResultCard key={index} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: any }) {
  return (
    <div className="card">
      <div className="mb-3 flex items-center gap-2">
        {result.type === 'project' ? (
          <>
            <FolderOpen className="h-4 w-4 text-primary" />
            <span className="badge badge-primary">Project</span>
          </>
        ) : (
          <>
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="badge badge-primary">Conversation</span>
          </>
        )}
        {result.updated_at && (
          <span className="ml-auto text-xs text-text-muted">
            {new Date(result.updated_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {result.name && (
        <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {result.name}
        </h4>
      )}

      {result.summary && (
        <p className="mb-3 text-xs text-text-muted">{result.summary}</p>
      )}

      {result.description && (
        <p className="mb-3 text-xs text-text-muted line-clamp-2">
          {result.description}
        </p>
      )}

      {result.outcome && (
        <p className="mb-3 text-xs text-text-muted">
          <span className="font-medium">Outcome:</span> {result.outcome}
        </p>
      )}

      {result.learnings?.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-text-muted">Key Learnings:</p>
          <ul className="list-inside list-disc space-y-1 text-xs text-text-muted">
            {result.learnings.slice(0, 3).map((learning: string, i: number) => (
              <li key={i}>{learning}</li>
            ))}
          </ul>
        </div>
      )}

      {result.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.tags.map((tag: string) => (
            <span key={tag} className="badge badge-primary">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
