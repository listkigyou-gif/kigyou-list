# -*- coding: utf-8 -*-
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

file_path = "frontend/src/app/[locale]/guide/[slug]/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update renderAiSalesListContent Section 4
old_ai_s4 = """          <li>
            <strong>ターゲット条件の絞り込み:</strong><br />
            Kigyou-listの企業詳細検索画面（/ja/search）で、地域・JSIC産業大分類・資本金規模・「問い合わせフォームあり」にチェックを入れて検索します。
          </li>
          <li>
            <strong>正規CSVデータの出力:</strong><br />
            「CSV一括エクスポート」をクリックし、法人番号・商号・所在地・代表者名・直通フォームURLが含まれたデータをダウンロードします（無料プランでも毎月50社出力可能）。
          </li>
          <li>
            <strong>AIへのインポートと自動アプローチ:</strong><br />
            出力されたCSVファイルをChatGPT Advanced Data AnalysisやClaude Codeにドラッグ＆ドロップし、上記の即戦力プロンプトを実行します。自社のフォーム営業サービスと連携すれば、最短即日で高確度アプローチが完了します。
          </li>
        </ol>
      </section>
    </div>
  );
}"""

new_ai_s4 = """          <li>
            <strong>ターゲット条件の絞り込み:</strong><br />
            Kigyou-listの
            <Link href={`/${locale}/search`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
              企業詳細検索画面（/ja/search）
            </Link>
            で、地域・JSIC産業大分類・資本金規模・「問い合わせフォームあり」にチェックを入れて検索します。
          </li>
          <li>
            <strong>正規CSVデータの出力:</strong><br />
            「CSV一括エクスポート」をクリックし、法人番号・商号・所在地・代表者名・直通フォームURLが含まれたデータをダウンロードします（
            <Link href={`/${locale}/pricing`} className="text-[#1B4F8A] dark:text-blue-400 font-bold hover:underline">
              無料プランでも毎月50社出力可能
            </Link>
            ）。
          </li>
          <li>
            <strong>AIへのインポートと自動アプローチ:</strong><br />
            出力されたCSVファイルをChatGPT Advanced Data AnalysisやClaude Codeにドラッグ＆ドロップし、上記の即戦力プロンプトを実行します。自社の
            <Link href={`/${locale}/form-marketing`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
              フォーム営業自動配信サービス
            </Link>
            と連携すれば、最短即日で高確度アプローチが完了します。
          </li>
        </ol>

        {/* Lead Magnet CTA Callout */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white block mb-0.5 font-bold">
              ⚡ 500万社データベース直結でAIプロンプトの精度を最大化
            </strong>
            国税庁公表データ・適格インボイス・求人活動・有報年収データをCSV出力し、ChatGPTやClaudeで即座に分析可能。
          </div>
          <Link
            href={`/${locale}/search`}
            className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
          >
            企業データベースを検索 ➔
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/search?contact_form=true`}
            className="px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs"
          >
            フォーム営業可能な企業を探す ➔
          </Link>
          <Link
            href={`/${locale}/pricing`}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
          >
            月額1,260円〜の料金プラン ➔
          </Link>
        </div>
      </section>
    </div>
  );
}"""

if old_ai_s4 not in code:
    print("[ERROR] Could not find old_ai_s4")
    sys.exit(1)

code = code.replace(old_ai_s4, new_ai_s4, 1)

# 2. Update renderExcelSalesListContent Section 4
old_excel_s4 = """      <section id="kigyoulist-export-flow">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. Kigyou-listを活用して最短5分でリストを完成させる方法
        </h2>
        <p>
          自力で上記の10項目をWeb検索して埋める作業は、1社につき3〜5分、100社で約6時間以上かかります。
          Kigyou-list（kigyoulist.com）なら、すでに国税庁・官公庁から集約済みの500万社データから必要な条件を絞り込み、上記の10項目が整ったCSVファイルをワンクリックで出力できます。
        </p>
      </section>
    </div>
  );
}"""

