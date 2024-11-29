import { useRef, useState } from 'react';
import Editor from "@monaco-editor/react";
import type { editor } from 'monaco-editor';
import { ArrowUp, Copy, Download, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
}

interface ValidationError {
  message: string;
  line: number;
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isErrorExpanded, setIsErrorExpanded] = useState(false);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    validateHTML(code);
  };

  const validateHTML = (html: string) => {
    const errors: ValidationError[] = [];
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Check for parsing errors
      const parserErrors = Array.from(doc.querySelectorAll('parsererror'));
      if (parserErrors.length > 0) {
        errors.push({
          message: 'Invalid HTML structure',
          line: 1,
        });
        return;
      }

      // More lenient tag validation
      const lines = html.split('\n');
      const stack: { tag: string; line: number }[] = [];
      let inScript = false;
      let inStyle = false;

      lines.forEach((line, lineIndex) => {
        const lineNum = lineIndex + 1;
        const tagMatches = [...line.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)(?: [^>]*?)?(?:\/)?>/g)];
        
        for (const match of tagMatches) {
          const [fullTag, tagName] = match;
          const lowerTagName = tagName.toLowerCase();

          // Skip validation for self-closing tags
          if (fullTag.endsWith('/>') || ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(lowerTagName)) {
            continue;
          }

          // Handle script and style tags specially
          if (lowerTagName === 'script') inScript = !fullTag.startsWith('</');
          if (lowerTagName === 'style') inStyle = !fullTag.startsWith('</');
          if (inScript || inStyle) continue;

          if (!fullTag.startsWith('</')) {
            stack.push({ tag: lowerTagName, line: lineNum });
          } else {
            const lastTag = stack.pop();
            if (!lastTag) {
              errors.push({
                message: `Unexpected closing tag: </${tagName}>`,
                line: lineNum,
              });
            } else if (lastTag.tag !== lowerTagName) {
              errors.push({
                message: `Mismatched tag: expected </${lastTag.tag}>, found </${tagName}>`,
                line: lineNum,
              });
              // Put the tag back since it wasn't matched
              stack.push(lastTag);
            }
          }
        }
      });

      // Only report unclosed tags if they're not part of the main structure
      const unclosedTags = stack.filter(({ tag }) => !['html', 'head', 'body'].includes(tag));
      unclosedTags.forEach(({ tag, line }) => {
        errors.push({
          message: `Unclosed tag: <${tag}>`,
          line,
        });
      });
    } catch (err) {
      errors.push({
        message: 'Failed to parse HTML',
        line: 1,
      });
    }

    setErrors(errors);

    // Update editor markers
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelMarkers(model, 'html-validator', errors.map(error => ({
          severity: monaco.MarkerSeverity.Error,
          message: error.message,
          startLineNumber: error.line,
          startColumn: 1,
          endLineNumber: error.line,
          endColumn: 1000,
        })));
      }
    }
  };

  const scrollToTop = () => {
    editorRef.current?.setPosition({ lineNumber: 1, column: 1 });
    editorRef.current?.revealPosition({ lineNumber: 1, column: 1 });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadAsTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'email-template.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="relative h-full">
      <div className="absolute top-0 right-0 z-10 flex items-center gap-2 p-2 bg-gray-800 rounded-bl-lg">
        <button
          onClick={copyToClipboard}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          title={copySuccess ? 'Copied!' : 'Copy to clipboard'}
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={downloadAsTxt}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          title="Download as .txt"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {errors.length > 0 && (
        <div 
          className={`fixed bottom-4 left-4 z-10 bg-red-50 border border-red-200 rounded-lg shadow-lg transition-all duration-200 ${
            isErrorExpanded ? 'w-96' : 'w-48'
          }`}
        >
          <button
            onClick={() => setIsErrorExpanded(!isErrorExpanded)}
            className="w-full p-2 flex items-center justify-between text-red-800 hover:bg-red-100/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm font-medium">
                {errors.length} {errors.length === 1 ? 'Error' : 'Errors'}
              </span>
            </div>
            {isErrorExpanded ? (
              <ChevronDown className="h-4 w-4 text-red-500" />
            ) : (
              <ChevronUp className="h-4 w-4 text-red-500" />
            )}
          </button>
          {isErrorExpanded && (
            <div className="p-3 border-t border-red-200">
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="font-medium mr-2">Line {error.line}:</span>
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Editor
        height="100%"
        defaultLanguage="html"
        value={code}
        onChange={(value) => {
          onChange(value ?? '');
          validateHTML(value ?? '');
        }}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          lineNumbers: 'on',
          folding: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderValidationDecorations: 'on',
        }}
      />

      <button
        onClick={scrollToTop}
        className="absolute bottom-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full shadow-lg transition-colors"
        title="Scroll to top"
      >
        <ArrowUp className="h-4 w-4" />
      </button>

      {copySuccess && (
        <div className="absolute top-12 right-4 bg-gray-800 text-white px-3 py-1 rounded-md text-sm">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}