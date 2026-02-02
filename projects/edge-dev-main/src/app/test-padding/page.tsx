'use client';

export default function TestPaddingPage() {
  return (
    <div className="purple-bg min-h-screen p-20">
      <div className="purple-surface rounded-xl p-12">
        <h1 className="text-6xl font-bold purple-text mb-6">Test Padding</h1>
        <p className="text-xl purple-muted">This should have 3rem (48px) padding all around</p>
        <p className="text-lg purple-muted mt-4">The text should NOT be against the edges</p>

        <div className="mt-8 p-8 bg-purple-surface rounded-xl">
          <p className="text-lg purple-text">Nested box with 2rem padding</p>
        </div>
      </div>
    </div>
  );
}
