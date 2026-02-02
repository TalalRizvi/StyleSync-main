import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Measurements, SizeChart, FitRecommendation, Garment } from "../types";
import { calculateCost, type GeminiModel } from "./pricing";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("Gemini API key is not configured. AI features will not be available.");
}

// Initialize the client only if the API key exists.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper function to ensure the client is initialized before making an API call.
const getAiClient = () => {
  if (!ai) {
    throw new Error("The AI service is not configured. Please check the application setup.");
  }
  return ai;
}

/**
 * Parses known Gemini API errors and returns a user-friendly Error object.
 * @param error The original error caught from an API call.
 * @returns A new Error object with a more descriptive message.
 */
function handleGeminiError(error: unknown): Error {
  const anError = error instanceof Error ? error : new Error(String(error));
  try {
    // The Gemini API often puts a JSON string with error details in the message.
    const errorJson = JSON.parse(anError.message);
    if (errorJson.error) {
      const { code, status, message } = errorJson.error;
      if (code === 403 || status === "PERMISSION_DENIED") {
        return new Error("Authentication failed. Please ensure the application's AI service is correctly configured and has the necessary permissions.");
      }
      if (code === 500 || status === "INTERNAL") {
        return new Error("The AI service encountered a temporary internal issue. Please try again in a moment.");
      }
      // For other specific API errors, return their message.
      if (message) {
        return new Error(`AI service error: ${message}`);
      }
    }
  } catch (e) {
    // The message was not a JSON string, or not in the expected format.
    // We'll fall through and return the original error.
  }
  return anError; // Return original error if parsing fails or it's not a Gemini error.
}


export async function generateModelImage(
  userImage: { base64: string; mimeType: string }
): Promise<{ base64: string; mimeType: string }> {
  const ai = getAiClient();
  const prompt = `You are an expert photo editor specializing in creating assets for virtual try-on applications. Your task is to process the user-provided image.

**PRIMARY GOAL: Isolate the person and place them in a neutral pose on a clean background, while perfectly preserving their original identity.**

**CRITICAL INSTRUCTIONS:**
1.  **PRESERVE IDENTITY:** The person's face, facial features, hair, skin tone, and body shape MUST remain **IDENTICAL** to the original photo. Do NOT alter, stylize, or change their appearance in any way. The output must look like the same person.
2.  **STANDARDIZE POSE:** Adjust the person's pose to a standard, neutral, standing 'A-pose', as if they are a fashion model ready for a virtual fitting.
3.  **CLEAN BACKGROUND:** Completely replace the original background with a solid, neutral light gray studio background (#f0f0f0).
4.  **OUTPUT IMAGE ONLY:** Your final output must be ONLY the edited image. Do not include any text, borders, watermarks, or other elements.`;

  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: {
          parts: [
            { inlineData: { data: userImage.base64, mimeType: userImage.mimeType } },
            { text: prompt }
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT], // TEXT is included as the model can sometimes return explanatory text.
        },
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("The AI model did not provide a response (e.g., safety block).");
      }

      for (const part of response.candidates[0]?.content?.parts ?? []) {
        if (part.inlineData) {
          return {
            base64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          };
        }
      }
      
      const textResponse = response.candidates[0]?.content?.parts.find(p => p.text)?.text;
      lastError = new Error(textResponse || "The AI failed to generate a model image.");
      console.warn(`Model generation attempt ${attempt} failed: ${lastError.message}`);

    } catch (error) {
      lastError = handleGeminiError(error);
      console.error(`Error during model generation attempt ${attempt}:`, error);
    }

    if (attempt < MAX_RETRIES) {
        await new Promise(res => setTimeout(res, 500)); // Wait before retrying
    }
  }

  throw lastError || new Error("Failed to generate your virtual model after multiple attempts.");
}


