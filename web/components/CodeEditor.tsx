import { useState, useEffect, useRef, useMemo } from 'react';
import { parseSPA } from '@spa-audio/core';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean) => void;
  className?: string;
}

interface ParseError {
  line: number;
  column: number;
  message: string;
}

export default function CodeEditor({ value, onChange, onValidChange, className = '' }: CodeEditorProps) {
  const [code, setCode] = useState(value);
  const [error, setError] = useState<ParseError | null>(null);
  const [lastValidCode, setLastValidCode] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Protected lines that cannot be edited
  const PROTECTED_HEADER = `<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.1">`;
  const PROTECTED_FOOTER = `</spa>`;

  // Update code when value prop changes (from external source)
  useEffect(() => {
    if (!isEditing) {
      setCode(value);
      setLastValidCode(value);
      setError(null);
    }
  }, [value, isEditing]);

  // Calculate line numbers
  const lineCount = useMemo(() => {
    return code.split('\n').length;
  }, [code]);

  // Sync scroll between textarea and line numbers (both vertical and horizontal)
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Validate and parse the XML
  const validateCode = (newCode: string) => {
    try {
      // First try to parse as XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(newCode, 'text/xml');

      // Check for XML parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        const errorText = parserError.textContent || 'Invalid XML';
        // Try to extract line and column from error message
        const lineMatch = errorText.match(/line\s+(\d+)/i);
        const colMatch = errorText.match(/column\s+(\d+)/i);

        setError({
          line: lineMatch ? parseInt(lineMatch[1]) : 1,
          column: colMatch ? parseInt(colMatch[1]) : 1,
          message: errorText.split('\n')[0] || 'Invalid XML format',
        });
        onValidChange?.(false);
        return false;
      }

      // Now validate with SPA parser
      parseSPA(newCode);

      // If we get here, the code is valid
      setError(null);
      setLastValidCode(newCode);
      onChange(newCode);
      onValidChange?.(true);
      return true;
    } catch (err: any) {
      // Extract line information from error if possible
      let line = 1;
      let column = 1;
      const message = err.message || 'Invalid SPA format';

      // Try to parse error message for line information
      const lineMatch = message.match(/line\s+(\d+)/i);
      const colMatch = message.match(/column\s+(\d+)/i);

      if (lineMatch) line = parseInt(lineMatch[1]);
      if (colMatch) column = parseInt(colMatch[1]);

      setError({ line, column, message });
      onValidChange?.(false);
      return false;
    }
  };


  // Handle code changes
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;

    // Check if user is trying to edit protected areas
    const lines = newCode.split('\n');
    const currentLines = code.split('\n');

    // Check if header was modified
    if (lines[0] !== currentLines[0] || lines[1] !== currentLines[1]) {
      // Restore header
      lines[0] = currentLines[0];
      lines[1] = currentLines[1];
      const restoredCode = lines.join('\n');
      setCode(restoredCode);

      // Move cursor to first editable line
      setTimeout(() => {
        if (textareaRef.current) {
          const headerLength = PROTECTED_HEADER.length + 1;
          textareaRef.current.setSelectionRange(headerLength, headerLength);
        }
      }, 0);
      return;
    }

    // Check if footer was modified - find the line with </spa>
    let currentSpaLineIndex = -1;
    for (let i = currentLines.length - 1; i >= 0; i--) {
      // Use regex to match </spa> with any whitespace
      if (currentLines[i].match(/^\s*<\/spa>\s*$/)) {
        currentSpaLineIndex = i;
        break;
      }
    }

    // If we found the </spa> line and it was modified
    if (currentSpaLineIndex !== -1 && lines[currentSpaLineIndex] !== undefined) {
      // Check if the </spa> line was changed or removed
      if (!lines[currentSpaLineIndex].match(/^\s*<\/spa>\s*$/)) {
        // Restore the </spa> line
        lines[currentSpaLineIndex] = currentLines[currentSpaLineIndex];
        const restoredCode = lines.join('\n');
        setCode(restoredCode);
        return;
      }
    }

    setCode(newCode);
    setIsEditing(true);

    // Debounced validation
    clearTimeout((window as any).codeValidationTimeout);
    (window as any).codeValidationTimeout = setTimeout(() => {
      validateCode(newCode);
      setIsEditing(false);
    }, 500);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const lines = code.split('\n');

    // Calculate current line number
    let currentLine = 1;
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1; // +1 for newline
      if (charCount > start) {
        currentLine = i + 1;
        break;
      }
    }

    // Prevent editing protected lines with backspace/delete
    if ((e.key === 'Backspace' || e.key === 'Delete') && isProtectedLine(currentLine)) {
      e.preventDefault();
      return;
    }

    // Tab handling for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!isProtectedLine(currentLine)) {
        const end = textarea.selectionEnd;
        const newCode = code.substring(0, start) + '  ' + code.substring(end);
        setCode(newCode);

        // Set cursor position after tab
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
          }
        }, 0);
      }
    }

    // Ctrl/Cmd + Z for undo (revert to last valid)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && error) {
      e.preventDefault();
      handleReset();
    }

    // Ctrl/Cmd + Enter to format (if valid)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !error) {
      e.preventDefault();
      formatCode();
    }
  };

  // Reset to last valid code
  const handleReset = () => {
    setCode(lastValidCode);
    setError(null);
    onValidChange?.(true);
  };

  // Format the XML code
  const formatCode = () => {
    if (error) return;

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(code, 'text/xml');
      const serializer = new XMLSerializer();
      let formatted = serializer.serializeToString(xmlDoc);

      // Basic formatting - add newlines and indentation
      formatted = formatted
        .replace(/></g, '>\n<')
        .split('\n')
        .map((line, index) => {
          const depth = (line.match(/</g) || []).length - (line.match(/\/>/g) || []).length;
          const indent = '  '.repeat(Math.max(0, depth - 1));
          return index === 0 ? line : indent + line;
        })
        .join('\n');

      setCode(formatted);
      onChange(formatted);
    } catch (err) {
      console.error('Failed to format code:', err);
    }
  };

  // Check if a line is protected
  const isProtectedLine = (lineNum: number): boolean => {
    const lines = code.split('\n');

    // First line should be XML declaration
    if (lineNum === 1) {
      return true; // XML declaration
    }

    // Second line should be opening spa tag
    if (lineNum === 2) {
      return true; // Opening <spa> tag
    }

    // Check if this specific line contains the closing spa tag
    // We need to be very precise here - only the line with </spa> should be protected
    const lineIndex = lineNum - 1; // Convert to 0-based index
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      // Only protect the line if it contains ONLY the closing spa tag (with optional whitespace)
      if (line.match(/^\s*<\/spa>\s*$/)) {
        return true;
      }
    }

    return false;
  };

  // Get line styles (for errors and protected lines)
  const getLineStyle = (lineNum: number) => {
    if (error && error.line === lineNum) {
      return 'bg-red-500/20 border-l-2 border-red-500';
    }
    if (isProtectedLine(lineNum)) {
      return 'bg-navy-light/20 text-gray-500';
    }
    return '';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 mb-2 rounded flex items-start justify-between">
          <div className="flex-1">
            <div className="font-semibold text-sm">XML Error on line {error.line}</div>
            <div className="text-xs mt-1 font-mono">{error.message}</div>
          </div>
          <button
            onClick={handleReset}
            className="ml-4 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs font-medium transition-colors"
          >
            Reset to Last Valid
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-navy-dark border-b border-navy-light/20">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {error ? (
              <span className="text-red-400">✗ Invalid XML</span>
            ) : (
              <span className="text-green">✓ Valid SPA</span>
            )}
          </span>
          <span className="text-xs text-gray-600">|</span>
          <span className="text-xs text-gray-500">{lineCount} lines</span>
          <span className="text-xs text-gray-600">|</span>
          <span className="text-xs text-gray-400">🔒 Header & footer protected</span>
        </div>
        <div className="flex gap-2">
          {error && (
            <button
              onClick={handleReset}
              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs transition-colors"
            >
              Undo Changes
            </button>
          )}
          {!error && (
            <button
              onClick={formatCode}
              className="px-2 py-1 bg-navy-light/20 hover:bg-navy-light/30 rounded text-xs transition-colors"
              title="Format XML (Ctrl+Enter)"
            >
              Format
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden bg-grey font-mono text-sm">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="select-none px-3 py-3 text-right border-r border-navy-light/20 overflow-hidden"
          style={{ minWidth: '4.5rem' }}
        >
          {Array.from({ length: lineCount }, (_, i) => i + 1).map((lineNum) => {
            const isProtected = isProtectedLine(lineNum);
            return (
              <div
                key={lineNum}
                className={`leading-6 flex items-center justify-end gap-1 ${
                  isProtected ? 'text-gray-500' : 'text-gray-600'
                } ${getLineStyle(lineNum)}`}
                style={{ paddingRight: getLineStyle(lineNum) ? '6px' : '0' }}
              >
                {isProtected && (
                  <span className="text-gray-500" title="Protected line">
                    🔒
                  </span>
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Code Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Protected lines overlay */}
          <div className="absolute inset-0 pointer-events-none p-3 overflow-hidden">
            {code.split('\n').map((line, lineIndex) => {
              const lineNum = lineIndex + 1;
              if (isProtectedLine(lineNum)) {
                return (
                  <div
                    key={lineIndex}
                    className="bg-navy-light/10 border-l-2 border-navy-light/30"
                    style={{
                      position: 'absolute',
                      top: `${lineIndex * 24}px`, // Use px instead of rem for consistency
                      height: '24px', // Match line-height exactly
                      left: 0,
                      right: 0,
                      paddingLeft: '12px',
                      minWidth: `${Math.max(100, line.length * 8)}px`, // Extend overlay for long lines
                    }}
                  />
                );
              }
              return null;
            })}
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className={`absolute inset-0 w-full h-full p-3 bg-transparent text-green-bright font-mono text-sm leading-6 resize-none focus:outline-none overflow-x-auto ${
              error ? 'text-red-400' : ''
            }`}
            style={{
              tabSize: 2,
              fontFamily: "'Roboto Mono', monospace",
              lineHeight: '1.5rem',
              zIndex: 1,
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              wordBreak: 'normal',
            }}
            placeholder="<!-- Enter your SPA XML code here -->"
          />

          {/* Error underline overlay (if we can determine position) */}
          {error && (
            <div className="absolute inset-0 pointer-events-none p-3">
              {code.split('\n').map((line, lineIndex) => {
                if (lineIndex + 1 === error.line) {
                  return (
                    <div
                      key={lineIndex}
                      className="relative"
                      style={{ top: `${lineIndex * 1.5}rem` }}
                    >
                      <div
                        className="absolute border-b-2 border-red-500 border-dotted"
                        style={{
                          left: `${error.column - 1}ch`,
                          width: `${Math.max(10, line.length - error.column + 1)}ch`,
                          bottom: '-2px',
                        }}
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-navy-dark border-t border-navy-light/20 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-gray-500">
            Ln {error ? error.line : lineCount}, Col {error ? error.column : 1}
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-500">XML</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <span>Ctrl+Z: Undo</span>
          <span>|</span>
          <span>Ctrl+Enter: Format</span>
        </div>
      </div>
    </div>
  );
}