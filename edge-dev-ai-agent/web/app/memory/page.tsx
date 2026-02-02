/**
 * Memory Page
 *
 * Search and browse stored knowledge and conversations.
 */

'use client';

import { useState } from 'react';
import { searchMemory } from '@/lib/api';
import { Search, Brain, MessageSquare, FolderOpen } from 'lucide-react';

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
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold">Memory Search</h1>
          <p className="text-muted-foreground">
            Search through past conversations, projects, and learnings
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for strategies, patterns, insights..."
                className="w-full rounded-lg border border-border bg-secondary py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg border border-error/20 bg-error/5 p-4">
            <p className="font-medium text-error">Search error</p>
            <p className="text-sm text-error">{error.message}</p>
          </div>
        )}

        {/* Initial state */}
        {!hasSearched && !error && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Brain className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">Search the knowledge base</h3>
            <p className="text-sm text-muted-foreground">
              Enter a query to search through stored conversations, projects, and learnings.
            </p>
          </div>
        )}

        {/* No results */}
        {hasSearched && !loading && results.length === 0 && !error && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No results found</h3>
            <p className="text-sm text-muted-foreground">
              Try different keywords or check your spelling.
            </p>
          </div>
        )}

        {/* Results */}
        {hasSearched && !loading && results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
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
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-3 flex items-center gap-2">
        {result.type === 'project' && (
          <>
            <FolderOpen className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Project</span>
          </>
        )}
        {result.type === 'conversation' && (
          <>
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Conversation</span>
          </>
        )}
        {result.updated_at && (
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(result.updated_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {result.name && (
        <h4 className="mb-2 font-semibold">{result.name}</h4>
      )}

      {result.summary && (
        <p className="mb-3 text-sm text-muted-foreground">{result.summary}</p>
      )}

      {result.description && (
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {result.description}
        </p>
      )}

      {result.outcome && (
        <p className="mb-3 text-sm text-muted-foreground">
          <span className="font-medium">Outcome:</span> {result.outcome}
        </p>
      )}

      {result.learnings && result.learnings.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Key Learnings:</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {result.learnings.slice(0, 3).map((learning: string, i: number) => (
              <li key={i}>{learning}</li>
            ))}
          </ul>
        </div>
      )}

      {result.tags && result.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.tags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