export async function estimateMeasurementsFromImage(
  userImageBase64: string,
  mimeType: string
): Promise<Measurements> {
  const ai = getAiClient();
  const prompt = `You are an AI expert in anthropometry. Your task is to estimate body measurements from a single photograph for a virtual try-on application. Accuracy is crucial for a good user experience.

Analyze the provided full-body photo of the person. Based on their proportions, visible context, and common human biometrics, provide your most accurate estimates for the following measurements.

**CRITICAL INSTRUCTIONS:**
1.  **Realistic Human Values:** All measurements must be plausible for a human. Do not provide extreme or impossible values.
2.  **Infer Height/Weight:** If the person's exact height is not obvious, make a reasonable estimation based on environmental cues or standard proportions. Estimate weight based on the estimated height and body shape.
3.  **Output Format:** Your entire response MUST be a single, valid JSON object and nothing else. Do not include any markdown formatting (like \`\`\`json), comments, or explanatory text.

**Required JSON Object Structure:**
{
  "height": number, // Total height in inches
  "weight": number, // Estimated weight in pounds (lbs)
  "chest": number,  // Chest circumference in inches, measured at the fullest part
  "waist": number   // Waist circumference in inches, measured at the narrowest part of the torso
}
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: userImageBase64,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            height: { type: Type.NUMBER, description: "Estimated height in inches." },
            weight: { type: Type.NUMBER, description: "Estimated weight in pounds (lbs)." },
            chest: { type: Type.NUMBER, description: "Estimated chest circumference in inches." },
            waist: { type: Type.NUMBER, description: "Estimated waist circumference in inches." },
          },
        },
      },
    });
    
    const jsonText = response.text.trim();
    const estimatedMeasurements = JSON.parse(jsonText);
    
    // Round numbers for a cleaner user experience
    return {
        height: Math.round(estimatedMeasurements.height),
        weight: Math.round(estimatedMeasurements.weight),
        chest: Math.round(estimatedMeasurements.chest),
        waist: Math.round(estimatedMeasurements.waist),
    };

  } catch (error) {
    console.error("Error estimating measurements:", error);
    throw handleGeminiError(error);
  }
}


export async function getFitRecommendation(
  measurements: Measurements,
  sizeChart: SizeChart
): Promise<FitRecommendation> {
  const ai = getAiClient();
  const prompt = `You are an expert virtual stylist AI. Your primary function is to provide the most accurate and helpful size recommendation for an online shopper. A great recommendation reduces returns and increases customer satisfaction.

**Analyze the following data:**

1.  **User's Body Measurements:**
    - Height: ${measurements.height} inches
    - Weight: ${measurements.weight} lbs
    - Chest: ${measurements.chest} inches
    - Waist: ${measurements.waist} inches

2.  **Garment's Size Chart (in inches):**
    ${JSON.stringify(sizeChart, null, 2)}
    *Note: Prioritize the most relevant measurements for the garment type (e.g., chest for shirts, waist for pants). Size chart values can be single numbers or ranges (e.g., "38-40").*

**Your Task:**
Based on a careful comparison of the user's measurements against the size chart, determine the best size. Then, generate a single, valid JSON object with the following structure. Do not include any text outside of the JSON object.

**Required JSON Output Structure:**
1.  'recommendedSize': The single best size label (e.g., "M", "32x32"). This is your primary, most confident recommendation.
2.  'projectedFit': A concise, descriptive string (e.g., "Slim Fit", "True to Size", "Relaxed and Roomy") explaining how the recommended size will likely fit.
3.  'confidenceScore': A numeric value from 0.0 to 1.0 representing your confidence in the primary recommendation.
4.  'alternatives': An array containing exactly two other size options. This is crucial for giving the user choices.
    - Typically, one size smaller and one size larger than the recommendation.
    - If the recommendation is an extreme size (smallest or largest), provide the next two closest sizes.
    - Each alternative must have a 'size' and a 'fit' description (e.g., "Slightly Snug", "Oversized Look"). The goal is to always offer three distinct size choices if the chart allows.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedSize: { type: Type.STRING, description: "The single best size abbreviation, e.g., 'M' or '32x32'." },
            projectedFit: { type: Type.STRING, description: "A brief, 2-4 word description of the fit, e.g., 'Slim Fit' or 'Comfortably Loose'." },
            confidenceScore: { type: Type.NUMBER, description: "A confidence score between 0.0 and 1.0." },
            alternatives: {
              type: Type.ARRAY,
              description: "An array containing exactly two alternative size options.",
              items: {
                type: Type.OBJECT,
                properties: {
                  size: { type: Type.STRING, description: "An alternative size abbreviation." },
                  fit: { type: Type.STRING, description: "A brief, 2-4 word description of the alternative fit." },
                },
                 required: ["size", "fit"]
              },
            },
          },
          required: ["recommendedSize", "projectedFit", "confidenceScore", "alternatives"]
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error getting fit recommendation:", error);
    throw handleGeminiError(error);
  }
}

export interface TryOnCost {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  model: string;
}

