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
  // Protected lines that cannot be edited
  const PROTECTED_HEADER_1 = '<?xml version="1.0" encoding="UTF-8"?>';
  const PROTECTED_HEADER_2 = '<spa xmlns="https://spa.audio/ns" version="1.1">';
  const PROTECTED_FOOTER = '</spa>';

  // Ensure the value always has proper structure with indentation
  const ensureStructure = (code: string, autoIndent: boolean = true): string => {
    const lines = code.split('\n').filter((line, index, arr) => {
      // Remove empty lines at the end (except if it's the only line after content)
      if (index === arr.length - 1 && line === '') return false;
      return true;
    });

    // Ensure we have at least 3 lines (header1, header2, footer)
    while (lines.length < 3) {
      lines.push('');
    }

    // Check if first two lines are correct
    if (lines[0] !== PROTECTED_HEADER_1) {
      lines[0] = PROTECTED_HEADER_1;
    }
    if (lines[1] !== PROTECTED_HEADER_2) {
      lines[1] = PROTECTED_HEADER_2;
    }

    // Find and remove any </spa> that's not at the end
    for (let i = 2; i < lines.length - 1; i++) {
      if (lines[i].trim() === PROTECTED_FOOTER) {
        lines.splice(i, 1);
        i--; // Adjust index after removal
      }
    }

    // Ensure the last line is the closing tag
    if (lines[lines.length - 1] !== PROTECTED_FOOTER) {
      // If the last line has content, add the footer as a new line
      if (lines[lines.length - 1].trim()) {
        lines.push(PROTECTED_FOOTER);
      } else {
        // Replace empty last line with footer
        lines[lines.length - 1] = PROTECTED_FOOTER;
      }
    }

    // Only auto-indent when explicitly requested (not during typing)
    if (autoIndent) {
      // Ensure content lines are indented (lines between header and footer)
      for (let i = 2; i < lines.length - 1; i++) {
        const trimmed = lines[i].trim();
        if (trimmed && !lines[i].startsWith('  ')) {
          lines[i] = '  ' + trimmed;
        } else if (!trimmed) {
          lines[i] = '';
        }
      }
    }

    return lines.join('\n');
  };

  const [code, setCode] = useState(() => ensureStructure(value));
  const [error, setError] = useState<ParseError | null>(null);
  const [lastValidCode, setLastValidCode] = useState(() => ensureStructure(value));
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Update code when value prop changes (from external source)
  useEffect(() => {
    if (!isEditing) {
      const structuredCode = ensureStructure(value);
      setCode(structuredCode);
      setLastValidCode(structuredCode);
      setError(null);
    }
  }, [value, isEditing]);

  // Calculate line numbers
  const lineCount = useMemo(() => {
    return code.split('\n').length;
  }, [code]);

  // Sync scroll between textarea and line numbers
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
    const cursorPosition = e.target.selectionStart;
    const lines = newCode.split('\n');
    const oldLines = code.split('\n');

    // Prevent editing first two lines
    if (lines[0] !== PROTECTED_HEADER_1) {
      lines[0] = PROTECTED_HEADER_1;
    }
    if (lines[1] !== PROTECTED_HEADER_2) {
      lines[1] = PROTECTED_HEADER_2;
    }

    // Prevent removing or editing the last </spa> line
    let hasClosingTag = false;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === PROTECTED_FOOTER) {
        hasClosingTag = true;
        // If it's not the last line, move it there
        if (i !== lines.length - 1) {
          lines.splice(i, 1);
          lines.push(PROTECTED_FOOTER);
        }
        break;
      }
    }

    // If closing tag was removed, add it back
    if (!hasClosingTag) {
      if (lines[lines.length - 1].trim() === '') {
        lines[lines.length - 1] = PROTECTED_FOOTER;
      } else {
        lines.push(PROTECTED_FOOTER);
      }
    }

    const correctedCode = lines.join('\n');
    setCode(correctedCode);
    setIsEditing(true);

    // Restore cursor position after React re-render
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);

    // Debounced validation - don't restructure while typing
    clearTimeout((window as any).codeValidationTimeout);
    (window as any).codeValidationTimeout = setTimeout(() => {
      // Only validate, don't restructure during typing
      validateCode(correctedCode);
      setIsEditing(false);
    }, 1000); // Increased timeout to reduce interruptions
  };

  // Handle paste events to clean up pasted content
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Get current lines
    const lines = code.split('\n');

    // Calculate which line we're on
    let currentLine = 0;
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1;
      if (charCount > start) {
        currentLine = i;
        break;
      }
    }

    // Don't allow paste on protected lines
    if (currentLine === 0 || currentLine === 1 || currentLine === lines.length - 1) {
      return;
    }

    // If pasting a full SPA document, extract just the content
    let contentToPaste = pastedText;
    if (pastedText.includes('<?xml') && pastedText.includes('<spa') && pastedText.includes('</spa>')) {
      const pastedLines = pastedText.split('\n');
      const startIdx = pastedLines.findIndex(line => line.includes('<spa'));
      const endIdx = pastedLines.findIndex(line => line.includes('</spa>'));
      if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
        // Extract content and ensure proper indentation
        contentToPaste = pastedLines
          .slice(startIdx + 1, endIdx)
          .map(line => {
            const trimmed = line.trim();
            return trimmed ? '  ' + trimmed : '';
          })
          .join('\n');
      }
    } else {
      // Ensure pasted content is indented if it's XML content
      if (contentToPaste.includes('<') && !contentToPaste.startsWith('  ')) {
        contentToPaste = contentToPaste
          .split('\n')
          .map(line => {
            const trimmed = line.trim();
            return trimmed ? '  ' + trimmed : '';
          })
          .join('\n');
      }
    }

    // Insert the content
    const beforeSelection = code.substring(0, start);
    const afterSelection = code.substring(end);
    const newCode = beforeSelection + contentToPaste + afterSelection;

    // Apply it through handleCodeChange to ensure protection
    handleCodeChange({ target: { value: newCode } } as any);

    // Set cursor position after pasted content
    setTimeout(() => {
      const newPosition = start + contentToPaste.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;

    // Calculate current line
    const lines = code.split('\n');
    let currentLine = 0;
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1;
      if (charCount > start) {
        currentLine = i;
        break;
      }
    }

    // Prevent certain keys on protected lines
    if (currentLine === 0 || currentLine === 1 || currentLine === lines.length - 1) {
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter') {
        // Allow navigation but not editing
        if (e.key === 'Enter') {
          e.preventDefault();
          // Move cursor to start of line 3 (first editable line)
          const line1Length = lines[0].length + 1;
          const line2Length = lines[1].length + 1;
          textarea.setSelectionRange(line1Length + line2Length, line1Length + line2Length);
        }
        return;
      }
    }

    // Tab handling for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);

      // Create a synthetic event with the new value
      const syntheticEvent = {
        target: {
          value: newCode,
          selectionStart: start + 2,
          selectionEnd: start + 2
        }
      } as React.ChangeEvent<HTMLTextAreaElement>;

      handleCodeChange(syntheticEvent);

      // Set cursor position after tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
      return;
    }

    // Don't prevent Ctrl/Cmd + Z - let browser handle undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      // Let the browser's native undo work
      return;
    }

    // Don't prevent Ctrl/Cmd + Shift + Z (redo)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
      // Let the browser's native redo work
      return;
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
          if (index === 0) return line; // XML declaration
          if (line.includes('<spa')) return line; // Opening spa tag
          if (line.trim() === '</spa>') return line; // Closing spa tag

          // For content lines, add proper indentation
          const trimmed = line.trim();
          if (trimmed) {
            const depth = (trimmed.match(/</g) || []).length - (trimmed.match(/\/>/g) || []).length;
            const indent = '  '.repeat(Math.max(1, depth)); // At least 1 level indent for content
            return indent + trimmed;
          }
          return line;
        })
        .join('\n');

      const structuredFormatted = ensureStructure(formatted);
      setCode(structuredFormatted);
      onChange(structuredFormatted);
    } catch (err) {
      console.error('Failed to format code:', err);
    }
  };

  // Check if a line is protected
  const isProtectedLine = (lineNum: number): boolean => {
    return lineNum === 1 || lineNum === 2 || lineNum === lineCount;
  };

  // Get line styles (for errors and protected lines)
  const getLineStyle = (lineNum: number) => {
    if (error && error.line === lineNum) {
      return 'bg-red-500/20 border-l-2 border-red-500';
    }
    if (isProtectedLine(lineNum)) {
      return 'bg-navy-light/10';
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
        <div className="flex-1 relative overflow-auto">
          {/* Textarea - transparent text but fully functional for selection */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="absolute w-full p-3 bg-transparent font-mono text-sm leading-6 resize-none focus:outline-none"
            style={{
              tabSize: 2,
              fontFamily: "'Roboto Mono', monospace",
              lineHeight: '1.5rem',
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              wordBreak: 'normal',
              color: 'transparent',
              caretColor: 'var(--color-green-bright)',
              zIndex: 1,
              WebkitTextFillColor: 'transparent',
              minHeight: '100%',
              height: 'auto',
              paddingBottom: '24px', // Extra padding for last line
            }}
            placeholder=""
          />

          {/* Text display layer */}
          <div
            className="absolute inset-0 p-3 pointer-events-none font-mono text-sm leading-6"
            style={{
              tabSize: 2,
              fontFamily: "'Roboto Mono', monospace",
              lineHeight: '1.5rem',
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              wordBreak: 'normal',
              zIndex: 2,
              minHeight: `${(lineCount + 1) * 24}px`,
            }}
          >
            {code.split('\n').map((line, lineIndex) => {
              const lineNum = lineIndex + 1;
              const isProtected = isProtectedLine(lineNum);
              return (
                <div
                  key={lineIndex}
                  className={isProtected ? 'text-green' : 'text-green-bright'}
                  style={{
                    backgroundColor: isProtected ? 'rgba(13, 17, 23, 0.2)' : 'transparent',
                    borderLeft: isProtected ? '2px solid var(--color-navy-light)' : 'none',
                    paddingLeft: isProtected ? '10px' : '0',
                    marginLeft: isProtected ? '-10px' : '0',
                  }}
                >
                  {line || '\u00A0'}
                </div>
              );
            })}
          </div>

          {/* Error underline overlay */}
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