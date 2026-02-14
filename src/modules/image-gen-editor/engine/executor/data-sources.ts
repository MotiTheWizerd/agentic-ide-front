import type { NodeExecutor } from "../types";
import { composeScenePrompt } from "../../scene-prompts";

/**
 * ConsistentCharacterNode: pure data source — outputs cached persona description.
 * Connects via adapter handles (bottom → top) to prompt-generating nodes.
 */
export const consistentCharacter: NodeExecutor = async (ctx) => {
  const { nodeData } = ctx;
  const personaDescription = nodeData.characterDescription as string;
  const characterName = nodeData.characterName as string;

  if (!personaDescription) {
    return {
      success: false,
      output: { error: "No character selected — drag one from Assets" },
    };
  }

  return {
    success: true,
    output: {
      text: personaDescription,
      personaDescription,
      personaName: characterName || "Character",
    },
  };
};

/** SceneBuilderNode: pure source — composes rich scene prompt from config dropdowns. */
export const sceneBuilder: NodeExecutor = async (ctx) => {
  const { nodeData } = ctx;
  const selections: Record<string, string> = {};
  for (const key of ["imageStyle", "lighting", "timeOfDay", "weather", "cameraAngle", "cameraLens", "mood"]) {
    const val = nodeData[key] as string;
    if (val) selections[key] = val;
  }

  const text = composeScenePrompt(selections);
  if (!text) {
    return { success: false, output: { error: "No scene attributes selected" } };
  }

  return { success: true, output: { text } };
};
