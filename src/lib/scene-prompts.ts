/** Rich prompt templates for Scene Builder. Each key maps to a detailed prompt block. */

export const SCENE_OPTIONS = {
  imageStyle: {
    label: "Image Style",
    options: {
      realistic:
        "shot on imperfect lens realism:\n35mm candid / phone camera / security cam grain / motion blur / depth errors,\nultra-detailed, photorealistic, natural skin texture, interesting imperfections, asymmetry allowed",
      artistic:
        "artistic interpretation, painterly visible brush strokes, expressive color palette,\ncreative non-standard composition, fine art aesthetic, textured canvas feel,\ndeliberate color bleeding, mixed media influence",
      anime:
        "anime art style, cel shading, vibrant saturated colors, clean bold linework,\nmanga-inspired dynamic composition, expressive exaggerated features,\nstylized lighting with sharp highlights",
      cinematic:
        "cinematic composition, anamorphic lens flare, letterbox 2.39:1 framing,\nfilm grain texture, professional color grading, shallow depth of field,\nmovie still quality, blockbuster production value",
      watercolor:
        "watercolor painting style, wet-on-wet bleeding edges, transparent color washes,\nvisible paper texture underneath, soft diffused edges, pigment granulation,\ndelicate layered glazes, unpredictable organic flow",
      "oil painting":
        "oil painting technique, thick impasto brush strokes, rich saturated pigments,\nvisible canvas weave, classical chiaroscuro modeling, buttery paint texture,\nlayered glazing depth, museum-quality fine art",
      "3d render":
        "3D rendered, subsurface scattering, physically-based materials,\nglobal illumination, ray-traced reflections, volumetric atmosphere,\nclean geometry with micro-detail displacement, octane / unreal engine quality",
      "pixel art":
        "pixel art style, limited retro color palette, deliberate dithering patterns,\ncrisp hard-edged pixels, no anti-aliasing, 16-bit / 32-bit aesthetic,\nnostalgic game art composition, sprite-like detail",
    },
  },

  lighting: {
    label: "Lighting",
    options: {
      "natural daylight":
        "natural daylight illumination, soft ambient fill light,\nrealistic sun positioning with natural shadow falloff,\nsubtle color temperature shifts, environment-reflected bounce light",
      "golden hour":
        "golden hour warm lighting, elongated soft shadows,\namber-orange glow on all surfaces, sun low on horizon,\nwarm color temperature 3000K, rim light on edges, lens flare hints",
      night:
        "nighttime darkness, limited artificial light sources,\ndeep shadows with crushed blacks, moonlight blue tint,\nlight pooling under street lamps, high contrast pockets of visibility",
      neon:
        "neon light spill, colorful electric glow (pink / cyan / purple),\nreflections on wet surfaces and glass, cyberpunk ambiance,\ncolor mixing from multiple neon sources, sharp colored shadows",
      studio:
        "professional studio lighting setup, key light with fill and rim,\ncontrolled shadows, clean even illumination,\nsoftbox diffusion, neutral color temperature, catchlights in reflective surfaces",
      dramatic:
        "dramatic high-contrast lighting, deep chiaroscuro shadows,\nsingle harsh directional source, half-face illumination,\ntheatrical spotlight effect, noir-inspired shadow patterns",
      "soft diffused":
        "soft diffused lighting, overcast sky quality,\nminimal harsh shadows, even wrap-around illumination,\ngentle gradients, flattering skin tones, dreamy glow",
      backlit:
        "strong backlighting, silhouette edge glow, rim light halo,\nlight bleeding around subject contours, lens flare artifacts,\nforeground in relative shadow, ethereal atmosphere",
    },
  },

  timeOfDay: {
    label: "Time of Day",
    options: {
      dawn:
        "pre-sunrise dawn light, deep blue-to-pink gradient sky,\nfirst hints of warm light on horizon, long cool shadows,\nmist hanging low, quiet stillness, dew-covered surfaces",
      morning:
        "fresh morning light, clean crisp illumination,\nsharp shadows at medium angle, bright clear sky,\nmorning energy, dewy atmosphere, warm-cool color balance",
      noon:
        "harsh noon overhead sun, minimal shadows directly below,\nhigh contrast, bleached highlights, squinting brightness,\nflat top-down illumination, heat haze shimmer",
      afternoon:
        "warm afternoon sunlight, angled golden rays,\nmedium-length defined shadows, relaxed warm tone,\nrich saturated colors, comfortable familiar lighting",
      sunset:
        "sunset sky ablaze with orange-red-purple gradient,\ndramatic long shadows stretching across ground,\nwarm-to-cool transition, silhouette potential, painterly sky",
      dusk:
        "twilight dusk, deep blue-purple sky, last trace of orange on horizon,\nearly artificial lights flickering on, blue hour color cast,\nmelancholic fading light, city lights emerging",
      night:
        "deep night, dark sky with stars or city glow,\nartificial light sources dominating, pools of light in darkness,\nhigh contrast between lit and shadow areas, nocturnal atmosphere",
      midnight:
        "dead of midnight, near-total darkness, sparse light sources,\nmoonlight silver cast, deep blacks, quiet isolation,\nminimal visibility, noir atmosphere, shadows swallow detail",
    },
  },

  weather: {
    label: "Weather",
    options: {
      clear:
        "clear sky, unobstructed light source, sharp defined shadows,\ncrisp visibility to horizon, vivid saturated colors,\nclean atmosphere, no atmospheric diffusion",
      cloudy:
        "overcast cloud cover, soft diffused shadowless light,\nflat even illumination, muted desaturated palette,\nlow contrast, grey sky dome, moody subdued tones",
      rainy:
        "active rainfall, wet reflective surfaces everywhere,\nwater droplets visible, puddle reflections, splashing impact,\ndark saturated colors, diffused streaky light through rain",
      foggy:
        "thick atmospheric fog, drastically reduced visibility,\nsoft halos around light sources, depth fading to white,\nmysterious obscured background, muffled sound feeling, ethereal",
      snowy:
        "snowfall particles in air, white snow covering surfaces,\nhigh-key bright reflective ground, cold blue color cast,\nsoft diffused light from snow bounce, winter atmosphere",
      stormy:
        "dark threatening storm clouds, dramatic turbulent sky,\nintermittent harsh lightning illumination, wind-blown elements,\ngreen-grey ominous color cast, high drama tension",
      windy:
        "strong wind effect on hair / clothes / particles,\ndynamic motion blur on lightweight elements, dust or leaves airborne,\nclear but kinetic atmosphere, movement energy throughout",
      hazy:
        "atmospheric haze, reduced contrast in distance,\nwarm diffused light scattering, soft glowing air,\nlayered depth with progressive fade, dreamy summer heat",
    },
  },

  cameraAngle: {
    label: "Camera Angle",
    options: {
      "eye level":
        "camera at natural eye level, direct neutral perspective,\nrelatable human viewpoint, no dramatic distortion,\nstraightforward honest composition",
      "low angle":
        "extreme low-angle shot looking upward,\ndramatic imposing perspective, subject appears powerful / towering,\nsky visible behind, foreshortened vertical lines, heroic framing",
      "high angle":
        "high-angle shot looking downward on subject,\nsubject appears smaller / vulnerable, ground plane visible,\nenvironmental context from above, surveillance-like perspective",
      "bird's eye":
        "bird's eye aerial view, directly overhead looking straight down,\ntop-down flat composition, map-like perspective,\npatterns and layouts visible, abstract geometric quality",
      "worm's eye":
        "extreme worm's eye view from ground level,\nlooking straight up, massive scale distortion,\narchitecture towering, dramatic converging vertical lines",
      "dutch angle":
        "dutch angle tilted camera, diagonal horizon line,\nunsettling disorientation, tension and unease,\ndynamic diagonal composition, psychological disturbance",
      "over the shoulder":
        "over-the-shoulder framing, foreground shoulder/head partially visible,\ndepth layering, voyeuristic intimate perspective,\nconversational context, subject framed in remaining space",
      "close-up":
        "extreme close-up shot, face or detail filling entire frame,\nintimate proximity, every texture and pore visible,\nshallow depth of field, intense personal connection, macro detail",
    },
  },

  cameraLens: {
    label: "Camera Lens",
    options: {
      "wide angle":
        "wide angle lens 24mm, expanded field of view,\nenvironmental context included, barrel distortion at edges,\nexaggerated perspective depth, foreground elements prominent",
      standard:
        "standard 50mm lens, natural human-eye perspective,\nno distortion, neutral compression, balanced composition,\nclassic focal length, honest representation",
      telephoto:
        "telephoto lens 135mm+, compressed flat perspective,\nbackground pulled close, shallow depth of field,\nsubject isolated from blurred surroundings, paparazzi / surveillance feel",
      macro:
        "macro lens extreme close-up, tiny details magnified,\nultra-shallow depth of field (millimeters), texture revelation,\nabstract quality at micro scale, scientific precision",
      fisheye:
        "fisheye lens extreme barrel distortion, 180-degree field of view,\ncurved horizon line, warped edges, surreal spherical perspective,\naction camera / skate video aesthetic",
      "tilt-shift":
        "tilt-shift lens selective focus plane, miniature / diorama effect,\nsharp band of focus with extreme blur above and below,\ntoy-like appearance, architectural perspective correction",
    },
  },

  mood: {
    label: "Mood",
    options: {
      peaceful:
        "peaceful serene atmosphere, calm balanced composition,\nsoft muted harmonious colors, gentle light, still air,\nmeditative quality, visual quietness, restful energy",
      tense:
        "tense uneasy atmosphere, tight claustrophobic framing,\nhigh contrast harsh shadows, desaturated cold tones,\nvisual discomfort, something-wrong energy, edge-of-seat feeling",
      mysterious:
        "mysterious enigmatic atmosphere, obscured details,\nfog or shadow hiding information, questions unanswered,\ndark muted palette with selective reveals, intrigue and curiosity",
      joyful:
        "joyful vibrant energy, bright warm saturated colors,\nopen expansive composition, dynamic movement,\nnatural smiles and laughter, celebration feeling, infectious positivity",
      melancholic:
        "melancholic wistful atmosphere, desaturated blue-grey tones,\nlonely isolated framing, rain or overcast implied,\nquiet sadness, nostalgia, bittersweet beauty in sorrow",
      epic:
        "epic grand scale atmosphere, vast sweeping composition,\ndramatic lighting with god rays, heroic proportions,\norchestral energy, awe-inspiring magnitude, legendary moment",
      romantic:
        "romantic intimate atmosphere, warm soft golden light,\nclose personal framing, bokeh background sparkle,\ngentle color palette (blush / rose / amber), tender connection",
      eerie:
        "eerie unsettling atmosphere, wrong-feeling stillness,\nunnatural color cast (green / sickly yellow), abandoned emptiness,\nbarely-visible shapes in shadows, horror-adjacent discomfort",
    },
  },
} as const;

export type SceneCategory = keyof typeof SCENE_OPTIONS;

/** Compose selected options into a full scene prompt block. */
export function composeScenePrompt(selections: Record<string, string>): string {
  const blocks: string[] = [];

  for (const [key, config] of Object.entries(SCENE_OPTIONS)) {
    const selected = selections[key];
    if (!selected) continue;
    const prompt = (config.options as Record<string, string>)[selected];
    if (prompt) blocks.push(prompt);
  }

  return blocks.join("\n\n");
}
