// Groq AI integration - real LLM responses
import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
let client: Groq | null = null;

function getClient(): Groq | null {
  if (!apiKey) return null;
  if (!client) {
    console.log("[Groq] Initializing client with key:", apiKey.slice(0, 10) + "...");
    client = new Groq({ apiKey });
  }
  return client;
}

const SYSTEM_PROMPTS = {
  comment: `أنت مساعد ذكي في تطبيق zivv للتواصل الاجتماعي. مهمتك كتابة تعليقات قصيرة وطبيعية بالعربية على منشورات المستخدمين.
- اكتب تعليقاً واحداً قصيراً (5-15 كلمة) مناسب للمنشور
- استخدم إيموجي واحد على الأكثر
- اجعل التعليق طبيعياً ودافئاً
- لا تذكر أنك AI
- أمثلة: "منشور رائع، شكراً للمشاركة! 🌟" أو "كلماتك تلامس القلب ❤️"`,

  enhance: (style: string, text: string) => {
    const stylePrompts: Record<string, string> = {
      poetic: `أعد صياغة النص التالي بأسلوب شعري عربي رصين مع الحفاظ على المعنى الأصلي. أضف قليلاً من الجمال اللغوي دون مبالغة. اجعله 1-3 جمل فقط. النص: "${text}"`,
      professional: `أعد صياغة النص التالي بأسلوب احترافي رسمي مختصر. اجعله واضحاً ومباشراً ومناسباً لبيئة العمل. 1-3 جمل. النص: "${text}"`,
      friendly: `أعد صياغة النص التالي بأسلوب ودي دافئ وقريب من القلب. اجعله طبيعياً وغير متكلف. 1-3 جمل. النص: "${text}"`,
      short: `اختصر النص التالي إلى جملة واحدة قوية ومؤثرة. حافظ على الفكرة الأساسية. النص: "${text}"`,
    };
    return stylePrompts[style] || stylePrompts.poetic;
  },

  search: (query: string) => `أجب على السؤال التالي إجابة دقيقة وموجزة بالعربية. إذا كان الموضوع تقنياً أو علمياً، اشرحه بوضوح. 2-4 جمل. السؤال: "${query}"`,

  chat: `أنت MiniMax، مساعد ذكي ودود في تطبيق zivv للتواصل الاجتماعي. تتحدث بالعربية بشكل طبيعي وودود. تساعد المستخدمين في أي سؤال: معلومات، نصائح، أفكار إبداعية، تلخيص، ترجمة، إلخ.

قواعد:
- ردود مختصرة وطبيعية (1-4 جمل عادة)
- استخدم إيموجي بشكل معتدل
- لا تذكر أنك AI إلا إذا سُئلت مباشرة
- كن ودوداً ومشجعاً
- إذا كان السؤال معقداً، قدم إجابة منظمة`,

  reply: (context: string) => `أنت MiniMax، مساعد ذكي في محادثة. رد على الرسالة التالية بشكل طبيعي وودود. اعط نصيحة أو تعليق مفيد. 1-2 جمل. الرسالة: "${context}"`,
};

export async function groqChat(userMessage: string, history: { role: "user" | "ai"; text: string }[] = []): Promise<string> {
  const c = getClient();
  if (!c) return aiChatReplyFallback(userMessage);

  try {
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPTS.chat },
    ];
    // Last 6 messages for context
    const recent = history.slice(-6);
    for (const m of recent) {
      messages.push({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      });
    }
    messages.push({ role: "user", content: userMessage });

    const res = await c.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });
    return res.choices[0]?.message?.content?.trim() || aiChatReplyFallback(userMessage);
  } catch (err) {
    console.error("Groq chat error:", err);
    return aiChatReplyFallback(userMessage);
  }
}

export async function groqSuggestComment(postContent: string): Promise<string> {
  const c = getClient();
  if (!c) return aiSuggestCommentFallback();

  try {
    const res = await c.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.comment },
        { role: "user", content: `اكتب تعليقاً على هذا المنشور: "${postContent}"` },
      ],
      temperature: 0.9,
      max_tokens: 60,
    });
    return res.choices[0]?.message?.content?.trim() || aiSuggestCommentFallback();
  } catch (err) {
    console.error("Groq comment error:", err);
    return aiSuggestCommentFallback();
  }
}

export async function groqEnhanceText(text: string, style: string = "poetic"): Promise<string> {
  const c = getClient();
  if (!c) return aiImproveTextFallback(text, style);

  try {
    const res = await c.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.enhance(style, text) },
        { role: "user", content: text },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    return res.choices[0]?.message?.content?.trim() || aiImproveTextFallback(text, style);
  } catch (err) {
    console.error("Groq enhance error:", err);
    return aiImproveTextFallback(text, style);
  }
}

