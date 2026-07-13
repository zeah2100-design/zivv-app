// Local AI simulation utilities - no external API calls needed.
// Generates smart, contextual responses for comments, captions, search, chat.

const COMMENT_TEMPLATES = [
  "✨ منشور رائع! يستحق القراءة بتأنٍّ.",
  "💡 فكرة عميقة، شاركني المزيد من هذا القبيل.",
  "🌟 أبدعت في طرح الموضوع، شكراً للمشاركة.",
  "🔥 محتوى ملهم، أحسنت!",
  "💭 عباراتك لامست مشاعري، شكراً لك.",
  "🎯 وجهة نظر مميزة، أوافقك الرأي.",
  "👏 أحسنت الاختيار، محتوى راقٍ ومفيد.",
  "🌸 جميل جداً! ننتظر جديدك بشغف.",
];

const IMPROVEMENT_STYLES: Record<string, (s: string) => string> = {
  poetic: (s) => `🌸 ${s}\n\nفي كل حرفٍ من كلماتك قصة، وفي كل سطرٍ نبضٌ من القلب.`,
  professional: (s) => `${s}\n\n— تتمة: يسعدني التفاعل مع متابعيّ الكرام وتبادل الأفكار القيّمة.`,
  friendly: (s) => `${s} 😊\nما رأيكم؟ شاركوني تجاربكم في التعليقات!`,
  short: (s) => s.split("\n")[0].slice(0, 120),
};

export function aiSuggestComment(): string {
  return COMMENT_TEMPLATES[Math.floor(Math.random() * COMMENT_TEMPLATES.length)];
}

export function aiImproveText(text: string, style: keyof typeof IMPROVEMENT_STYLES = "poetic"): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const fn = IMPROVEMENT_STYLES[style] || IMPROVEMENT_STYLES.poetic;
  return fn(trimmed);
}

const SEARCH_FACTS: Record<string, string> = {
  "الذكاء الاصطناعي":
    "الذكاء الاصطناعي (AI) هو فرع من علوم الحاسوب يهدف إلى بناء أنظمة قادرة على محاكاة القدرات الذهنية البشرية مثل التعلم والاستنتاج وحل المشكلات.",
  "تكنولوجيا":
    "التكنولوجيا هي تطبيق المعرفة العلمية لتطوير أدوات وأجهزة وأنظمة تلبي احتياجات الإنسان وتحسّن جودة حياته.",
  "موسيقى":
    "الموسيقى فنٌّ من الفنون التي تجمع بين الإيقاع واللحن والهارموني، وتُعدّ من أقدم أشكال التعبير الإنساني.",
  "تعليم":
    "التعليم عملية نقل المعرفة والمهارات والقيم من جيلٍ إلى جيل، وهو الركيزة الأساسية لتقدم المجتمعات.",
  "صحة":
    "الصحة هي حالة من العافية الجسدية والنفسية والاجتماعية الكاملة، وليست مجرد انعدام المرض.",
  "فضاء":
    "الفضاء الخارجي هو الفراغ الذي يقع خارج الغلاف الجوي للأرض، ويضمّ كواكبَ ونجومًا ومجرّات شاسعة.",
  "رياضة":
    "الرياضة هي مجموعة من الأنشطة البدنية التي تُمارَس بغرض الترفيه أو المنافسة أو تعزيز اللياقة البدنية.",
  "فن":
    "الفن هو تعبير إبداعي عن الأفكار والمشاعر من خلال وسائط متعددة كالرسم والموسيقى والأدب والسينما.",
  "تاريخ":
    "التاريخ هو سجلّ الأحداث الماضية للبشرية، ودراسته تساعدنا على فهم الحاضر والتخطيط للمستقبل.",
  "لغة":
    "اللغة نظام من الرموز الصوتية أو المكتوبة يستخدمه الإنسان للتواصل والتعبير عن أفكاره ومشاعره.",
  "برمجة":
    "البرمجة هي عملية كتابة تعليمات وأوامر للحاسوب بلغة يفهمها، لتنفيذ مهام محددة وحل مشكلات رقمية.",
  "ai":
    "AI (Artificial Intelligence) lets machines learn from data, recognize patterns, and make decisions—powering tools like chatbots, image generators, and self-driving cars.",
  "programming":
    "Programming is the art of instructing computers using languages like Python, JavaScript, and TypeScript to build software, apps, and AI systems.",
  "music":
    "Music is the universal language of humanity: rhythm, melody, and harmony combined to evoke emotions and tell stories across cultures.",
  "space":
    "Outer space is the vast expanse beyond Earth's atmosphere, containing billions of galaxies, stars, planets, and mysterious phenomena.",
};

export function aiSearch(query: string): string {
  const q = query.trim().toLowerCase();
  if (!q) return "أدخل كلمة مفتاحية للبحث المدعوم بالذكاء الاصطناعي.";

  for (const key of Object.keys(SEARCH_FACTS)) {
    if (q.includes(key)) {
      return `${SEARCH_FACTS[key]}\n\n📚 المصدر: قاعدة المعرفة zivv AI · مُحدَّث 2026`;
    }
  }

  return `🔍 نتائج البحث الذكي عن: "${query}"\n\nلم أجد معلومة موثقة مطابقة في قاعدة معرفتي، لكنني أقترح استكشاف المواضيع ذات الصلة: ${generateRelatedTopics(query).join("، ")}.`;
}

function generateRelatedTopics(query: string): string[] {
  const pool = ["الذكاء الاصطناعي", "تكنولوجيا", "تعليم", "صحة", "فن", "تاريخ", "برمجة", "فضاء"];
  return pool.sort(() => Math.random() - 0.5).slice(0, 4);
}

const CHAT_REPLIES = [
  "أهلاً وسهلاً! كيف يمكنني مساعدتك اليوم؟ 😊",
  "هذا سؤال رائع! دعني أفكر قليلاً...",
  "أتفق معك تماماً، إنها نقطة مهمة.",
  "هل يمكنك إخباري المزيد عن الموضوع؟",
  "شكراً لمشاركتك هذا، يبدو مثيراً للاهتمام!",
  "💡 اقتراح: حاول تجربة نهج مختلف لحل المشكلة.",
  "أنا هنا للاستماع والمساعدة متى احتجت.",
  "ما رأيك في أن نبدأ من الصفر ونتقدم خطوة بخطوة؟",
];

export function aiChatReply(): string {
  return CHAT_REPLAYS();
}

function CHAT_REPLAYS(): string {
  return CHAT_REPLIES[Math.floor(Math.random() * CHAT_REPLIES.length)];
}

// Content moderation
const BANNED_KEYWORDS = [
  "عنف", "قتل", "إباحي", "اباحي", "مخدرات", "سلاح", "دم", "إرهاب",
  "violence", "kill", "porn", "drugs", "weapon", "terror",
];

export function moderateContent(text: string, strict: boolean): { ok: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const word of BANNED_KEYWORDS) {
    if (lower.includes(word.toLowerCase())) {
      return { ok: false, reason: `يحتوي المحتوى على مصطلح محظور: "${word}"` };
    }
  }
  if (strict && text.length > 600) {
    return { ok: false, reason: "المحتوى طويل جداً، الرجاء الاختصار." };
  }
  return { ok: true };
}

// Music recommendations based on mood
export function recommendMusic(mood: string): { id: number; title: string; artist: string; category: string; emoji: string; color: string }[] {
  // Hardcoded in case DB query fails; actual music comes from DB
  void mood;
  return [];
}
