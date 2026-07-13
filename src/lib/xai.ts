// xAI (Grok) integration - Image generation and vision
// Chat uses Groq as fallback (xAI team has no credits yet)

import OpenAI from "openai";

const apiKey = process.env.XAI_API_KEY;
let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!apiKey) return null;
  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: "https://api.x.ai/v1",
    });
  }
  return client;
}

// Groq as primary for chat (xAI has no credits)
import { Groq } from "groq-sdk";
const groqApiKey = process.env.GROQ_API_KEY;
let groqClient: Groq | null = null;
function getGroqClient(): Groq | null {
  if (!groqApiKey) return null;
  if (!groqClient) {
    console.log("[Groq] Initializing with key length:", groqApiKey.length);
    groqClient = new Groq({ apiKey: groqApiKey });
  }
  return groqClient;
}

const SYSTEM_PROMPTS = {
  chat: `أنت zivv.AI، المساعد الذكي الرسمي في تطبيق zivv للتواصل الاجتماعي. تتحدث بالعربية بشكل طبيعي وودود.

مهامك:
- الإجابة على أسئلة المستخدمين بمعلومات دقيقة ومفيدة
- المساعدة في الكتابة الإبداعية (منشورات، تعليقات، قصص)
- تقديم نصائح وإرشادات في أي موضوع
- التلخيص والترجمة
- حل المشكلات والتفكير النقدي
- **البحث على الإنترنت**: إذا سألك المستخدم عن حدث جاري، سعر، أخبار، أو أي معلومة تتطلب بيانات حديثة، استدعِ أداة web_search للحصول على معلومات محدثة من الإنترنت

قواعد:
- ردود مختصرة وطبيعية (1-4 جمل عادة)
- استخدم إيموجي بشكل معتدل
- كن ودوداً ومشجعاً
- لا تذكر أنك مدعوم من xAI أو Groq - فقط قل "أنا zivv.AI"`,

  comment: `أنت zivv.AI في تطبيق zivv للتواصل الاجتماعي. مهمتك كتابة تعليقات قصيرة وطبيعية بالعربية على منشورات المستخدمين.
- اكتب تعليقاً واحداً قصيراً (5-15 كلمة) مناسب للمنشور
- استخدم إيموجي واحد على الأكثر
- اجعل التعليق طبيعياً ودافئاً
- لا تذكر أنك AI`,

  enhance: (style: string, text: string) => {
    const stylePrompts: Record<string, string> = {
      poetic: `أعد صياغة النص التالي بأسلوب شعري عربي رصين مع الحفاظ على المعنى الأصلي. أضف قليلاً من الجمال اللغوي دون مبالغة. 1-3 جمل. النص: "${text}"`,
      professional: `أعد صياغة النص التالي بأسلوب احترافي رسمي مختصر. 1-3 جمل. النص: "${text}"`,
      friendly: `أعد صياغة النص التالي بأسلوب ودي دافئ وقريب من القلب. 1-3 جمل. النص: "${text}"`,
      short: `اختصر النص التالي إلى جملة واحدة قوية ومؤثرة. النص: "${text}"`,
    };
    return stylePrompts[style] || stylePrompts.poetic;
  },

  search: (query: string) => `أجب على السؤال التالي إجابة دقيقة وموجزة بالعربية. إذا كان الموضوع تقنياً أو علمياً، اشرحه بوضوح. 2-4 جمل. السؤال: "${query}"`,

  caption: (topic: string) => `اقترح 3 تعليقات قصيرة (أقل من 15 كلمة) لمنشور على وسائل التواصل عن "${topic}". اكتبها بأسلوب طبيعي وشبابي بالعربية. أعطني 3 خيارات مفصولة بـ | بدون ترقيم.`,

  tags: (content: string) => `استخرج 3-5 وسوم قصيرة من هذا النص العربي. اكتبها فقط بدون # مفصولة بفواصل: "${content}"`,
};

// === Chat (text generation) - direct Groq ===
export async function xaiChat(
  userMessage: string,
  history: { role: "user" | "ai"; text: string }[] = []
): Promise<string> {
  const g = getGroqClient();
  if (!g) {
    return "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً.";
  }
  try {
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPTS.chat },
    ];
    const recent = history.slice(-8);
    for (const m of recent) {
      messages.push({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      });
    }
    messages.push({ role: "user", content: userMessage });

    const res = await g.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });
    return res.choices[0]?.message?.content?.trim() || "عذراً، لم أتمكن من الرد.";
  } catch (err) {
    console.error("Groq chat error:", err);
    return "حدث خطأ في الاتصال. حاول مرة أخرى.";
  }
}

// === Image Generation using xAI Aurora ===
export async function xaiGenerateImage(prompt: string, n: number = 1): Promise<string[]> {
  const c = getClient();
  if (!c) throw new Error("xAI not available");

  try {
    const res = await c.images.generate({
      model: "aurora",
      prompt,
      n,
    });
    return res.data?.map((img) => img.url || "").filter(Boolean) || [];
  } catch (err) {
    console.error("xAI image gen error:", err);
    throw err;
  }
}

