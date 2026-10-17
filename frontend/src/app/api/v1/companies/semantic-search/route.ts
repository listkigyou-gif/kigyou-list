import { NextResponse } from "next/server";
import { verifyApiKey, updateApiKeyUsage, searchCompanies, getUserQuota, deductUserQuota } from "@/lib/db";

// Semantic keyword extraction and mapping dictionaries for Japan B2B
const PREFECTURE_MAP: Record<string, string> = {
  "東京": "13", "大阪": "27", "愛知": "23", "神奈川": "14", "福岡": "40",
  "北海道": "01", "兵庫": "28", "京都": "26", "埼玉": "11", "千葉": "12"
};

const INTENT_SIGNALS_MAP: Record<string, string> = {
  "採用": "hiring", "求人": "hiring", "人手不足": "hiring", "エンジニア募集": "hiring",
  "補助金": "subsidy", "助成金": "subsidy", "DX": "subsidy", "IT導入": "subsidy",
  "入札": "bidding", "公共": "bidding", "調達": "bidding"
};

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "IT・Web": ["IT", "システム", "ソフトウェア", "Web", "アプリ", "SaaS", "クラウド"],
  "製造・ものづくり": ["製造", "工場", "機械", "金属", "部品", "加工"],
  "物流・EC": ["物流", "倉庫", "運送", "EC", "通販", "配送"],
  "不動産・建設": ["不動産", "建設", "建築", "リフォーム", "賃貸"],
  "飲食・小売": ["飲食", "レストラン", "小売", "店舗", "フード"]
};

interface SemanticAnalysis {
  detected_prefecture?: string;
  detected_signals: string[];
  matched_industries: string[];
  extracted_keywords: string[];
}

function analyzeSemanticQuery(query: string): SemanticAnalysis {
  let detected_prefecture: string | undefined = undefined;
  for (const [prefName, code] of Object.entries(PREFECTURE_MAP)) {
    if (query.includes(prefName)) {
      detected_prefecture = code;
      break;
    }
  }

  const detected_signals: string[] = [];
  for (const [kw, sig] of Object.entries(INTENT_SIGNALS_MAP)) {
    if (query.includes(kw) && !detected_signals.includes(sig)) {
      detected_signals.push(sig);
    }
  }

  const matched_industries: string[] = [];
  const extracted_keywords: string[] = [];
  for (const [indGroup, kws] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const kw of kws) {
      if (query.includes(kw)) {
        if (!matched_industries.includes(indGroup)) matched_industries.push(indGroup);
        if (!extracted_keywords.includes(kw)) extracted_keywords.push(kw);
      }
    }
  }

  return {
    detected_prefecture,
    detected_signals,
    matched_industries,
    extracted_keywords
  };
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing Bearer Token" }, { status: 401 });
    }

    const rawKey = authHeader.substring(7).trim();
    const verification = await verifyApiKey(rawKey);

    if (!verification) {
      return NextResponse.json({ error: "Unauthorized: Invalid or revoked API Key" }, { status: 401 });
    }

    const { keyInfo, plan } = verification;
    if (plan !== "pro" && plan !== "business" && plan !== "enterprise") {
      return NextResponse.json({
        error: "Forbidden: Semantic Search API is restricted to PRO, BUSINESS or ENTERPRISE plans."
      }, { status: 403 });
    }

    const quota = await getUserQuota(keyInfo.user_email);
    const totalAvailable = Math.max(0, (quota.monthly_base_allowance - quota.monthly_base_used) + quota.purchased_add_on_balance);
    if (totalAvailable <= 0) {
      return NextResponse.json({ 
        error: "Quota Exceeded: Your plan export quota has been exhausted. Please top up credits or upgrade at /pricing." 
      }, { 
        status: 429,
        headers: { "X-Quota-Remaining": "0" }
      });
    }

    const body = await request.json();
    const query = (body.query || "").trim();
    const limit = Math.min(50, Math.max(1, parseInt(body.limit || "10")));

    if (!query) {
      return NextResponse.json({ error: "Bad Request: 'query' text is required." }, { status: 400 });
    }

    // 1. Natural Language Semantic Analysis
    const analysis = analyzeSemanticQuery(query);

    // 2. Build search filters
    const searchKeyword = analysis.extracted_keywords.slice(0, 2).join(" ") || query.slice(0, 10);
    const filters: any = {};
    if (analysis.detected_prefecture) {
      filters.prefecture_code = analysis.detected_prefecture;
    }
    if (analysis.detected_signals.includes("hiring")) {
      filters.has_hiring = true;
    }
    if (analysis.detected_signals.includes("subsidy")) {
      filters.has_subsidy = true;
    }

    // 3. Search Candidate Companies
    const searchResult = await searchCompanies(searchKeyword, filters, limit, 0);

    // 4. Calculate Semantic Relevance Scores
    const rankedCompanies = searchResult.companies.map((comp, idx) => {
      let score = 0.70;
      const reasons: string[] = [];

      if (analysis.detected_prefecture && comp.prefecture_code === analysis.detected_prefecture) {
        score += 0.10;
        reasons.push(`指定地域（${comp.prefecture_name || "対象地域"}）に一致`);
      }
      if (comp.has_hiring && analysis.detected_signals.includes("hiring")) {
        score += 0.10;
        reasons.push("採用強化シグナルあり（事業拡大中）");
      }
      if (comp.has_subsidy && analysis.detected_signals.includes("subsidy")) {
        score += 0.08;
        reasons.push("補助金採択・DX投資シグナルあり");
      }
      if (reasons.length === 0) {
        reasons.push("業界・事業内容のキーワード一致");
      }

      const finalScore = Math.min(0.99, Number(score.toFixed(2)));

      return {
        ...comp,
        semantic_relevance: {
          score: finalScore,
          rank: idx + 1,
          matched_reasons: reasons
        },
        ai_sales_hook: {
          pitch_angle: `ご相談の「${query.slice(0, 30)}...」に関して、${reasons.join("、")}している企業として最適なアプローチ先です。`,
          suggested_icebreaker: `突然のご連絡にて大変恐れ入ります。${comp.company_name}様の${comp.industry_name || "業界"}におけるお取り組みを拝見し、特に${reasons[0] || "先進的な事業展開"}についてご提案がございましてご連絡いたしました。`
        }
      };
    });

    // Deduct quota
    if (rankedCompanies.length > 0) {
      await deductUserQuota(keyInfo.user_email, rankedCompanies.length);
    }

    // Update API Key usage details
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const ua = request.headers.get("user-agent") || "unknown";
    await updateApiKeyUsage(keyInfo.id, ip, ua);

    const updatedQuota = await getUserQuota(keyInfo.user_email);

    return NextResponse.json({
      success: true,
      query: query,
      semantic_analysis: analysis,
      total_candidates_found: searchResult.totalCount,
      count_returned: rankedCompanies.length,
      companies: rankedCompanies
    }, {
      headers: {
        "X-Quota-Remaining": updatedQuota.remaining.toString()
      }
    });

  } catch (error) {
    console.error("Error in POST /api/v1/companies/semantic-search:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