export async function virtualTryOn(
  modelImage: { base64: string; mimeType: string },
  measurements: Measurements,
  upperGarment: {
    type: string;
    color: string;
    description?: string;
    customImage?: { base64: string; mimeType: string };
    sizeChart: SizeChart;
  } | null,
  upperRecommendation: FitRecommendation | null,
  selectedUpperTryOn: { size: string, fit: string } | null,
  lowerGarment: {
    type: string;
    color: string;
    description?: string;
    customImage?: { base64: string; mimeType: string };
    sizeChart: SizeChart;
  } | null,
  lowerRecommendation: FitRecommendation | null,
  selectedLowerTryOn: { size: string, fit: string } | null,
  poseDescription: string
): Promise<{ imageUrl: string; text: string; cost?: TryOnCost }> {
  const ai = getAiClient();
  if (!upperGarment && !lowerGarment) {
    throw new Error("At least one garment must be provided for virtual try-on.");
  }

  // Detect if this is a back view request based on the pose description
  const isBackView = poseDescription.toLowerCase().includes('view from behind') || 
                     poseDescription.toLowerCase().includes('back of the person') ||
                     poseDescription.toLowerCase().includes('back view');

  const parts: any[] = [];
  
  // Build parts array with images first, then text prompt at the end
  parts.push({ inlineData: { data: modelImage.base64, mimeType: modelImage.mimeType } });
  
  let garmentImageCount = 0;
  let upperGarmentIndex = -1;
  let lowerGarmentIndex = -1;
  
  if (upperGarment?.customImage && selectedUpperTryOn) {
    garmentImageCount++;
    upperGarmentIndex = garmentImageCount + 1; // +1 because model image is first
    parts.push({ inlineData: { data: upperGarment.customImage.base64, mimeType: upperGarment.customImage.mimeType } });
  }
  
  if (lowerGarment?.customImage && selectedLowerTryOn) {
    garmentImageCount++;
    lowerGarmentIndex = garmentImageCount + 1;
    parts.push({ inlineData: { data: lowerGarment.customImage.base64, mimeType: lowerGarment.customImage.mimeType } });
  }

  let promptText = `TASK: Virtual try-on - Transfer the EXACT garment onto the person.

IMAGES:
- Image 1: Person to dress
${upperGarmentIndex > 0 ? `- Image ${upperGarmentIndex}: Upper garment to transfer` : ''}
${lowerGarmentIndex > 0 ? `- Image ${lowerGarmentIndex}: Lower garment to transfer` : ''}

STEP 1 - ANALYZE THE GARMENT IMAGE(S) CAREFULLY:
Before generating, study every detail of the garment reference image:
- What is the exact color? (Note the specific shade/hue)
- What is the neckline shape? (V-neck, round, etc.)
- What do the sleeves look like? (Sheer, solid, pattern, length)
- What embroidery/pattern exists? (Where is it placed, what does it look like)
- What decorative elements are there? (Tassels, beads, borders, sequins)
- Is the fabric sheer/transparent or solid?

STEP 2 - TRANSFER THE GARMENT:
Now place this EXACT garment on the person. The garment in your output must match what you observed in Step 1.

STRICT RULES:
- The output garment must be recognizable as THE SAME garment from the reference
- Preserve the EXACT embroidery/pattern placement and design
- Preserve the EXACT sleeve appearance (if sheer with embroidery, keep sheer with same embroidery)
- Preserve the EXACT neckline shape and decoration
- Preserve ALL decorative elements (tassels, borders, beadwork)
- Do NOT simplify, enhance, or reinterpret any details
- Do NOT change the color temperature or shade

`;

  if (isBackView) {
    promptText += `POSE: Show the person from behind (back to camera). Face not visible.

`;
  } else {
    promptText += `CRITICAL - PERSON IDENTITY PRESERVATION:
The person in Image 1 must remain EXACTLY THE SAME in the output. This is an EDITING task, not a recreation.
- FACE: Do NOT regenerate, alter, or stylize the face. Keep the EXACT same facial features, expression, eyes, nose, mouth, skin texture, and complexion from Image 1.
- SKIN: Preserve the exact skin tone and any visible skin texture.
- HAIR: Keep the exact same hairstyle, hair color, and hair placement.
- GLASSES: If wearing glasses, keep them exactly as shown.
- BODY HEIGHT: The person's height must remain EXACTLY the same. Do NOT make them taller or shorter.
- BODY PROPORTIONS: Maintain the exact same body proportions - same shoulder width, same waist-to-hip ratio, same limb lengths, same overall body shape.
- BODY POSE: Keep the same pose and stance from Image 1. Only adjust if the pose description requires it, but maintain the same body structure.
- BACKGROUND: Keep the same background from Image 1.

The ONLY change should be the clothing. Think of this as a photo edit where you mask out the clothes and replace them, leaving everything else pixel-perfect. The person's body dimensions and height must be identical to Image 1.

POSE: ${poseDescription}

`;
  }

  if (upperGarment && selectedUpperTryOn) {
    if (!upperGarment.customImage) {
        promptText += `UPPER GARMENT: Create a ${upperGarment.color} ${upperGarment.type}.`;
        if (upperGarment.description) {
            promptText += ` Details: ${upperGarment.description}.`;
        }
        promptText += ` Fit: ${selectedUpperTryOn.fit}\n`;
    } else {
        promptText += `UPPER GARMENT: Copy EXACTLY from Image ${upperGarmentIndex}. Fit to body as: ${selectedUpperTryOn.fit}\n`;
    }
  }

  if (lowerGarment && selectedLowerTryOn) {
    if (!lowerGarment.customImage) {
        promptText += `LOWER GARMENT: Create ${lowerGarment.color} ${lowerGarment.type}.`;
        if (lowerGarment.description) {
            promptText += ` Details: ${lowerGarment.description}.`;
        }
        promptText += ` Fit: ${selectedLowerTryOn.fit}\n`;
    } else {
        promptText += `LOWER GARMENT: Copy EXACTLY from Image ${lowerGarmentIndex}. Fit to body as: ${selectedLowerTryOn.fit}\n`;
    }
  }
  
  promptText += `
OUTPUT REQUIREMENTS:
- Only the final image. The garment on the person must look like the SAME garment from the reference, not a similar or inspired version.
- Clean, solid white or light gray background. Remove any background elements, objects, or distractions.
- No watermarks, text, labels, or decorative elements outside the person and clothing.
- Focus only on the person wearing the garment - nothing else in the frame.`;

  parts.push({ text: promptText });

  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Use gemini-3-pro-image-preview (was working before)
      // Removed imageConfig to avoid invalid argument error
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      let imageUrl: string | null = null;
      let text: string = "Here's how it looks!";
      
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("The AI model did not provide a response (e.g., safety block).");
      }

      // Extract token usage from response
      const usageMetadata = (response as any).usageMetadata;
      const inputTokens = usageMetadata?.promptTokenCount || 0;
      const outputTokens = usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = usageMetadata?.totalTokenCount || (inputTokens + outputTokens);

      // Count input images
      const inputImageCount = parts.filter(p => p.inlineData).length;
      
      // Count output images and get resolution
      let outputImageCount = 0;
      let outputResolution: string | undefined;
      
      for (const part of response.candidates[0]?.content?.parts ?? []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          outputImageCount = 1;
          // Estimate resolution from base64 size
          const imageSize = part.inlineData.data.length;
          if (imageSize > 2000000) outputResolution = '4K';
          else if (imageSize > 1000000) outputResolution = '2K';
          else outputResolution = '1K';
        } else if (part.text) {
          text = part.text.trim();
        }
      }

      if (imageUrl) {
        const modelName: GeminiModel = "gemini-3-pro-image-preview";
        const costUsd = calculateCost(modelName, inputTokens, outputTokens);
        
        const cost: TryOnCost = {
          inputTokens,
          outputTokens,
          totalTokens,
          costUsd,
          model: modelName,
        };

        // Detailed logging for analysis
        console.log('=== TRY-ON COST LOG ===');
        console.log('Model:', modelName);
        console.log('Input tokens:', inputTokens);
        console.log('Output tokens:', outputTokens);
        console.log('Total tokens:', totalTokens);
        console.log('Input images:', inputImageCount);
        console.log('Output images:', outputImageCount);
        console.log('Output resolution:', outputResolution);
        console.log('Cost USD:', costUsd);
        console.log('Full usageMetadata:', JSON.stringify(usageMetadata, null, 2));
        console.log('========================');

        return { imageUrl, text, cost };
      }
      
      lastError = new Error(
        text !== "Here's how it looks!" && text.length > 0
          ? `The AI responded with text only: "${text}"`
          : "The AI failed to generate an image preview."
      );
      console.warn(`Virtual try-on attempt ${attempt} failed: ${lastError.message}`);

    } catch (error) {
      lastError = handleGeminiError(error);
      console.error(`Error during virtual try-on attempt ${attempt}:`, error);
    }
    
    if (attempt < MAX_RETRIES) {
      await new Promise(res => setTimeout(res, 500)); 
    }
  }

  throw lastError || new Error("The AI failed to generate an image preview after multiple attempts.");
}