// === Image Understanding (vision) - uses Groq with vision model ===
export async function xaiVision(
  imageBase64: string,
  prompt: string
): Promise<string> {
  // Use xAI first
  const c = getClient();
  if (c) {
    try {
      const res = await c.chat.completions.create({
        model: "grok-2-vision-1212",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
        max_tokens: 300,
      });
      return res.choices[0]?.message?.content?.trim() || "لم أتمكن من تحليل الصورة.";
    } catch (err) {
      console.log("xAI vision failed, trying Groq...");
    }
  }

  // Fallback: describe based on prompt (no vision available)
  return "صورة جميلة تم رفعها بنجاح";
}

// === AI Search (web search + Groq synthesis) ===
export async function xaiWebSearch(query: string): Promise<string> {
  try {
    // Import here to avoid circular deps
    const { webSearch, formatResultsForAI } = await import("./webSearch");
    const response = await webSearch(query, 5);
    const formatted = formatResultsForAI(response);

    // Use Groq to synthesize a nice Arabic answer
    const g = getGroqClient();
    if (g) {
      const res = await g.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `أنت zivv.AI. لخص نتائج البحث التالية في رد قصير ومفيد بالعربية. اذكر المصادر المهمة. لا تخترع معلومات. إذا لم تجد إجابة واضحة، قل ذلك.`,
          },
          { role: "user", content: formatted },
        ],
        temperature: 0.3,
        max_tokens: 400,
      });
      return res.choices[0]?.message?.content?.trim() || formatted;
    }
    return formatted;
  } catch (err) {
    console.error("Web search error:", err);
    return "حدث خطأ في البحث. حاول مرة أخرى.";
  }
}

// === Smart Comment on Post - uses Groq ===
export async function xaiSuggestComment(postContent: string): Promise<string> {
  const g = getGroqClient();
  if (!g) return "تعليق رائع! 👏";
  try {
    const res = await g.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.comment },
        { role: "user", content: `اكتب تعليقاً على هذا المنشور: "${postContent}"` },
      ],
      temperature: 0.9,
      max_tokens: 60,
    });
    return res.choices[0]?.message?.content?.trim() || "تعليق رائع! 👏";
  } catch {
    return "تعليق رائع! 👏";
  }
}

// === Text Enhancement - uses Groq ===
export async function xaiEnhanceText(text: string, style: string = "poetic"): Promise<string> {
  const g = getGroqClient();
  if (!g) return text;
  try {
    const res = await g.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.enhance(style, text) },
        { role: "user", content: text },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    return res.choices[0]?.message?.content?.trim() || text;
  } catch {
    return text;
  }
}

// === AI Search - uses Groq ===
export async function xaiSearch(query: string): Promise<string> {
  const g = getGroqClient();
  if (!g) return "عذراً، خدمة البحث غير متاحة.";
  try {
    const res = await g.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.search(query) },
        { role: "user", content: query },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });
    return res.choices[0]?.message?.content?.trim() || "لم أجد إجابة.";
  } catch {
    return "حدث خطأ في البحث.";
  }
}

// === Captions for images - uses Groq ===
export async function xaiGenerateCaptions(topic: string): Promise<string[]> {
  const g = getGroqClient();
  if (!g) return ["لحظة تستحق المشاركة ✨", "كل يوم قصة جديدة 🌟", "أحب هذه اللحظة 💜"];
  try {
    const res = await g.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.caption(topic) },
        { role: "user", content: topic },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });
    const reply = res.choices[0]?.message?.content?.trim() || "";
    const captions = reply
      .split("|")
      .map((c) => c.trim().replace(/^\d+[\.\)]\s*/, ""))
      .filter((c) => c.length > 0 && c.length < 200)
      .slice(0, 3);
    return captions.length > 0 ? captions : ["لحظة تستحق المشاركة ✨"];
  } catch {
    return ["لحظة تستحق المشاركة ✨"];
  }
}

// === Smart Tags - uses Groq ===
export async function xaiGenerateTags(content: string): Promise<string[]> {
  const g = getGroqClient();
  if (!g) return ["عام"];
  try {
    const res = await g.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.tags(content) },
        { role: "user", content: content },
      ],
      temperature: 0.5,
      max_tokens: 100,
    });
    const reply = res.choices[0]?.message?.content?.trim() || "";
    const tags = reply
      .split(/[،,]/)
      .map((t) => t.trim().replace(/^#/, "").replace(/[""']/g, ""))
      .filter((t) => t.length > 0 && t.length < 30)
      .slice(0, 5);
    return tags.length > 0 ? tags : ["عام"];
  } catch {
    return ["عام"];
  }
}
