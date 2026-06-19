import { getDB, createBlogPost } from '../lib/db';
import { prefectureJaToEn, industryJaToEn, formatEnglishAddress } from '../lib/locale-mapping';

async function run() {
  console.log('--- STARTING PROGRAMMATIC ENGLISH BLOG GENERATION JOB ---');
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

  const prefEn = prefectureJaToEn[prefecture_name] || prefecture_name;
  const indEn = industryJaToEn[industry_name] || industry_name;
  
  console.log(`Selected Pair: ${prefecture_name} (${prefEn}) x ${industry_name} (${indEn}) (Total active: ${count})`);
  
  // 2. Fetch top 5 companies in this category sorted by employee_count DESC (or capital)
  const companiesQuery = `
    SELECT c.corporate_number, c.company_name, c.employee_count, c.capital_amount, c.full_address, c.phone_number, c.website_url,
           c.prefecture_name, c.city_name, c.street_address, c.postal_code
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
  const avgCapStr = avgCapital > 0 ? `${avgCapital.toLocaleString()} JPY` : 'Under evaluation';
  
  // 4. Generate post properties based on a random template selection
  const templateId = Math.floor(Math.random() * 3);
  console.log(`Using Template ID: ${templateId} for content rendering.`);

  const dateStr = new Date().toISOString().slice(0, 10);
  const slug = `${prefecture_code}-${industry_code}-companies-ranking-en`;
  
  let title = '';
  let summary = '';
  let content = '';

  const tableHeader = `| Rank | Company Name | Corporate Number | Employee Size | Capital Amount | Registered Address |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  let tableRows = '';
  companies.forEach((c, idx) => {
    const capStr = c.capital_amount ? `${c.capital_amount.toLocaleString()} JPY` : 'Not Disclosed';
    const empStr = c.employee_count ? `${c.employee_count.toLocaleString()} employees` : 'Not Disclosed';
    const engAddress = formatEnglishAddress(c);
    tableRows += `| ${idx + 1} | [${c.company_name}](/en/company/${c.corporate_number}) | \`${c.corporate_number}\` | ${empStr} | ${capStr} | ${engAddress || 'Not Disclosed'} |\n`;
  });

  if (templateId === 0) {
    title = `Top ${indEn} Companies in ${prefEn} | 2026 Directory & Sales Guide`;
    summary = `Discover the top-performing companies in the ${indEn} sector located in ${prefEn}, Japan. Explore employee sizes, capital structure, and targeted outbound sales strategies.`;
    content = `## Introduction
      
Developing a highly targeted B2B sales strategy for the Japanese market requires accurate, localized corporate data. In this report, we analyze the **${indEn}** sector in **${prefEn}**, extracting key intelligence from our database of over 5 million active Japanese businesses.

---

## 1. Market Overview: ${indEn} in ${prefEn}

Based on the latest data in the Kigyou-list database, there are currently **${count.toLocaleString()}** active companies categorized under ${indEn} within ${prefEn}.

* **Total Active Companies:** ${count.toLocaleString()}
* **Average Capitalization:** ${avgCapStr}
* **Key Geographic Target:** ${prefEn}, Japan

---

## 2. Top 5 ${indEn} Companies in ${prefEn} (Ranked by Employee Count)

Here is the list of top 5 representative companies in ${prefEn}'s ${indEn} sector, ordered by employee size to highlight major enterprises.

${tableHeader}${tableRows}
*Note: To view the full corporate profile, contact information, or direct website links, click on the company names above.*

---

## 3. High-Conversion Outbound Sales Strategies for this Segment

To successfully pitch products or services to Japanese companies in the ${indEn} sector, generic cold mailing is rarely effective. Instead, consider these intent-driven approaches:

### ① Monitor Active Recruitment (HR Intent)
Companies experiencing employee growth or listing active job openings are prime candidates for workflow optimization tools, recruitment services, and general business software.

### ② Align with Subsidy and Grant Cycles
Japanese companies that have recently been awarded IT introduction subsidies or manufacturing grants possess allocated budgets, dramatically increasing response rates for digital transformation proposals.

---

## 4. Download Custom Sales Lists

This ranking represents a small portion of the data available. With Kigyou-list, you can build tailored lists filtered by industry codes (JSIC classification), capital amount, geographic location, and contact channel availability (Email, Phone, FAX).

Sign up for our **[Free Account](https://kigyoulist.com/en/search)** today to search and download high-quality B2B sales lists instantly.
`;
  } else if (templateId === 1) {
    title = `${prefEn} ${indEn} Market Report 2026 | B2B Competitor Analysis`;
    summary = `An in-depth competitive analysis of the ${indEn} industry in ${prefEn}, Japan. We profile key market leaders by employee size and highlight B2B customer acquisition strategies.`;
    content = `## Executive Summary

For international companies looking to expand their footprint or find distributors in Japan, understanding the regional competitive landscape is crucial. This report provides a structural mapping of the **${indEn}** industry in **${prefEn}**, showcasing leading enterprises and B2B customer acquisition techniques.

---

## 1. Industry Dynamics in ${prefEn}

Our data shows steady activity within the ${indEn} sector in ${prefEn}. Here are the key baseline parameters:

* **Active Database Records:** ${count.toLocaleString()} companies
* **Mean Capitalization:** ${avgCapStr}
* **Economic Footprint:** Highly integrated with regional supply chains in ${prefEn}.

---

## 2. Leading Market Players (Top 5 by Employee Size)

These companies represent the largest employers in this local segment, serving as valuable target accounts or potential partners.

${tableHeader}${tableRows}
*Note: Complete profiles including phone numbers and website URLs can be accessed via the respective company links.*

---

## 3. B2B Prospecting & Key Decision Maker Outreach

When prospecting ${indEn} companies in ${prefEn}:

### ① Segment by Capital Size
Companies with capital levels higher than the regional average of ${avgCapStr} typically have structured procurement cycles. Small to medium businesses (SMBs), however, often feature shorter sales cycles and allow direct founder outreach.

### ② Utilize Multi-Channel Contact Points
Ensure your outreach list includes multiple communication channels. Combining targeted physical mailers/faxes with digital follow-ups (Email/Form submission) yields the highest engagement rates in Japan.

---

## 4. Get Access to the Full Database

Access millions of Japanese company profiles on Kigyou-list. Filter by industry, region, contact availability, and more to download customized CSV files for your sales team.

Start your **[Free Company Search](https://kigyoulist.com/en/search)** now.
`;
  } else {
    title = `How to Build a B2B Sales List for ${indEn} in ${prefEn}`;
    summary = `A practical guide to building highly converting sales lists in ${prefEn}'s ${indEn} industry using our comprehensive Japanese company database.`;
    content = `## Overview

A clean, up-to-date prospect list is the foundation of any successful outbound sales campaign. In this guide, we discuss how to segment and target companies within the **${indEn}** industry in **${prefEn}**, utilizing structured corporate intelligence.

---

## 1. Target Audience Size & Demographics

Knowing your total addressable market (TAM) helps plan campaign resource allocation:

* **Total Addressable Market:** ${count.toLocaleString()} active companies
* **Average Capital Base:** ${avgCapStr}
* **Primary Location:** ${prefEn}, Japan

---

## 2. Benchmarking Leading Entities (Top 5 Companies)

Analyzing the largest companies in the sector provides insights into the operational scale of your target market.

${tableHeader}${tableRows}
*Note: Click on each company link to view their detailed profiling data.*

---

## 3. Best Practices for Segmenting Your Prospects

Maximize campaign efficiency by dividing your prospect database into logical cohorts:

### ① Enterprise vs. SMB Tailoring
Enterprise accounts require relationship-based sales and consensus building (Ringi). Mid-market and SMB targets in the ${indEn} space are more responsive to product utility and immediate ROI.

### ② Filtering by Contact Completeness
Prioritize companies with high contact completeness (direct websites, phone numbers, and registered addresses) to streamline the sales outreach workflow.

---

## 4. Extract Your Custom CSV List

Kigyou-list is the ultimate tool for international businesses targeting Japan. Build, save, and export high-conversion lists from our database of over 5 million companies.

Register for a **[Free Account](https://kigyoulist.com/en/search)** to view and download custom prospect lists today.
`;
  }

  // 5. Write to database
  console.log(`Writing English Post: "${title}" to database...`);
  await createBlogPost({
    slug,
    title,
    content,
    summary,
    category: `${indEn}`,
    published_at: dateStr,
    locale: 'en'
  });
  console.log('--- ENGLISH POST GENERATION SUCCESSFUL ---');
}

run().catch(err => {
  console.error('Failed to generate English blog post:', err);
  process.exit(1);
});
