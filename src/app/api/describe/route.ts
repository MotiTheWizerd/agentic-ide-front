import { NextRequest, NextResponse } from "next/server";
import { getProvider, DEFAULT_PROVIDER } from "@/lib/providers";

interface ImageItem {
  data: string;
  filename: string;
  type: "reference" | "persona";
}

export async function POST(request: NextRequest) {
  try {
    const { images, text, providerId = DEFAULT_PROVIDER, model, thinking = false } = await request.json();

    const provider = getProvider(providerId);

    // Use custom model for text tasks (GLM), but always use provider's visionModel for images
    const textModel = model || provider.textModel;
    const visionModel = provider.visionModel; // Always use GLM-4.6V for vision

    // Build extra params for providers that support thinking (GLM)
    const extraParams: Record<string, unknown> = {};
    if (thinking && providerId === "glm") {
      extraParams.thinking = { type: "enabled" };
    }

    // Handle multiple images mode
    if (images && images.length > 0) {
      if (!provider.supportsVision) {
        return NextResponse.json(
          { error: `${provider.name} does not support image input` },
          { status: 400 }
        );
      }

      const typedImages = images as ImageItem[];
      const referenceImages = typedImages.filter((img) => img.type === "reference");
      const personaImage = typedImages.find((img) => img.type === "persona");

      // Build the prompt with image labels
      let imageLabels: string[] = [];
      let imageIndex = 1;

      // Add reference images first
      referenceImages.forEach((img) => {
        imageLabels.push(`Image ${imageIndex} (${img.filename}) is a REFERENCE image showing the target scene/style/environment`);
        imageIndex++;
      });

      // Add persona image
      if (personaImage) {
        imageLabels.push(`Image ${imageIndex} (${personaImage.filename}) is the PERSONA - the person whose appearance must be preserved exactly`);
      }

      // Build the full prompt
      let promptText = `${imageLabels.join(". ")}.\n\n`;

      if (referenceImages.length > 0 && personaImage) {
        promptText += `Create a detailed AI image generation prompt with these requirements:

1. PRESERVE the persona's COMPLETE appearance from Image ${imageIndex}:
   - Face, facial features, expression
   - Body type, skin tone, hair style/color
   - CLOTHING and accessories they are wearing
   - All distinctive characteristics

2. ONLY take from the reference images (Images 1-${referenceImages.length}):
   - Scene/environment/background
   - Lighting and mood
   - Art style and composition
   - Camera angle if applicable

3. DO NOT transfer clothing, accessories, or any appearance elements from reference images to the persona

Think of it as: "This exact person WITH their exact outfit, placed into that scene/environment"

First describe the persona's complete appearance including their clothing, then describe the scene/environment they should be placed in.`;
      } else if (referenceImages.length > 0) {
        promptText += `Create a detailed AI image generation prompt based on the style, composition, and mood of these reference images.`;
      } else if (personaImage) {
        promptText += `Create a detailed AI image generation prompt that captures this persona/subject in precise detail - their face, features, body type, clothing, and distinctive characteristics.`;
      }

      if (text) {
        promptText += `\n\nAdditional instructions: ${text}`;
      }

      promptText += `\n\nOutput ONLY the improved prompt, nothing else.`;

      // Helper to extract base64 from data URL (GLM needs raw base64, not data URL)
      const extractBase64 = (dataUrl: string): string => {
        if (providerId === "glm") {
          // GLM expects raw base64 without data:image/...;base64, prefix
          const base64Match = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
          return base64Match ? base64Match[1] : dataUrl;
        }
        return dataUrl; // Other providers use full data URL
      };

      // Build content array with all images
      const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
        { type: "text", text: promptText },
      ];

      // Add reference images in order
      referenceImages.forEach((img) => {
        content.push({
          type: "image_url",
          image_url: { url: extractBase64(img.data) },
        });
      });

      // Add persona image last
      if (personaImage) {
        content.push({
          type: "image_url",
          image_url: { url: extractBase64(personaImage.data) },
        });
      }

      console.log("=== GLM Vision Request ===");
      console.log("Provider:", providerId);
      console.log("Vision Model:", visionModel);
      console.log("Images count:", content.length - 1);
      console.log("Extra params:", extraParams);
      // Log first 50 chars of image URL to verify format
      const firstImg = content.find(c => c.type === "image_url") as { type: "image_url"; image_url: { url: string } } | undefined;
      if (firstImg) {
        console.log("Image URL format (first 50 chars):", firstImg.image_url.url.substring(0, 50));
      }

      const response = await provider.client.chat.completions.create({
        model: visionModel,
        stream: false,
        messages: [
          {
            role: "user",
            content: content,
          },
        ],
        max_tokens: 1500,
        ...extraParams,
      });

      return NextResponse.json({
        description: response.choices[0].message.content,
      });
    }
    // Text-only mode (prompt enhancement)
    else if (text) {
      const response = await provider.client.chat.completions.create({
        model: textModel,
        stream: false,
        messages: [
          {
            role: "user",
            content: `You are an expert prompt engineer. Take this simple prompt and transform it into a detailed, rich prompt for AI image generation.

Add specific visual details, art style, composition, mood, and quality boosters.

Output ONLY the improved prompt, nothing else.

Simple prompt: "${text}"`,
          },
        ],
        max_tokens: 1000,
        ...extraParams,
      });

      const content = response.choices[0]?.message?.content || "No response";
      return NextResponse.json({
        description: content,
      });
    }

    return NextResponse.json(
      { error: "Please provide images or text" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