new_excel_s4 = """      <section id="kigyoulist-export-flow">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. Kigyou-listを活用して最短5分でリストを完成させる方法
        </h2>
        <p>
          自力で上記の10項目をWeb検索して埋める作業は、1社につき3〜5分、100社で約6時間以上かかります。
          Kigyou-listなら、すでに国税庁・官公庁から集約済みの500万社データから必要な条件を絞り込み、上記の10項目が整ったCSVファイルを
          <Link href={`/${locale}/pricing`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
            ワンクリックで出力（月50社まで無料）
          </Link>
          できます。
        </p>

        {/* Lead Magnet CTA Callout */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white block mb-0.5 font-bold">
              📥 Excelですぐ使えるCSV企業リストを一括作成
            </strong>
            業種・地域・資本金・従業員数・問い合わせフォームURLなど、営業に必要な全項目を網羅した高精度リスト。
          </div>
          <Link
            href={`/${locale}/search`}
            className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
          >
            条件を指定して検索する ➔
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/pricing`}
            className="px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs"
          >
            料金プラン・無料枠を確認 ➔
          </Link>
          <Link
            href={`/${locale}/compare`}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
          >
            他社リストツールとの料金比較 ➔
          </Link>
        </div>
      </section>
    </div>
  );
}"""

if old_excel_s4 not in code:
    print("[ERROR] Could not find old_excel_s4")
    sys.exit(1)

code = code.replace(old_excel_s4, new_excel_s4, 1)

# 3. Update renderFormMarketingContent Section 4
old_form_s4 = """      <section id="ng-filter-safety">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. クレームを防ぐ「営業お断り」サイトの除外と安全な自動化
        </h2>
        <p>
          フォーム営業で最も恐ろしいのは、クレーム電話やSNSへの悪評投稿です。
          これを完全に防ぐには、送信前にWebサイトのフォーム画面をクローリングし、「営業お断り」「セールス禁止」「業務妨害」といったNGワードが含まれていないか機械審査する仕組みが不可欠です。
        </p>
        <p>
          Kigyou-listのフォーム営業機能（/ja/form-marketing）では、AIによる「営業お断り免責判定フィルター」が全件に適用され、リスクのある企業を自動でスキップして安全な配信を実現しています。
        </p>
      </section>
    </div>
  );
}"""

new_form_s4 = """      <section id="ng-filter-safety">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. クレームを防ぐ「営業お断り」サイトの除外と安全な自動化
        </h2>
        <p>
          フォーム営業で最も恐ろしいのは、クレーム電話やSNSへの悪評投稿です。
          これを完全に防ぐには、送信前にWebサイトのフォーム画面をクローリングし、「営業お断り」「セールス禁止」「業務妨害」といったNGワードが含まれていないか機械審査する仕組みが不可欠です。
        </p>
        <p>
          Kigyou-listの
          <Link href={`/${locale}/form-marketing`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
            Web問い合わせフォーム自動配信機能
          </Link>
          では、AIによる「営業お断り免責判定フィルター」が全件に適用され、リスクのある企業を自動でスキップして安全な配信を実現しています。
        </p>

        {/* Lead Magnet CTA Callout */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white block mb-0.5 font-bold">
              🚀 問い合わせフォーム営業を安全かつ自動化
            </strong>
            全国50万件のフォーム設置済み企業リストから、ターゲットを絞り込んで送信代行・配信管理を一気通貫でサポート。
          </div>
          <Link
            href={`/${locale}/form-marketing`}
            className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
          >
            フォーム営業の詳細を見る ➔
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/search?contact_form=true`}
            className="px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs"
          >
            フォームあり企業（50万社）を検索 ➔
          </Link>
          <Link
            href={`/${locale}/search?hiring=true`}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
          >
            求人募集中企業で絞り込む ➔
          </Link>
        </div>
      </section>
    </div>
  );
}"""

if old_form_s4 not in code:
    print("[ERROR] Could not find old_form_s4")
    sys.exit(1)

code = code.replace(old_form_s4, new_form_s4, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("[SUCCESS] All 5 articles fully enriched with deep anchor links and CTA callouts!")
