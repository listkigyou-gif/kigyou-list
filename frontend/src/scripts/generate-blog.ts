import { getDB, createBlogPost } from '../lib/db';

async function run() {
  console.log('--- STARTING PROGRAMMATIC BLOG GENERATION JOB ---');
  const db = getDB();
  
  // 1. Get a random active prefecture & industry using optimized indexed lookups
  let prefecture_code = '';
  let prefecture_name = '';
  let industry_code = '';
  let industry_name = '';
  let count = 0;

  console.log('Selecting active prefecture-industry pair...');
  for (let attempt = 0; attempt < 50; attempt++) {
    // Select a random prefecture from counts table with more than 10 companies
    const pref = db.prepare(`
      SELECT prefecture_code, prefecture_name 
      FROM prefecture_counts 
      WHERE company_count > 10 
      ORDER BY RANDOM() 
      LIMIT 1
    `).get() as { prefecture_code: string; prefecture_name: string } | undefined;

    // Select a random industry from m_industries (classification_level = '中分類')
    const ind = db.prepare(`
      SELECT industry_code, industry_name 
      FROM m_industries 
      WHERE classification_level = '中分類' 
      ORDER BY RANDOM() 
      LIMIT 1
    `).get() as { industry_code: string; industry_name: string } | undefined;
    
    if (pref && ind) {
      // Check if we have at least 3 active companies matching this pair
      const countRes = db.prepare(`
        SELECT COUNT(*) as count
        FROM company_industries ci
        JOIN companies c ON ci.corporate_number = c.corporate_number
        WHERE ci.industry_code = ? AND c.prefecture_code = ? AND c.status = '活動中'
      `).get(ind.industry_code, pref.prefecture_code) as { count: number } | undefined;
      
      if (countRes && countRes.count >= 3) {
        prefecture_code = pref.prefecture_code;
        prefecture_name = pref.prefecture_name;
        industry_code = ind.industry_code;
        industry_name = ind.industry_name;
        count = countRes.count;
        break;
      }
    }
  }

  // Fallback to a guaranteed pair if randomized search fails to yield one
  if (count < 3) {
    console.log('Fallback to default popular pair (Tokyo x Software)...');
    prefecture_code = '13'; // Tokyo
    prefecture_name = '東京都';
    industry_code = '39'; // Information services
    industry_name = '情報サービス業';
    
    const countRes = db.prepare(`
      SELECT COUNT(*) as count
      FROM company_industries ci
      JOIN companies c ON ci.corporate_number = c.corporate_number
      WHERE ci.industry_code = ? AND c.prefecture_code = ? AND c.status = '活動中'
    `).get(industry_code, prefecture_code) as { count: number } | undefined;
    count = countRes?.count || 0;
  }
  
  console.log(`Selected Pair: ${prefecture_name} x ${industry_name} (Total active: ${count})`);
  
  // 2. Fetch top 5 companies in this category sorted by employee_count DESC (or capital)
  const companiesQuery = `
    SELECT c.corporate_number, c.company_name, c.employee_count, c.capital_amount, c.full_address, c.phone_number, c.website_url
    FROM companies c
    JOIN company_industries ci ON c.corporate_number = ci.corporate_number
    WHERE ci.industry_code = ? AND c.prefecture_code = ? AND c.status = '活動中'
    ORDER BY IFNULL(c.employee_count, 0) DESC, c.corporate_number ASC
    LIMIT 5
  `;
  const companies = db.prepare(companiesQuery).all(industry_code, prefecture_code) as any[];
  
  // 3. Compute stats
  const avgCapitalQuery = `
    SELECT AVG(c.capital_amount) as avg_cap
    FROM companies c
    JOIN company_industries ci ON c.corporate_number = ci.corporate_number
    WHERE ci.industry_code = ? AND c.prefecture_code = ? AND c.capital_amount IS NOT NULL
  `;
  const statsRes = db.prepare(avgCapitalQuery).get(industry_code, prefecture_code) as { avg_cap: number | null } | undefined;
  const avgCapital = statsRes?.avg_cap ? Math.round(statsRes.avg_cap) : 0;
  
  // 4. Generate post properties based on a random template selection
  const templateId = Math.floor(Math.random() * 3);
  console.log(`Using Template ID: ${templateId} for content rendering.`);

  const dateStr = new Date().toISOString().slice(0, 10);
  const slug = `${prefecture_code}-${industry_code}-companies-ranking`;
  
  let title = '';
  let summary = '';
  let content = '';

  const tableHeader = `| 順位 | 企業名 | 法人番号 | 従業員数 | 資本金 | 登記住所 |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  let tableRows = '';
  companies.forEach((c, idx) => {
    const capStr = c.capital_amount ? `${(c.capital_amount / 10000).toLocaleString()}万円` : '未登録';
    const empStr = c.employee_count ? `${c.employee_count.toLocaleString()}名` : '未登録';
    tableRows += `| ${idx + 1} | [${c.company_name}](/company/${c.corporate_number}) | \`${c.corporate_number}\` | ${empStr} | ${capStr} | ${c.full_address || '未登録'} |\n`;
  });

  if (templateId === 0) {
    // Template 0: Ranking & Outbound Sales Focus
    title = `【2026年最新】${prefecture_name}の${industry_name}企業ランキングと営業アプローチ戦略`;
    summary = `${prefecture_name}で活動中の${industry_name}業界の企業データベースから、規模順に代表企業を抽出し、最新の市場統計やターゲット選定に役立つ営業シグナル分析を詳しく解説します。`;
    content = `## はじめに

本レポートでは、**${prefecture_name}**における**${industry_name}**業界の主要企業データを抽出し、企業リストの構築や営業アプローチにおけるターゲティングの最適化を目的とした分析結果を公開します。

---

## 1. ${prefecture_name}の${industry_name} 業界概要

現在、Kigyou-listのデータベースには、${prefecture_name}内で稼働している${industry_name}の企業が **${count.toLocaleString()}社** 登録されています。

* **稼働企業数:** ${count.toLocaleString()}社
* **平均資本金:** ${avgCapital > 0 ? `${(avgCapital / 10000).toLocaleString()}万円` : 'データ集計中'}
* **主要都市エリア:** ${prefecture_name}内全域

---

## 2. ${prefecture_name}の${industry_name} 代表企業ランキング（従業員規模順 Top 5）

以下は、${prefecture_name}の${industry_name}業界において、従業員規模順にソートされた代表的な5社の企業リストです。

${tableHeader}${tableRows}
※詳細なプロフィールや最新の営業意欲（インテント）シグナルは、各リンク先の詳細ページをご参照ください。

---

## 3. この業界への効果的な営業アプローチ戦略

${prefecture_name}の${industry_name}業界に対するアウトバウンド営業を成功させるためには、単なる一斉送信のメールやテレアポではなく、以下の「意欲シグナル（インテントデータ）」を捉えたアプローチが推奨されます。

### ① 求人活動中の企業を狙う（HRニーズ）
従業員数が増加傾向にある、または直近で新規求人を開始している企業は、成長に伴う設備投資や業務効率化ツールの導入意欲が高い傾向にあります。

### ② 補助金・助成金の受給タイミングに合わせる
IT導入補助金やものづくり補助金の採択が発表された企業は、予算枠が確保されているため、新規提案の成約率が劇的に向上します。

---

## 4. まとめと営業リストのダウンロード

今回ご紹介した企業リストは一部です。Kigyou-listでは、JSIC産業大・中分類の絞り込み、資本金・従業員数・連絡先（電話番号、FAX、メールアドレス）の有無を指定して、高品質なカスタム営業リストを即時に構築・CSVダウンロードできます。

まずは**[無料プラン]**に登録し、どのような営業ターゲットリストが作成できるかお試しください。
`;
  } else if (templateId === 1) {
    // Template 1: Market Landscape & Competitive Mapping
    title = `【2026年市場レポート】${prefecture_name}における${industry_name}業界の勢力図と新規開拓手法`;
    summary = `${prefecture_name}の${industry_name}業界における市場動向と競合勢力図を解説。代表的な企業のデータ比較をもとに、効果的なB2B新規開拓およびターゲットプラン te 提案します。`;
    content = `## 市場概況とイントロダクション

B2B営業において、ローカル市場の特性を理解することはターゲット選定の成否を分けます。本稿では、**${prefecture_name}**に本社または拠点を持つ**${industry_name}**業界の勢力図を分析し、営業ターゲットの最適化について解説します。

---

## 1. ${prefecture_name}・${industry_name}の市場統計

Kigyou-listの最新マスターデータに基づく、当エリア・当業界の基本パラメータは以下の通りです。

* **登録企業母数:** ${count.toLocaleString()}社
* **平均的な資本金規模:** ${avgCapital > 0 ? `${(avgCapital / 10000).toLocaleString()}万円` : 'データ集計中'}
* **エリア特性:** ${prefecture_name}の経済動向と密接に関連し、中核エリアを中心に企業が集中。

---

## 2. 注目すべき主要企業（従業員規模 Top 5）

この地域・業界を牽引する代表的な企業のデータを比較します。従業員規模が大きく成長ポテンシャルの高い企業群です。

${tableHeader}${tableRows}
※企業名をクリックすると、電話番号や公式ウェブサイトのURLを含む詳細プロフィールにアクセスできます。

---

## 3. 新規開拓・ターゲティングの注目ポイント

${industry_name}業界への提案活動においては、ターゲット企業の「経営リソース」と「直近の成長シグナル」の分析が重要です。

### ① 財務健全性と設備投資意欲の把握
平均資本金規模と比較して上位にある企業は、事業拡大に伴うシステム刷新や社内ツールの導入を積極的に検討するフェーズにあります。

### ② アクティブな営業ターゲットの抽出
Kigyou-listが提供する「助成金・入札実績・特許出願」などのインテントフィルターを利用し、意思決定 of 早い企業へピンポイントでアプローチするのが有効です。

---

## 4. 営業リスト構築のご案内

Kigyou-listでは、今回紹介した${prefecture_name}の${industry_name}企業リストをはじめ、日本全国500万社以上のマスターデータから「FAX番号付きリスト」「メールアドレス付きリスト」を即座に作成可能です。

まずは**[無料検索]**をお試しいただき、詳細な絞り込み機能の利便性を実感してください。
`;
  } else {
    // Template 2: B2B Prospecting & Local Database Directory Guide
    title = `【2026年版】${prefecture_name}・${industry_name}の主要企業リスト・営業リスト作成ガイド`;
    summary = `${prefecture_name}の${industry_name}業界に特化した営業ターゲットリストの構築手法をガイド。企業データベースを活用し、資本金や従業員数でターゲティングを絞り込む実践的なアプローチを紹介します。`;
    content = `## 営業リスト作成の重要性

効率的なセールスサイクルを構築するためには、確度の高いハウスリストが不可欠です。本ガイドでは、**${prefecture_name}**における**${industry_name}**業界の企業データベースを活用した、効果的なリストセグメンテーションの手法を提案します。

---

## 1. データベース概要

${prefecture_name}の${industry_name}業界セグメントには、現在データベース上に **${count.toLocaleString()}社** が収録されており、営業アプローチのソースとして極めて魅力的な母数となっています。

* **セグメント総数:** ${count.toLocaleString()}社
* **資本金アベレージ:** ${avgCapital > 0 ? `${(avgCapital / 10000).toLocaleString()}万円` : 'データ集計中'}

---

## 2. ${prefecture_name}の${industry_name} 主要企業データ（従業員数順 Top 5）

ターゲットとなる主要な企業の概要です。リスト作成時のベンチマークとしてご活用ください。

${tableHeader}${tableRows}
※詳細なプロフィールや財務の5カ年推移グラフは、リンク先ページで公開しています。

---

## 3. 精密なターゲティングの実践手法

リスト作成時は、単に一律のアプローチをするのではなく、以下のようにセグメントを分けることを推奨します。

### ① 従業員規模に応じたアプローチの変更
従業員規模が大きな企業（100名以上など）に対しては、部門別の決裁フローを意識したアプローチが有効です。一方で小規模な企業に対しては、経営陣への直接アプローチが効果を発揮します。

### ② 連絡先チャンネルの最適化
電話番号だけでなく、メールアドレスやFAXの有無をKigyou-listでフィルタリングすることで、テレアポ・DM・フォーム営業などのマルチチャネルアプローチをシームレスに行うことができます。

---

## 4. 高品質なカスタムリストを今すぐダウンロード

Kigyou-listのプレミアムプランでは、検索した${prefecture_name}の${industry_name}企業の全データをCSV形式で一括ダウンロード可能です。

まずは**[無料プラン登録]**で、ご自身のターゲットとなるセグメントの会社数を確認してみましょう。
`;
  }

  // 6. Write to database
  console.log(`Writing Post: "${title}" to database...`);
  await createBlogPost({
    slug,
    title,
    content,
    summary,
    category: `${industry_name}`,
    published_at: dateStr
  });
  console.log('--- POST GENERATION SUCCESSFUL ---');
}

run().catch(err => {
  console.error('Failed to generate blog post:', err);
  process.exit(1);
});
