// components/shared/takeaway-renderer.tsx

'use client';

import { Badge } from '@/components/ui/badge';
import { EnhancedTakeaways } from '@/types';
import {
  Lightbulb,
  Code,
  Table,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';

interface TakeawayRendererProps {
  takeaways: EnhancedTakeaways | null | undefined;
  compact?: boolean;
}

export function TakeawayRenderer({ takeaways, compact = false }: TakeawayRendererProps) {
  // Safety check - return nothing if takeaways is null/undefined
  if (!takeaways) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>No takeaways available</p>
      </div>
    );
  }

  // Compact mode - just show short summary
  if (compact) {
    return (
      <div className="text-sm text-muted-foreground">
        {takeaways.shortSummary || takeaways.summary?.slice(0, 150) || 'No summary available'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {takeaways.summary && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Summary</h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                {takeaways.summary}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {takeaways.difficulty && (
              <Badge variant="outline" className="text-xs">
                {takeaways.difficulty}
              </Badge>
            )}
            {takeaways.estimatedPracticeTime && (
              <Badge variant="outline" className="text-xs">
                ⏱️ {takeaways.estimatedPracticeTime}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Key Points */}
      {takeaways.keyPoints && takeaways.keyPoints.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Key Points
          </h4>
          <ul className="space-y-2">
            {takeaways.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-green-500 mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Concepts Explained */}
      {takeaways.conceptsExplained && takeaways.conceptsExplained.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-blue-500" />
            Concepts Explained
          </h4>
          <div className="space-y-3">
            {takeaways.conceptsExplained.map((concept, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <h5 className="font-medium text-sm mb-1">{concept.concept}</h5>
                <p className="text-sm text-muted-foreground">{concept.explanation}</p>
                {concept.example && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    💡 Example: {concept.example}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables */}
      {takeaways.tables && takeaways.tables.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Table className="h-4 w-4 text-purple-500" />
            Quick Reference
          </h4>
          {takeaways.tables.map((table, i) => (
            <div key={i} className="mb-4">
              <h5 className="font-medium text-sm mb-2">{table.title}</h5>
              {table.description && (
                <p className="text-xs text-muted-foreground mb-2">{table.description}</p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      {table.headers?.map((header, j) => (
                        <th key={j} className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows?.map((row, j) => (
                      <tr key={j} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        {row.map((cell, k) => (
                          <td key={k} className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparisons */}
      {takeaways.comparisons && takeaways.comparisons.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            ⚖️ Comparisons
          </h4>
          {takeaways.comparisons.map((comparison, i) => (
            <div key={i} className="mb-4">
              <h5 className="font-medium text-sm mb-3">{comparison.title}</h5>
              <div className="grid gap-3 md:grid-cols-2">
                {comparison.items?.map((item, j) => (
                  <div key={j} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <h6 className="font-medium text-sm mb-2">{item.name}</h6>
                    <div className="space-y-2">
                      {item.pros && item.pros.length > 0 && (
                        <div>
                          <span className="text-xs text-green-600 font-medium">Pros:</span>
                          <ul className="text-xs text-muted-foreground">
                            {item.pros.map((pro, k) => (
                              <li key={k}>+ {pro}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.cons && item.cons.length > 0 && (
                        <div>
                          <span className="text-xs text-red-600 font-medium">Cons:</span>
                          <ul className="text-xs text-muted-foreground">
                            {item.cons.map((con, k) => (
                              <li key={k}>- {con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.useCase && (
                        <p className="text-xs">
                          <span className="font-medium">Best for:</span> {item.useCase}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Code Snippets */}
      {takeaways.codeSnippets && takeaways.codeSnippets.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Code className="h-4 w-4 text-orange-500" />
            Code Examples
          </h4>
          {takeaways.codeSnippets.map((snippet, i) => (
            <CodeSnippetBlock key={i} snippet={snippet} />
          ))}
        </div>
      )}

      {/* Warnings */}
      {takeaways.warnings && takeaways.warnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 border border-amber-200 dark:border-amber-900">
          <h4 className="font-semibold flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            Watch Out For
          </h4>
          <ul className="space-y-1">
            {takeaways.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <span>⚠️</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips */}
      {takeaways.tips && takeaways.tips.length > 0 && (
        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-900">
          <h4 className="font-semibold flex items-center gap-2 mb-2 text-green-800 dark:text-green-200">
            <Lightbulb className="h-4 w-4" />
            Pro Tips
          </h4>
          <ul className="space-y-1">
            {takeaways.tips.map((tip, i) => (
              <li key={i} className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                <span>💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Practice Ideas */}
      {takeaways.practiceIdeas && takeaways.practiceIdeas.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            🎯 Practice Ideas
          </h4>
          <div className="grid gap-2">
            {takeaways.practiceIdeas.map((idea, i) => (
              <div key={i} className="flex items-start gap-2 text-sm bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <span className="text-blue-500 font-bold">{i + 1}.</span>
                <span>{idea}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {takeaways.nextSteps && takeaways.nextSteps.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <ArrowRight className="h-4 w-4 text-indigo-500" />
            Next Steps
          </h4>
          <ul className="space-y-2">
            {takeaways.nextSteps.map((step, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-indigo-500">→</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resources */}
      {takeaways.resources && takeaways.resources.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <ExternalLink className="h-4 w-4 text-cyan-500" />
            Resources
          </h4>
          <div className="flex flex-wrap gap-2">
            {takeaways.resources.map((resource, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {resource.type === 'documentation' && '📚'}
                {resource.type === 'article' && '📄'}
                {resource.type === 'video' && '🎬'}
                {resource.type === 'github' && '💻'}
                {resource.type === 'other' && '🔗'}
                {' '}{resource.title}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Prerequisites (if any) */}
      {takeaways.prerequisites && takeaways.prerequisites.length > 0 && (
        <div className="text-xs text-muted-foreground border-t pt-4">
          <span className="font-medium">Prerequisites: </span>
          {takeaways.prerequisites.join(' • ')}
        </div>
      )}
    </div>
  );
}

// Separate component for code snippets with copy functionality
function CodeSnippetBlock({ snippet }: { snippet: { language: string; code: string; explanation: string; title?: string } }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="mb-4">
      {snippet.title && (
        <h5 className="font-medium text-sm mb-2">{snippet.title}</h5>
      )}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="px-3 py-1.5 bg-gray-800 text-gray-400 text-xs flex items-center justify-between">
          <span>{snippet.language || 'code'}</span>
          <button
            className="flex items-center gap-1 hover:text-white transition-colors"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="p-3 text-gray-100 text-xs sm:text-sm overflow-x-auto scrollbar-thin">
          <code>{snippet.code}</code>
        </pre>
      </div>
      {snippet.explanation && (
        <p className="text-xs text-muted-foreground mt-2 px-1">
          {snippet.explanation}
        </p>
      )}
    </div>
  );
}