export async function groqSearch(query: string): Promise<string> {
  const c = getClient();
  if (!c) return aiSearchFallback(query);

  try {
    const res = await c.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.search(query) },
        { role: "user", content: query },
      ],
      temperature: 0.5,
      max_tokens: 250,
    });
    return res.choices[0]?.message?.content?.trim() || aiSearchFallback(query);
  } catch (err) {
    console.error("Groq search error:", err);
    return aiSearchFallback(query);
  }
}

export async function groqChatReply(message: string, context?: string): Promise<string> {
  const c = getClient();
  if (!c) return aiChatReplyFallback(message);

  try {
    const res = await c.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.reply(context || message) },
        { role: "user", content: message },
      ],
      temperature: 0.8,
      max_tokens: 100,
    });
    return res.choices[0]?.message?.content?.trim() || aiChatReplyFallback(message);
  } catch (err) {
    console.error("Groq reply error:", err);
    return aiChatReplyFallback(message);
  }
}

// === Fallback functions (used when API key missing or error) ===

const COMMENT_FALLBACK = [
  "✨ منشور رائع، شكراً للمشاركة!",
  "كلمات جميلة تلامس القلب 💜",
  "أحببت هذا، أحسنت! 👏",
  "محتوى مميز كالعادة 🌟",
  "شكراً لك، نتعلم منك دائماً",
];

const REPLY_FALLBACK = [
  "فكرة رائعة! 😊",
  "أحب هذا النقاش، أخبرني المزيد!",
  "نقطة مهمة، شكراً لمشاركتها",
  "أتطلع لمعرفة المزيد عن رأيك!",
  "💡 هذا يفتح آفاقاً جديدة",
];

const SEARCH_FALLBACK: Record<string, string> = {
  "الذكاء الاصطناعي": "الذكاء الاصطناعي (AI) هو فرع من علوم الحاسوب يهدف إلى بناء أنظمة قادرة على محاكاة القدرات الذهنية البشرية مثل التعلم والاستنتاج وحل المشكلات. يُستخدم اليوم في الطب، التعليم، الصناعة، والترفيه.",
  "موسيقى": "الموسيقى فنٌّ يجمع بين الإيقاع واللحن والهارموني لإثارة المشاعر والتعبير عن الأفكار. تُعدّ من أقدم أشكال التعبير الإنساني.",
  "فضاء": "الفضاء الخارجي هو الفراغ الشاسع الذي يقع خارج الغلاف الجوي للأرض، ويضم مليارات المجرات والنجوم والكواكب.",
  "تعليم": "التعليم عملية نقل المعرفة والمهارات والقيم، وهو الركيزة الأساسية لتقدم المجتمعات.",
  "صحة": "الصحة هي حالة العافية الجسدية والنفسية والاجتماعية الكاملة.",
  "برمجة": "البرمجة فن كتابة تعليمات للحاسوب بلغات مثل Python وJavaScript لبناء تطبيقات ومواقع.",
  "فن": "الفن تعبير إبداعي عن الأفكار والمشاعر من خلال الرسم والموسيقى والأدب والسينما.",
};

function aiChatReplyFallback(msg: string): string {
  return REPLY_FALLBACK[Math.floor(Math.random() * REPLY_FALLBACK.length)];
}

function aiSuggestCommentFallback(): string {
  return COMMENT_FALLBACK[Math.floor(Math.random() * COMMENT_FALLBACK.length)];
}

function aiImproveTextFallback(text: string, style: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (style === "short") return trimmed.split("\n")[0].slice(0, 120);
  if (style === "professional") return `${trimmed} — يسعدني التفاعل معكم.`;
  if (style === "friendly") return `${trimmed} 😊\nما رأيكم؟ شاركوني تجاربكم!`;
  return `🌸 ${trimmed}\n\nفي كل كلمةٍ من كلماتك نبضٌ من القلب.`;
}

function aiSearchFallback(query: string): string {
  const q = query.trim().toLowerCase();
  for (const key of Object.keys(SEARCH_FALLBACK)) {
    if (q.includes(key.toLowerCase())) return SEARCH_FALLBACK[key] + "\n\n📚 المصدر: قاعدة المعرفة zivv";
  }
  return `🔍 نتائج البحث عن: "${query}"\n\nلم أجد معلومة مطابقة بالضبط. جرّب كلمات أبسط أو مختلفة.`;
}
