# Cost Logging Test Results

After deploying and running a try-on, check your browser console for logs like this:

## Expected Console Output:

```
=== TRY-ON COST LOG ===
Model: gemini-3-pro-image-preview
Input tokens: [ACTUAL_VALUE]
Output tokens: [ACTUAL_VALUE]
Total tokens: [ACTUAL_VALUE]
Input images: [COUNT]
Output images: 1
Output resolution: 2K (or 1K/4K)
Cost USD: [CALCULATED]
Full usageMetadata: {
  "promptTokenCount": [NUMBER],
  "candidatesTokenCount": [NUMBER],
  "totalTokenCount": [NUMBER],
  "promptTokensDetails": {
    "textTokens": [NUMBER],
    "imageTokens": [NUMBER]  // If images are tokenized
  },
  "candidatesTokensDetails": {
    "textTokens": [NUMBER],
    "imageTokens": [NUMBER]  // Output image tokens
  }
}
========================
```

## What to Look For:

1. **Model name**: Should be exactly `"gemini-3-pro-image-preview"`

2. **Input tokens**: Includes:
   - Text prompt tokens
   - Image tokens (if Gemini tokenizes images)
   - All input parts

3. **Output tokens**: Includes:
   - Generated image tokens (typically ~1120 for 2K images)
   - Any text response tokens

4. **Input images**: Count of images sent (model + garment images)

5. **Output images**: Should be 1

6. **Resolution**: Estimated from base64 size

## To Get Real Data:

1. Deploy the updated code
2. Run a try-on in the browser
3. Open browser DevTools Console (F12)
4. Look for the "=== TRY-ON COST LOG ===" section
5. Copy the full usageMetadata JSON
