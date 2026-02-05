import { NextRequest, NextResponse } from "next/server";
import { getProvider, DEFAULT_PROVIDER } from "@/lib/providers";

export async function POST(request: NextRequest) {
  try {
    const {
      personaDescription,
      targetImage,
      providerId = DEFAULT_PROVIDER,
      model,
      thinking = false,
    } = await request.json();

    if (!personaDescription) {
      return NextResponse.json(
        { error: "Persona description is required (output from first agent)" },
        { status: 400 }
      );
    }

    if (!targetImage) {
      return NextResponse.json(
        { error: "Target image is required" },
        { status: 400 }
      );
    }

    const provider = getProvider(providerId);

    if (!provider.supportsVision) {
      return NextResponse.json(
        { error: `${provider.name} does not support image input` },
        { status: 400 }
      );
    }

    const visionModel = provider.visionModel;

    // Build extra params for providers that support thinking (GLM)
    const extraParams: Record<string, unknown> = {};
    if (thinking && providerId === "glm") {
      extraParams.thinking = { type: "enabled" };
    }

    // Helper to extract base64 from data URL (GLM needs raw base64, not data URL)
    const extractBase64 = (dataUrl: string): string => {
      if (providerId === "glm") {
        const base64Match = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
        return base64Match ? base64Match[1] : dataUrl;
      }
      return dataUrl;
    };

    // Build the prompt for the replace agent
    const promptText = `You are analyzing a TARGET IMAGE to create an AI image generation prompt.

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

    const content: Array<
      { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
    > = [
      { type: "text", text: promptText },
      {
        type: "image_url",
        image_url: { url: extractBase64(targetImage.data || targetImage) },
      },
    ];

    console.log("=== Replace Agent Request ===");
    console.log("Provider:", providerId);
    console.log("Vision Model:", visionModel);
    console.log("Persona description length:", personaDescription.length);

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
  } catch (error: unknown) {
    console.error("Replace API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
