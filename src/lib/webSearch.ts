// Web search using Wikipedia API (always works, no key needed)
// + Brave Search free tier as backup

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source?: string;
};

export type WebSearchResponse = {
  query: string;
  results: SearchResult[];
  abstract?: string;
  abstractSource?: string;
  abstractUrl?: string;
  relatedTopics?: string[];
};

// Search Wikipedia - very reliable, always returns data
export async function searchWikipedia(query: string): Promise<WebSearchResponse> {
  const lang = query.match(/[\u0600-\u06FF]/) ? "ar" : "en";
  try {
    // Step 1: Search for relevant Wikipedia articles
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=5&origin=*`;
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "zivv-AI/1.0" },
    });
    if (!searchRes.ok) return empty(query);
    const searchData = await searchRes.json();
    const titles: string[] = (searchData.query?.search || []).map(
      (r: { title: string }) => r.title
    );

    if (titles.length === 0) return empty(query);

    // Step 2: Get extracts of these articles
    const extractUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(titles.join("|"))}&format=json&origin=*`;
    const extractRes = await fetch(extractUrl, {
      headers: { "User-Agent": "zivv-AI/1.0" },
    });
    if (!extractRes.ok) return empty(query);
    const extractData = await extractRes.json();
    const pages = extractData.query?.pages || {};

    const results: SearchResult[] = [];
    let abstract = "";
    let abstractSource = "";
    let abstractUrl = "";

    for (const title of titles) {
      const page = Object.values(pages).find(
        (p) => (p as { title?: string }).title === title
      ) as { extract?: string; pageid?: number } | undefined;

      if (page?.extract) {
        const url = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
        const snippet = page.extract.slice(0, 500);
        results.push({
          title,
          url,
          snippet,
          source: "Wikipedia",
        });
        if (!abstract) {
          abstract = page.extract;
          abstractSource = "Wikipedia";
          abstractUrl = url;
        }
      }
    }

    return {
      query,
      results,
      abstract,
      abstractSource,
      abstractUrl,
      relatedTopics: titles.slice(0, 5),
    };
  } catch (err) {
    console.error("Wikipedia API error:", err);
    return empty(query);
  }
}

function empty(query: string): WebSearchResponse {
  return { query, results: [] };
}

// Main search function
export async function webSearch(query: string, maxResults = 5): Promise<WebSearchResponse> {
  // Try Wikipedia first (always works)
  const wikiResult = await searchWikipedia(query);
  if (wikiResult.results.length > 0) {
    return wikiResult;
  }
  return wikiResult;
}

// Format search results for AI consumption
export function formatResultsForAI(response: WebSearchResponse): string {
  if (response.results.length === 0 && !response.abstract) {
    return `لم أجد معلومات عن "${response.query}". حاول صياغة السؤال بشكل مختلف.`;
  }

  let formatted = `معلومات عن "${response.query}":\n\n`;

  if (response.abstract) {
    formatted += `📝 ${response.abstractSource || "مصدر"}:\n${response.abstract.slice(0, 800)}\n\n`;
  }

  if (response.results.length > 0) {
    formatted += `🔗 مصادر من ${response.abstractSource}:\n`;
    response.results.slice(0, 4).forEach((r, i) => {
      formatted += `${i + 1}. **${r.title}**\n   ${r.snippet}\n   المصدر: ${r.source} - ${r.url}\n\n`;
    });
  }

  return formatted;
}
