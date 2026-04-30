import { z } from 'zod';
import { AreaSchema, ConfidenceSchema } from './common-schemas';

// Expand Content Output
export const ExpandContentOutputSchema = z.object({
  expandedContent: z.string().describe('The expanded and elaborated content'),
  addedSections: z.array(z.string()).describe('List of new sections or topics added'),
  improvements: z.array(z.string()).describe('What was improved or expanded'),
  confidence: ConfidenceSchema,
});

export type ExpandContentOutput = z.infer<typeof ExpandContentOutputSchema>;

// Summarize Content Output
export const SummarizeContentOutputSchema = z.object({
  summary: z.string().describe('Condensed summary of the content'),
  keyPoints: z.array(z.string()).describe('Main points extracted'),
  wordCount: z.number().describe('Original word count'),
  summaryWordCount: z.number().describe('Summary word count'),
  confidence: ConfidenceSchema,
});

export type SummarizeContentOutput = z.infer<typeof SummarizeContentOutputSchema>;

// Improve Clarity Output
export const ImproveClarityOutputSchema = z.object({
  improvedContent: z.string().describe('Content rewritten for better clarity'),
  changes: z
    .array(
      z.object({
        type: z.enum(['grammar', 'structure', 'clarity', 'flow']).describe('Type of improvement'),
        description: z.string().describe('What was changed and why'),
      })
    )
    .describe('List of improvements made'),
  confidence: ConfidenceSchema,
});

export type ImproveClarityOutput = z.infer<typeof ImproveClarityOutputSchema>;

// Tag Suggestions Output
export const TagSuggestionsOutputSchema = z.object({
  suggestedTags: z
    .array(
      z.object({
        tag: z.string().describe('Suggested tag'),
        relevance: z.number().min(0).max(1).describe('Relevance score (0-1)'),
        reasoning: z.string().describe('Why this tag is relevant'),
      })
    )
    .describe('List of suggested tags with relevance scores'),
  confidence: ConfidenceSchema,
});

export type TagSuggestionsOutput = z.infer<typeof TagSuggestionsOutputSchema>;

// Area Suggestion Output
export const AreaSuggestionOutputSchema = z.object({
  suggestedArea: AreaSchema.describe('Suggested area for the note'),
  reasoning: z.string().describe('Why this area was suggested'),
  alternativeAreas: z
    .array(
      z.object({
        area: AreaSchema,
        confidence: z.number().min(0).max(1),
      })
    )
    .describe('Alternative area options'),
  confidence: ConfidenceSchema,
});

export type AreaSuggestionOutput = z.infer<typeof AreaSuggestionOutputSchema>;

// Link Suggestions Output
export const LinkSuggestionsOutputSchema = z.object({
  suggestedLinks: z
    .array(
      z.object({
        itemId: z.string().describe('ID of suggested linked item'),
        itemTitle: z.string().describe('Title of suggested item'),
        itemType: z
          .enum(['note', 'document', 'flashcard', 'course_lesson'])
          .describe('Type of item'),
        relevance: z.number().min(0).max(1).describe('Relevance score (0-1)'),
        reasoning: z.string().describe('Why this item should be linked'),
      })
    )
    .describe('List of suggested linked items'),
  confidence: ConfidenceSchema,
});

export type LinkSuggestionsOutput = z.infer<typeof LinkSuggestionsOutputSchema>;

// Generate Content Output
export const GenerateContentOutputSchema = z.object({
  generatedContent: z.string().describe('AI-generated note content'),
  structure: z.array(z.string()).describe('Outline or structure of the generated content'),
  keyTopics: z.array(z.string()).describe('Main topics covered'),
  confidence: ConfidenceSchema,
});

export type GenerateContentOutput = z.infer<typeof GenerateContentOutputSchema>;

// Extract from URL Output
export const ExtractFromUrlOutputSchema = z.object({
  title: z.string().describe('Extracted title'),
  summary: z.string().describe('Summary of the content'),
  keyPoints: z.array(z.string()).describe('Main points extracted'),
  suggestedTags: z.array(z.string()).describe('Tags suggested based on content'),
  suggestedArea: AreaSchema.optional().describe('Suggested area'),
  confidence: ConfidenceSchema,
});

export type ExtractFromUrlOutput = z.infer<typeof ExtractFromUrlOutputSchema>;

// Content Analysis Output
export const ContentAnalysisOutputSchema = z.object({
  keyPoints: z.array(z.string()).describe('Main points extracted'),
  sentiment: z.enum(['positive', 'neutral', 'negative']).describe('Overall sentiment'),
  readabilityScore: z.number().min(0).max(100).describe('Readability score (0-100)'),
  completeness: z
    .object({
      score: z.number().min(0).max(100).describe('Completeness score'),
      missingElements: z.array(z.string()).describe('What might be missing'),
      suggestions: z.array(z.string()).describe('Suggestions to improve completeness'),
    })
    .describe('Content completeness analysis'),
  confidence: ConfidenceSchema,
});

export type ContentAnalysisOutput = z.infer<typeof ContentAnalysisOutputSchema>;
