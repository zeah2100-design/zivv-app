// Image generation using xAI Aurora (Grok) as primary
// Pollinations.ai as fallback (free, no API key)
// All UI shows "zivv.AI" branding

import { xaiGenerateImage } from "./xai";

export type ImageModel = "grok" | "grok-fast" | "grok-anime" | "grok-art" | "grok-photo";

export const IMAGE_MODELS: Record<ImageModel, {
  name: string;
  emoji: string;
  description: string;
  estimatedTime: string;
  promptSuffix: string;
}> = {
  grok: {
    name: "Grok Pro",
    emoji: "✨",
    description: "الأعلى جودة - xAI Aurora",
    estimatedTime: "5-10 ثوان",
    promptSuffix: "",
  },
  "grok-fast": {
    name: "Grok السريع",
    emoji: "⚡",
    description: "سريع جداً - للتجارب",
    estimatedTime: "3-5 ثوان",
    promptSuffix: ", quick sketch, minimal details, fast render",
  },
  "grok-anime": {
    name: "Grok أنمي",
    emoji: "🎭",
    description: "أسلوب أنمي ياباني احترافي",
    estimatedTime: "5-8 ثوان",
    promptSuffix: ", anime style, studio ghibli inspired, beautiful detailed anime art",
  },
  "grok-art": {
    name: "Grok الفني",
    emoji: "🎨",
    description: "أسلوب فني تشكيلي",
    estimatedTime: "5-8 ثوان",
    promptSuffix: ", artistic oil painting style, masterpiece, artstation, vivid colors",
  },
  "grok-photo": {
    name: "Grok الواقعي",
    emoji: "📸",
    description: "واقعي جداً - DSLR",
    estimatedTime: "6-10 ثوان",
    promptSuffix: ", photorealistic, ultra detailed, 8k, professional photography, sharp focus",
  },
};

export type ImageGenOptions = {
  prompt: string;
  model?: ImageModel;
};

// Generate image from prompt using xAI Aurora (Grok)
export async function generateImage(opts: ImageGenOptions): Promise<string> {
  const { prompt, model = "grok" } = opts;
  const config = IMAGE_MODELS[model];
  const finalPrompt = prompt + config.promptSuffix;

  // Try xAI Aurora (Grok) first
  try {
    console.log("[Grok Aurora] Generating image:", finalPrompt);
    const urls = await xaiGenerateImage(finalPrompt);
    if (urls.length > 0 && urls[0]) {
      const res = await fetch(urls[0]);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const contentType = res.headers.get("content-type") || "image/jpeg";
        return `data:${contentType};base64,${base64}`;
      }
    }
  } catch (err) {
    console.log("[Grok Aurora] Failed, falling back to Pollinations:", err);
  }

  // Fallback to Pollinations (free, no key)
  return await generateWithPollinations(finalPrompt);
}

// Pollinations fallback (always works)
async function generateWithPollinations(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    width: "1024",
    height: "1024",
    model: "flux",
    nologo: "true",
    enhance: "true",
  });
  const url = `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Accept": "image/*" },
  });

  if (!res.ok) throw new Error("Image generation failed");

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return `data:${contentType};base64,${base64}`;
}
