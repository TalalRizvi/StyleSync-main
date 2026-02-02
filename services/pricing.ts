// Gemini API Pricing (per 1 million tokens)
// Source: https://ai.google.dev/gemini-api/docs/pricing
export const GEMINI_PRICING = {
  "gemini-2.5-flash-image": {
    input_per_1m: 0.10,   // $0.10 per 1M input tokens
    output_per_1m: 0.40,  // $0.40 per 1M output tokens
    // Note: Image generation at 1K (1024x1024) uses ~1290 output tokens per image = ~$0.000516/image
    // This is the cheapest option for virtual try-on
  },
  "gemini-3-pro-image-preview": {
    input_per_1m: 1.25,   // $1.25 per 1M input tokens
    output_per_1m: 120.00, // $120.00 per 1M output tokens
    // Note: Image generation at 1K uses ~1120 output tokens per image = ~$0.134/image
    // Note: Image generation at 2K uses ~1120 output tokens per image = ~$0.134/image (same cost!)
    // Note: Image generation at 4K uses ~2000 output tokens per image = ~$0.24/image
  },
  "gemini-2.5-flash": {
    input_per_1m: 0.15,   // $0.15 per 1M input tokens
    output_per_1m: 0.60,  // $0.60 per 1M output tokens
  },
} as const;

export type GeminiModel = keyof typeof GEMINI_PRICING;

export function calculateCost(
  model: GeminiModel,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = GEMINI_PRICING[model];
  if (!pricing) {
    console.warn(`Unknown model: ${model}, using default pricing`);
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input_per_1m;
  const outputCost = (outputTokens / 1_000_000) * pricing.output_per_1m;
  
  return inputCost + outputCost;
}
