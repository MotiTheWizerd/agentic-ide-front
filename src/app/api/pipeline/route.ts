import { NextRequest, NextResponse } from "next/server";
import { getProvider, DEFAULT_PROVIDER } from "@/lib/providers";

interface ImageItem {
  data: string;
  filename: string;
  type: "reference" | "persona" | "target";
}

interface PipelineResult {
  success: boolean;
  personaDescription?: string;
  replacePrompt?: string;
  error?: string;
  timing?: {
    step1Ms: number;
    step2Ms: number;
    totalMs: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<PipelineResult>> {
  const startTime = Date.now();
  let step1Time = 0;
  let step2Time = 0;

  try {
    const {
      images,
      text,
      providerId = DEFAULT_PROVIDER,
      model,
      thinking = false,
    } = await request.json();

    const provider = getProvider(providerId);
    const visionModel = provider.visionModel;

    if (!provider.supportsVision) {
      return NextResponse.json({
        success: false,
        error: `${provider.name} does not support image input`,
      });
    }

    // Parse images
    const typedImages = images as ImageItem[];
    const referenceImages = typedImages.filter((img) => img.type === "reference");
    const personaImage = typedImages.find((img) => img.type === "persona");
    const targetImage = typedImages.find((img) => img.type === "target");

    if (!personaImage) {
      return NextResponse.json({
        success: false,
        error: "Persona image is required",
      });
    }

    if (!targetImage) {
      return NextResponse.json({
        success: false,
        error: "Target image is required",
      });
    }

    // Build extra params for providers that support thinking (GLM)
    const extraParams: Record<string, unknown> = {};
    if (thinking && providerId === "glm") {
      extraParams.thinking = { type: "enabled" };
    }

    // Helper to extract base64 from data URL (GLM needs raw base64)
    const extractBase64 = (dataUrl: string): string => {
      if (providerId === "glm") {
        const base64Match = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
        return base64Match ? base64Match[1] : dataUrl;
      }
      return dataUrl;
    };

    console.log("=== Pipeline Started ===");
    console.log("Provider:", providerId);
    console.log("Reference images:", referenceImages.length);
    console.log("Has persona:", !!personaImage);
    console.log("Has target:", !!targetImage);

    // ============================================
    // STEP 1: Generate Persona Description
    // ============================================
    const step1Start = Date.now();
    console.log("\n--- Step 1: Describe Persona ---");

    let step1Prompt = "";
    let imageIndex = 1;

    // Add reference images info
    referenceImages.forEach((img) => {
      step1Prompt += `Image ${imageIndex} (${img.filename}) is a REFERENCE image showing the target scene/style/environment. `;
      imageIndex++;
    });

    // Add persona image info
    step1Prompt += `Image ${imageIndex} (${personaImage.filename}) is the PERSONA - the person whose appearance must be preserved exactly.\n\n`;

    step1Prompt += `Create a detailed AI image generation prompt with these requirements:

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

    if (text) {
      step1Prompt += `\n\nAdditional instructions: ${text}`;
    }

    step1Prompt += `\n\nOutput ONLY the improved prompt, nothing else.`;

    // Build content for step 1
    const step1Content: Array<
      { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
    > = [{ type: "text", text: step1Prompt }];

    // Add reference images
    referenceImages.forEach((img) => {
      step1Content.push({
        type: "image_url",
        image_url: { url: extractBase64(img.data) },
      });
    });

    // Add persona image
    step1Content.push({
      type: "image_url",
      image_url: { url: extractBase64(personaImage.data) },
    });

    const step1Response = await provider.client.chat.completions.create({
      model: visionModel,
      stream: false,
      messages: [{ role: "user", content: step1Content }],
      max_tokens: 1500,
      ...extraParams,
    });

    const personaDescription = step1Response.choices[0].message.content || "";
    step1Time = Date.now() - step1Start;
    console.log("Step 1 complete in", step1Time, "ms");
    console.log("Persona description length:", personaDescription.length);

    // ============================================
    // STEP 2: Generate Replace Prompt
    // ============================================
    const step2Start = Date.now();
    console.log("\n--- Step 2: Replace Prompt ---");

    const step2Prompt = `You are analyzing a TARGET IMAGE to create an AI image generation prompt.

## PERSONA DESCRIPTION (from previous analysis - this person's IDENTITY/FACE must be used):
${personaDescription}

## YOUR TASK:
Analyze the TARGET IMAGE and create a detailed prompt that will:

1. USE THE PERSONA'S IDENTITY from the description above:
   - Their face, facial features, skin tone
   - Their hair style and color
   - Their body type and distinctive characteristics
   - DO NOT use their original clothing - ignore clothing from persona description

2. KEEP EVERYTHING FROM THE TARGET IMAGE:
   - The EXACT clothing and accessories the person is wearing
   - The EXACT pose and body position
   - The EXACT camera angle and framing
   - The background/environment/scene
   - The lighting and mood

3. THE GOAL: Replace ONLY the person's identity (face/features) in the target image with the persona's identity, while keeping the target's clothes, pose, and scene exactly as shown.

Think of it as: "Put the persona's face on the person in this image, keeping everything else identical"

First describe what you see in the target image (pose, clothing, scene), then create the final prompt.

Output ONLY the final image generation prompt, nothing else.`;

    const step2Content: Array<
      { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
    > = [
      { type: "text", text: step2Prompt },
      { type: "image_url", image_url: { url: extractBase64(targetImage.data) } },
    ];

    const step2Response = await provider.client.chat.completions.create({
      model: visionModel,
      stream: false,
      messages: [{ role: "user", content: step2Content }],
      max_tokens: 1500,
      ...extraParams,
    });

    const replacePrompt = step2Response.choices[0].message.content || "";
    step2Time = Date.now() - step2Start;
    console.log("Step 2 complete in", step2Time, "ms");
    console.log("Replace prompt length:", replacePrompt.length);

    const totalTime = Date.now() - startTime;
    console.log("\n=== Pipeline Complete ===");
    console.log("Total time:", totalTime, "ms");

    return NextResponse.json({
      success: true,
      personaDescription,
      replacePrompt,
      timing: {
        step1Ms: step1Time,
        step2Ms: step2Time,
        totalMs: totalTime,
      },
    });
  } catch (error: unknown) {
    console.error("Pipeline Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Pipeline failed";
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timing: {
        step1Ms: step1Time,
        step2Ms: step2Time,
        totalMs: Date.now() - startTime,
      },
    });
  }
}
