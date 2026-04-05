// lib/openai.ts

import OpenAI from 'openai';
import { EnhancedTakeaways, PracticeSuggestion } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// CARD TAKEAWAY - Meaningful short summary for video card
// 4-5 lines with key insights
// ============================================

export interface CardTakeaway {
  headline: string;        // One powerful line (main learning)
  keyInsights: string[];   // 2-3 bullet points of key insights
  quickTip?: string;       // Optional pro tip
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export async function generateCardTakeaway(
  videoTitle: string,
  description: string,
  category: string
): Promise<CardTakeaway | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert programming instructor who creates concise but highly valuable learning summaries. 
You extract the MOST important, actionable knowledge from educational content.
Always respond with valid JSON only.`,
        },
        {
          role: 'user',
          content: `Analyze this programming video and create a CONCISE but VALUABLE takeaway summary for display on a video card.

Video Title: ${videoTitle}
Category: ${category}
Description: ${description.slice(0, 1000)}

Create a JSON response with this structure:
{
  "headline": "One powerful sentence capturing THE most important concept/skill taught (max 100 chars)",
  "keyInsights": [
    "First key insight or learning point (specific & actionable)",
    "Second key insight or technique learned",
    "Third key insight (if applicable)"
  ],
  "quickTip": "One practical pro tip or 'remember this' point (optional)",
  "difficulty": "beginner|intermediate|advanced"
}

IMPORTANT GUIDELINES:
1. headline: Should be THE main takeaway - what's the ONE thing to remember?
2. keyInsights: 2-3 specific, actionable points (not generic). Be technical but clear.
3. quickTip: A practical tip, common mistake to avoid, or best practice
4. Make it valuable enough that someone could learn something just from reading this
5. Be SPECIFIC to the video content, avoid generic statements
6. Each insight should teach something concrete

Examples of GOOD insights:
- "Use useMemo() for expensive calculations, useCallback() for function references"
- "Always handle loading, error, and empty states in async components"
- "Prisma relations require explicit include/select for nested data"

Examples of BAD insights (too generic):
- "React is useful for building UIs"
- "Always write clean code"
- "Testing is important"`,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    return {
      headline: parsed.headline || '',
      keyInsights: parsed.keyInsights || [],
      quickTip: parsed.quickTip || null,
      difficulty: parsed.difficulty || 'beginner',
    };
  } catch (error) {
    console.error('Error generating card takeaway:', error);
    return null;
  }
}

// ============================================
// DETAILED TAKEAWAYS - For Video Modal Display
// ============================================
export async function generateEnhancedTakeaways(
  videoTitle: string,
  description: string,
  playlistCategory: string
): Promise<EnhancedTakeaways | null> {
  try {
    const prompt = `You are an expert programming instructor. Analyze this educational video and provide comprehensive, structured learning takeaways.

Video Title: ${videoTitle}
Category: ${playlistCategory}
Description: ${description.slice(0, 2000)}

Provide a detailed JSON response. IMPORTANT: Dynamically include sections based on the content:
- Include "tables" for comparisons, feature lists, or structured data
- Include "codeSnippets" when code examples are relevant
- Include "comparisons" when comparing technologies, methods, or approaches
- Include "conceptsExplained" for theoretical content
- Include "warnings" for common pitfalls or mistakes
- Include "tips" for best practices

JSON Structure:
{
  "summary": "A comprehensive 3-4 sentence summary of what this video teaches",
  "shortSummary": "A 1-2 sentence key takeaway (max 120 chars)",
  "keyPoints": ["Specific actionable point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "codeSnippets": [
    {
      "title": "Example Title",
      "language": "javascript",
      "code": "// Complete working code example\\nconst example = 'code';",
      "explanation": "Step-by-step explanation of the code"
    }
  ],
  "tables": [
    {
      "title": "Comparison Table Title",
      "headers": ["Feature", "Option A", "Option B"],
      "rows": [
        ["Feature 1", "Value A1", "Value B1"],
        ["Feature 2", "Value A2", "Value B2"]
      ],
      "description": "Brief description of what this table shows"
    }
  ],
  "comparisons": [
    {
      "title": "Technology Comparison",
      "items": [
        {
          "name": "Option A",
          "pros": ["Pro 1", "Pro 2"],
          "cons": ["Con 1"],
          "useCase": "Best used when..."
        }
      ]
    }
  ],
  "conceptsExplained": [
    {
      "concept": "Concept Name",
      "explanation": "Clear explanation in simple terms",
      "example": "Real-world example or analogy"
    }
  ],
  "practiceIdeas": ["Hands-on exercise 1", "Mini project idea", "Challenge"],
  "prerequisites": ["Required knowledge 1", "Required knowledge 2"],
  "nextSteps": ["What to learn next 1", "Advanced topic to explore"],
  "difficulty": "beginner|intermediate|advanced",
  "estimatedPracticeTime": "30 minutes - 1 hour",
  "warnings": ["Common mistake to avoid", "Pitfall to be aware of"],
  "tips": ["Pro tip 1", "Best practice suggestion"],
  "resources": [
    {
      "title": "Official Documentation",
      "type": "documentation"
    }
  ]
}

IMPORTANT GUIDELINES:
1. Only include sections that are relevant to the video content
2. Code snippets must be complete and runnable when possible
3. Tables should be used for comparisons, features, or any structured data
4. Be specific to the actual content, not generic advice
5. Include practical examples wherever possible`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert programming instructor who creates detailed, structured learning materials. Always respond with valid JSON only. Include tables and comparisons when relevant to the content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    return {
      summary: parsed.summary || '',
      shortSummary: parsed.shortSummary || parsed.summary?.slice(0, 120) || '',
      keyPoints: parsed.keyPoints || [],
      codeSnippets: parsed.codeSnippets || [],
      tables: parsed.tables || [],
      comparisons: parsed.comparisons || [],
      conceptsExplained: parsed.conceptsExplained || [],
      practiceIdeas: parsed.practiceIdeas || [],
      prerequisites: parsed.prerequisites || [],
      nextSteps: parsed.nextSteps || [],
      difficulty: parsed.difficulty || 'beginner',
      estimatedPracticeTime: parsed.estimatedPracticeTime || '30 minutes',
      warnings: parsed.warnings || [],
      tips: parsed.tips || [],
      resources: parsed.resources || [],
    };
  } catch (error) {
    console.error('Error generating enhanced takeaways:', error);
    return null;
  }
}

// ============================================
// PRACTICE SUGGESTIONS
// ============================================
export async function generatePracticeSuggestions(
  completedVideos: { title: string; description: string; category: string }[]
): Promise<PracticeSuggestion[]> {
  try {
    const videosList = completedVideos
      .slice(0, 10)
      .map((v, i) => `${i + 1}. ${v.title} (${v.category})`)
      .join('\n');

    const categories = [...new Set(completedVideos.map((v) => v.category))].join(', ');

    const prompt = `You are an expert programming mentor. Based on these completed lessons, suggest detailed practice projects.

Completed Lessons:
${videosList}

Categories covered: ${categories}

Generate 4 practice suggestions as a JSON array. Each suggestion must have this structure:
{
  "suggestions": [
    {
      "id": "unique-id-1",
      "type": "project|exercise|challenge|review",
      "title": "Specific Project/Exercise Title",
      "description": "2-3 sentence description",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTime": "1-2 hours",
      "skills": ["skill1", "skill2"],
      "steps": ["Step 1", "Step 2", "Step 3", "Step 4"],
      "tips": ["Tip 1", "Tip 2"],
      "expectedOutcome": "What you will have built/learned"
    }
  ]
}

Make suggestions progressive and directly related to the videos watched.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert programming mentor. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.suggestions || [];
  } catch (error) {
    console.error('Error generating practice suggestions:', error);
    return [];
  }
}