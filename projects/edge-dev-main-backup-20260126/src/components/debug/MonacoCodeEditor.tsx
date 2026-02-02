'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Save, Play, Code, X, Maximize2, Minimize2, Check } from 'lucide-react';

declare global {
  interface Window {
    monaco?: any;
  }
}

interface MonacoCodeEditorProps {
  code: string;
  filename: string;
  readOnly?: boolean;
  onSave?: (code: string) => void;
  onExecute?: (code: string) => void;
  onClose?: () => void;
  height?: string;
  highlightedLine?: number;
  className?: string;
}

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  code,
  filename,
  readOnly = false,
  onSave,
  onExecute,
  onClose,
  height = '600px',
  highlightedLine,
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<any>(null);
  const [monaco, setMonaco] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load Monaco Editor
  useEffect(() => {
    const loadMonaco = async () => {
      if (typeof window !== 'undefined') {
        const monaco = await import('@monaco-editor/react');
        setMonaco(monaco);
      }
    };
    loadMonaco();
  }, []);

  // Initialize editor
  useEffect(() => {
    if (!monaco || !editorRef.current || editor) return;

    const initMonaco = async () => {
      const Monaco = await import('monaco-editor');
      const monacoInstance = await Monaco.default;

      const editorInstance = monacoInstance.editor.create(editorRef.current!, {
        value: code,
        language: 'python',
        theme: 'vs-dark',
        readOnly: readOnly,
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        glyphMargin: true,
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
        renderWhitespace: 'selection',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          useShadows: true,
          verticalScrollbarSize: 12,
          horizontalScrollbarSize: 12
        },
        contextmenu: true,
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
        }
      });

      setEditor(editorInstance);

      // Track changes
      editorInstance.onDidChangeModelContent(() => {
        setHasChanges(true);
      });

      // Highlight error line if specified
      if (highlightedLine) {
        monacoInstance.editor.setModelMarkers(
          editorInstance.getModel()!,
          'python',
          [
            {
              severity: monacoInstance.MarkerSeverity.Error,
              message: 'Error occurred here',
              startLineNumber: highlightedLine,
              startColumn: 1,
              endLineNumber: highlightedLine,
              endColumn: 1000
            }
          ]
        );

        // Decorate the line
        editorInstance.deltaDecorations(
          [],
          [
            {
              range: new Monaco.Range(highlightedLine, 1, highlightedLine, 1),
              options: {
                isWholeLine: true,
                className: 'highlighted-error-line',
                glyphMarginClassName: 'error-glyph'
              }
            }
          ]
        );
      }
    };

    initMonaco();

    return () => {
      if (editor) {
        editor.dispose();
      }
    };
  }, [monaco, editorRef]);

  // Update code when prop changes
  useEffect(() => {
    if (editor && code !== editor.getValue()) {
      editor.setValue(code);
      setHasChanges(false);
    }
  }, [code, editor]);

  // Update highlighted line
  useEffect(() => {
    if (!editor || !monaco || !highlightedLine) return;

    const Monaco = monaco.default || window.monaco;
    if (!Monaco) return;

    // Clear previous decorations
    editor.deltaDecorations([], []);

    // Add new decoration
    editor.deltaDecorations(
      [],
      [
        {
          range: new Monaco.Range(highlightedLine, 1, highlightedLine, 1),
          options: {
            isWholeLine: true,
            className: 'highlighted-error-line',
            glyphMarginClassName: 'error-glyph',
            glyphMarginHoverMessage: { value: 'Error occurred on this line' }
          }
        }
      ]
    );
  }, [highlightedLine, editor, monaco]);

  const handleSave = async () => {
    if (!editor || !onSave) return;

    setSaveStatus('saving');
    const updatedCode = editor.getValue();
    await onSave(updatedCode);
    setHasChanges(false);

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleExecute = () => {
    if (!editor || !onExecute) return;
    const updatedCode = editor.getValue();
    onExecute(updatedCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S / Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }

    // Ctrl+Enter / Cmd+Enter to execute
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }

    // Esc to close
    if (e.key === 'Escape' && onClose) {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className={`bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-50' : ''
      } ${className}`}
      style={{ height: isFullscreen ? 'calc(100vh - 2rem)' : height }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Toolbar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-mono text-gray-300">{filename}</span>
          {hasChanges && (
            <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">Modified</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && onSave && (
            <button
              onClick={handleSave}
              disabled={!hasChanges || saveStatus === 'saving'}
              className="px-3 py-1 text-sm bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded flex items-center gap-1 transition-colors"
            >
              {saveStatus === 'saving' ? (
                <>Saving...</>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-3 h-3" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  Save
                </>
              )}
            </button>
          )}

          {onExecute && (
            <button
              onClick={handleExecute}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1 transition-colors"
            >
              <Play className="w-3 h-3" />
              Execute (Ctrl+Enter)
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="relative" style={{ height: 'calc(100% - 48px)' }}>
        <div ref={editorRef} className="absolute inset-0" />
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .highlighted-error-line {
          background-color: rgba(255, 0, 0, 0.15) !important;
        }
        .error-glyph {
          background-color: #ff0000;
          width: 3px !important;
        }
      `}</style>
    </div>
  );
};

export default MonacoCodeEditor;
