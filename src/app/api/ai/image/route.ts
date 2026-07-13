import { NextRequest } from "next/server";
import { generateImage, ImageModel } from "@/lib/imageGen";
import { getCurrentUser } from "@/db/auth-server";
import { moderateContent } from "@/lib/ai";
import { xaiVision } from "@/lib/xai";

// Map keywords to our filter names
const KEYWORD_TO_FILTER: Record<string, string> = {
  // أبيض وأسود
  "أبيض وأسود": "أبيض وأسود",
  "ابيض واسود": "أبيض وأسود",
  "رمادي": "أبيض وأسود",
  "grayscale": "أبيض وأسود",
  "black": "أبيض وأسود",
  // سيبيا
  "سيبيا": "سيبيا",
  "sepia": "سيبيا",
  "بني قديم": "سيبيا",
  // Vintage
  "vintage": "Vintage",
  "قديم": "Vintage",
  "كلاسيك": "Vintage",
  "retro": "Vintage",
  // Cool
  "بارد": "بارد",
  "أزرق": "بارد",
  "ثلج": "بارد",
  "cool": "بارد",
  // Warm
  "دافئ": "دافئ",
  "برتقالي": "دافئ",
  "غروب": "دافئ",
  "warm": "دافئ",
  "sunset": "دافئ",
  // Bright
  "مشرق": "مشرق",
  "ساطع": "مشرق",
  "bright": "مشرق",
  // Dark
  "داكن": "داكن",
  "ليلي": "أزرق ليلي",
  "ليل": "أزرق ليلي",
  "dark": "داكن",
  "night": "أزرق ليلي",
  // High contrast
  "تباين": "تباين عالي",
  "جريء": "تباين عالي",
  "dramatic": "تباين عالي",
  // Blur
  "ضباب": "ضبابي",
  "blurry": "ضبابي",
  // Anime
  "أنمي": "ألوان مائية",
  "كرتون": "ألوان مائية",
  "anime": "ألوان مائية",
  // Watercolor
  "مائي": "ألوان مائية",
  "لوحة": "ألوان مائية",
  "رسم": "ألوان مائية",
  "painting": "ألوان مائية",
  "watercolor": "ألوان مائية",
  // Pencil
  "قلم": "قلم رصاص",
  "رصاص": "قلم رصاص",
  "sketch": "قلم رصاص",
  "pencil": "قلم رصاص",
  // Portrait
  "بورتريه": "بورتريه",
  "portrait": "بورتريه",
  "شخصي": "بورتريه",
  "وجه": "بورتريه",
  // Pink
  "وردي": "وردي",
  "pink": "وردي",
  "rose": "وردي",
  // Brown
  "بني": "بني داكن",
  "قهوة": "بني داكن",
  "brown": "بني داكن",
  "coffee": "بني داكن",
  // Olive
  "زيتوني": "زيتوني",
  "olive": "زيتوني",
  // Neon
  "نيون": "نيون",
  "neon": "نيون",
  // Invert
  "عكس": "إنفيرس",
  "معكوس": "إنفيرس",
  "negative": "إنفيرس",
  // Sharp
  "حاد": "حاد",
  "تفاصيل": "حاد",
  "sharp": "حاد",
};

function detectFilterFromText(text: string): string | null {
  const t = text.toLowerCase();
  for (const [key, filter] of Object.entries(KEYWORD_TO_FILTER)) {
    if (t.includes(key.toLowerCase())) return filter;
  }
  return null;
}

// Analyze image colors server-side to suggest a filter
async function analyzeImageColors(base64: string): Promise<string> {
  // Decode base64 to buffer
  const buffer = Buffer.from(base64, "base64");

  // Use sharp if available, otherwise simple sampling
  try {
    // Try using sharp
    const sharp = require("sharp");
    const img = sharp(buffer);
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

    let totalR = 0, totalG = 0, totalB = 0;
    let count = 0;
    // Sample every 50 pixels
    for (let i = 0; i < data.length; i += 50 * info.channels) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
      count++;
    }
    const avgR = totalR / count;
    const avgG = totalG / count;
    const avgB = totalB / count;
    const brightness = (avgR + avgG + avgB) / 3;
    const warmth = (avgR - avgB) / 255;

    // Smart filter selection
    if (brightness < 70) {
      return warmth > 0.1 ? "بني داكن" : "أزرق ليلي";
    }
    if (brightness < 100) {
      return warmth > 0.15 ? "دافئ" : "بارد";
    }
    if (brightness > 200) {
      return "مشرق";
    }
    if (Math.abs(avgR - avgG) < 15 && Math.abs(avgG - avgB) < 15) {
      // grayscale-ish
      return "أبيض وأسود";
    }
    if (warmth > 0.2) {
      return "Vintage";
    }
    if (warmth < -0.1) {
      return "بارد";
    }
    return "مشرق"; // default
  } catch {
    // Fallback: just return a default
    return "Vintage";
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const action = String(body.action || "generate");
  const model = (body.model as ImageModel) || "flux";

  // Action: analyze image colors and suggest a filter (NO new image generation)
  if (action === "analyze" && body.imageBase64) {
    try {
      // Analyze the image using Canvas-like sampling on the server
      const filter = await analyzeImageColors(String(body.imageBase64));
      return Response.json({ ok: true, filter });
    } catch (err) {
      return Response.json({ ok: false, error: "فشل التحليل" }, { status: 500 });
    }
  }

  // Moderate prompt
  const moderation = moderateContent(String(body.prompt || ""), user.contentFilter ?? true);
  if (!moderation.ok) {
    return Response.json({ error: moderation.reason }, { status: 400 });
  }

  try {
    if (action === "edit") {
      return Response.json(
        { error: "ميزة تعديل الصور متاحة فقط في المحادثات المباشرة. للإنشاء استخدم 'generate'." },
        { status: 400 }
      );
    }
    // default: generate
    const url = await generateImage({
      prompt: String(body.prompt || ""),
      model,
    });
    return Response.json({ ok: true, url, action: "generate", model });
  } catch (err: unknown) {
    console.error("Image gen error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "فشل توليد الصورة" },
      { status: 500 }
    );
  }
}
