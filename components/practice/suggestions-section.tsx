// components/practice/suggestions-section.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PracticeSuggestion } from '@/types';
import { 
  Sparkles, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  Code,
  Dumbbell,
  Trophy,
  BookOpen,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface SuggestionsSectionProps {
  completedVideosCount: number;
}

const typeConfig = {
  project: { icon: Code, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  exercise: { icon: Dumbbell, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  challenge: { icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  review: { icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

const difficultyConfig = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export function SuggestionsSection({ completedVideosCount }: SuggestionsSectionProps) {
  const [suggestions, setSuggestions] = useState<PracticeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateSuggestions = async () => {
    if (completedVideosCount < 3) {
      toast.error('Complete at least 3 videos to get AI suggestions');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/practice/suggestions', {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuggestions(data.suggestions || []);
      setHasGenerated(true);
      toast.success('Practice suggestions generated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Not generated yet - show prompt
  if (!hasGenerated) {
    return (
      <Card className="border-dashed border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/30 dark:to-blue-950/30">
        <CardContent className="py-8 text-center">
          <Sparkles className="h-12 w-12 text-purple-400 dark:text-purple-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-foreground">AI Practice Suggestions</h3>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            Get personalized practice projects, exercises, and challenges based on the videos you&apos;ve completed.
          </p>
          <Button
            onClick={generateSuggestions}
            disabled={loading || completedVideosCount < 3}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Suggestions
              </>
            )}
          </Button>
          {completedVideosCount < 3 && (
            <p className="text-xs text-muted-foreground mt-3">
              Complete at least 3 videos to unlock AI suggestions
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border-purple-200 dark:border-purple-800">
        <CardContent className="py-8 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground">Generating Practice Suggestions...</h3>
          <p className="text-sm text-muted-foreground mt-1">
            AI is analyzing your completed videos
          </p>
        </CardContent>
      </Card>
    );
  }

  // No suggestions
  if (suggestions.length === 0) {
    return (
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No suggestions available</p>
          <Button
            variant="outline"
            onClick={generateSuggestions}
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show suggestions
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border-b border-purple-100 dark:border-purple-900">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Practice Suggestions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateSuggestions}
            disabled={loading}
            className="text-xs"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                Regenerate
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            isExpanded={expanded === suggestion.id}
            onToggle={() => setExpanded(expanded === suggestion.id ? null : suggestion.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// Individual Suggestion Card
interface SuggestionCardProps {
  suggestion: PracticeSuggestion;
  isExpanded: boolean;
  onToggle: () => void;
}

function SuggestionCard({ suggestion, isExpanded, onToggle }: SuggestionCardProps) {
  const typeInfo = typeConfig[suggestion.type] || typeConfig.exercise;
  const TypeIcon = typeInfo.icon;
  const difficultyClass = difficultyConfig[suggestion.difficulty] || difficultyConfig.beginner;

  return (
    <div className="border rounded-lg overflow-hidden bg-card dark:bg-gray-900/50 hover:shadow-md transition-shadow">
      {/* Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
            <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm text-foreground">{suggestion.title}</h4>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {suggestion.description}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className={`text-xs ${difficultyClass}`}>
                {suggestion.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {suggestion.estimatedTime}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {suggestion.type}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
          {/* Skills */}
          {suggestion.skills && suggestion.skills.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Skills You&apos;ll Practice
              </h5>
              <div className="flex flex-wrap gap-1">
                {suggestion.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {suggestion.steps && suggestion.steps.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Steps to Complete
              </h5>
              <ol className="space-y-2">
                {suggestion.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Tips */}
          {suggestion.tips && suggestion.tips.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Tips
              </h5>
              <ul className="space-y-1">
                {suggestion.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-yellow-500">💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expected Outcome */}
          {suggestion.expectedOutcome && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
              <h5 className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase mb-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Expected Outcome
              </h5>
              <p className="text-sm text-green-800 dark:text-green-200">
                {suggestion.expectedOutcome}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}