# -*- coding: utf-8 -*-
"""
apply_guide_anchor_enrichment.py
Enriches /ja/guide/[slug]/page.tsx with:
1. Direct contextual <Link> tags to Core Data Hubs (/status/bankruptcies, /ranking/salary, /form-marketing, /search)
2. Regional Bankruptcy Data Table with deep links (/status/bankruptcies/tokyo, /osaka, /aichi)
3. Salary & White-company metric table with deep links (/ranking/salary, /ranking/tenure, /ranking/employees)
4. Form Marketing intent links (/search?contact_form=true, /search?hiring=true)
5. Callout Lead Magnet action banners in all articles
"""
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

file_path = "frontend/src/app/[locale]/guide/[slug]/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update renderArticleBody caller to pass locale
old_call = """function renderArticleBody(slug: string, locale: string) {
  switch (slug) {
    case 'ai-sales-list':
      return renderAiSalesListContent();
    case 'excel-sales-list-template':
      return renderExcelSalesListContent();
    case 'form-marketing-tips':
      return renderFormMarketingContent();
    case 'bankruptcy-signs-check':
      return renderBankruptcyCheckContent();
    case 'edinet-salary-ranking-utilization':
      return renderEdinetSalaryContent();
    default:
      return <p>コンテンツを準備中です。</p>;
  }
}"""

new_call = """function renderArticleBody(slug: string, locale: string) {
  switch (slug) {
    case 'ai-sales-list':
      return renderAiSalesListContent(locale);
    case 'excel-sales-list-template':
      return renderExcelSalesListContent(locale);
    case 'form-marketing-tips':
      return renderFormMarketingContent(locale);
    case 'bankruptcy-signs-check':
      return renderBankruptcyCheckContent(locale);
    case 'edinet-salary-ranking-utilization':
      return renderEdinetSalaryContent(locale);
    default:
      return <p>コンテンツを準備中です。</p>;
  }
}"""

if old_call not in code:
    print("[ERROR] Could not find old_call in page.tsx")
    sys.exit(1)

code = code.replace(old_call, new_call, 1)

# 2. Replace renderBankruptcyCheckContent
old_bankruptcy = """function renderBankruptcyCheckContent() {
  return (
    <div className="space-y-8">
      <section id="why-due-diligence-matters">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          1. なぜB2B取引において事前の信用調査が死活問題なのか？
        </h2>
        <p>
          新規取引先から大口の受注が決まり、納品を完了させた矢先に「破産手続き開始決定通知」が弁護士から届く——。
          中小企業やスタートアップにとって、数百万円〜数千万円の<strong>売掛金の焦げ付き（貸倒れ）は、自社までもが資金ショートに追い込まれる「連鎖倒産」の引き金</strong>になります。
        </p>
        <p>
          企業が倒産する際、前触れなく突然倒れるケースはごく稀です。80%以上の企業は、破産に至る数ヶ月前から<strong>公的登記や行政データに明らかな「異変シグナル」</strong>を発しています。
        </p>
      </section>

      <section id="five-warning-signals">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          2. 公的データから見抜く「倒産前の5大前兆シグナル」
        </h2>
        <div className="space-y-4 my-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ① 頻繁な本店移転（オフィスのダウングレード）
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              駅前の一等地ビルから郊外の雑居ビルやバーチャルオフィス、代表者の自宅アパートへと本店登記が移転されている場合、家賃滞納や賃料圧縮に追い込まれている危険性が極めて高いです。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ② 代表取締役の短期間での交代・親族以外の就任
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              創業社長が突然辞任し、業界経験のない人物や名義貸しが疑われる人物が代表に就いている場合、いわゆる「事件屋（整理屋）」が介入しているか、創業者が個人保証から逃れようとしている危険サインです。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ③ 適格インボイス登録番号の取消・失効
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              国税庁公表の「インボイス発行事業者情報」において、登録取消や失効が発生している場合、消費税の未納滞納処分を受けているか、事業活動を実質停止している決定的な証拠となります。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ④ 厚生年金被保険者数（正規従業員数）の急減
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              日本年金機構の公表データで被保険者数が半年〜1年で半分以下に急減している企業は、資金繰り破綻による大量離職か、社会保険料の支払いが滞り適用除外手続きを受けている可能性があります。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ⑤ 官報における解散登記・特別清算の公告
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              株主総会決議による解散や裁判所による破産手続開始決定は官報および法務局登記簿に直ちに掲載されます。Kigyou-listの「倒産速報ハブ」を活用すれば、これらを日次で把握可能です。
            </p>
          </div>
        </div>
      </section>

      <section id="credit-checklist">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          3. 即実践できる「取引先信用調査チェックリスト7項目」
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <li><strong>法人番号の存在確認:</strong> 国税庁法人番号サイトで登記が活動中か（閉鎖・解散ステータスになっていないか）。</li>
          <li><strong>過去の登記異動履歴:</strong> 過去2年以内に商号変更や本店移転を3回以上繰り返していないか。</li>
          <li><strong>適格請求書発行事業者のステータス:</strong> 有効なT番号を保有しているか。</li>
          <li><strong>役員の継続性:</strong> 直近で監査役や取締役が全員辞任していないか。</li>
          <li><strong>求人活動の実態:</strong> ハローワーク等で求人を出しているか（採用意欲がある企業は事業拡大中の証拠）。</li>
          <li><strong>公共入札・補助金の採択歴:</strong> 国や自治体の審査を通過している企業は公的信用度が一段高い。</li>
          <li><strong>Webサイトの更新状況:</strong> お知らせ欄が数年前で止まっていないか、SSL証明書が切れていないか。</li>
        </ul>
      </section>

      <section id="automated-monitoring">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. Kigyou-listの企業監視・倒産速報を活用したリスク自動検知
        </h2>
        <p>
          自社の取引先数十社〜数百社を一社ずつ定期的に調べるのは現実的ではありません。
          Kigyou-listの<strong>「企業監視・検知（ウォッチリスト）」機能（/ja/watchlist）</strong>に取引先を登録しておくだけで、代表者変更・本社移転・インボイス取消・解散登記を毎日システムが自動検知し、ダッシュボードでお知らせします。
        </p>
      </section>
    </div>
  );
}"""

new_bankruptcy = """function renderBankruptcyCheckContent(locale: string) {
  return (
    <div className="space-y-8">
      <section id="why-due-diligence-matters">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          1. なぜB2B取引において事前の信用調査が死活問題なのか？
        </h2>
        <p>
          新規取引先から大口の受注が決まり、納品を完了させた矢先に「破産手続き開始決定通知」が弁護士から届く——。
          中小企業やスタートアップにとって、数百万円〜数千万円の<strong>売掛金の焦げ付き（貸倒れ）は、自社までもが資金ショートに追い込まれる「連鎖倒産」の引き金</strong>になります。
        </p>
        <p>
          企業が倒産する際、前触れなく突然倒れるケースはごく稀です。80%以上の企業は、破産に至る数ヶ月前から<strong>公的登記や行政データに明らかな「異変シグナル」</strong>を発しています。
        </p>
      </section>

      <section id="five-warning-signals">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          2. 公的データから見抜く「倒産前の5大前兆シグナル」
        </h2>
        <div className="space-y-4 my-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ① 頻繁な本店移転（オフィスのダウングレード）
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              駅前の一等地ビルから郊外の雑居ビルやバーチャルオフィス、代表者の自宅アパートへと本店登記が移転されている場合、家賃滞納や賃料圧縮に追い込まれている危険性が極めて高いです。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ② 代表取締役の短期間での交代・親族以外の就任
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              創業社長が突然辞任し、業界経験のない人物や名義貸しが疑われる人物が代表に就いている場合、いわゆる「事件屋（整理屋）」が介入しているか、創業者が個人保証から逃れようとしている危険サインです。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ③ 適格インボイス登録番号の取消・失効
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
              国税庁公表の「インボイス発行事業者情報」において、登録取消や失効が発生している場合、消費税の未納滞納処分を受けているか、事業活動を実質停止している決定的な証拠となります。
            </p>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">取引先のインボイス登録状況を即座に確認：</span>
              <Link
                href={`/${locale}/search?invoice=true`}
                className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>適格インボイス登録企業を照会 ➔</span>
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ④ 厚生年金被保険者数（正規従業員数）の急減
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
              日本年金機構の公表データで被保険者数が半年〜1年で半分以下に急減している企業は、資金繰り破綻による大量離職か、社会保険料の支払いが滞り適用除外手続きを受けている可能性があります。
            </p>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">実質正規雇用規模・被保険者数の動向：</span>
              <Link
                href={`/${locale}/ranking/employees`}
                className="text-xs font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <span>厚生年金被保険者数ランキング ➔</span>
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 mb-1">
              ⑤ 官報における解散登記・特別清算の公告
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              株主総会決議による解散や裁判所による破産手続開始決定は官報および法務局登記簿に直ちに掲載されます。Kigyou-listの
              <Link href={`/${locale}/status/bankruptcies`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
                全国企業倒産速報データベース
              </Link>
              を活用すれば、日本全国の倒産・解散・清算情報を日次で把握可能です。
            </p>

            {/* Regional Bankruptcy Deep Link Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs text-left border-collapse bg-white dark:bg-slate-900">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <th className="p-2.5 border-b font-bold">主要都道府県</th>
                    <th className="p-2.5 border-b font-bold">倒産・清算動向の特徴</th>
                    <th className="p-2.5 border-b font-bold text-right">地域別速報リンク</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold">東京都</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">建設資材高騰・ITベンチャー選別・飲食店廃業</td>
                    <td className="p-2.5 text-right">
                      <Link href={`/${locale}/status/bankruptcies/tokyo`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline">
                        東京都の倒産速報 ➔
                      </Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold">大阪府</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">製造業下請け・卸売・商業流通の資金ショート</td>
                    <td className="p-2.5 text-right">
                      <Link href={`/${locale}/status/bankruptcies/osaka`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline">
                        大阪府の倒産速報 ➔
                      </Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold">愛知県</td>
                    <td className="p-2.5 text-slate-600 dark:text-slate-400">自動車一次・二次サプライチェーン・運送物流</td>
                    <td className="p-2.5 text-right">
                      <Link href={`/${locale}/status/bankruptcies/aichi`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline">
                        愛知県の倒産速報 ➔
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lead Magnet CTA Callout */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white block mb-0.5 font-bold">
              💡 取引先の信用不安・倒産リスクをリアルタイムで検知
            </strong>
            官報公告・法務局閉鎖登記・インボイス失効情報を毎日自動集約。未然の貸倒れ防止にご活用いただけます。
          </div>
          <Link
            href={`/${locale}/status/bankruptcies`}
            className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
          >
            倒産速報DBを検索（無料）
          </Link>
        </div>
      </section>

      <section id="credit-checklist">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          3. 即実践できる「取引先信用調査チェックリスト7項目」
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <li><strong>法人番号の存在確認:</strong> 国税庁法人番号サイトで登記が活動中か（閉鎖・解散ステータスになっていないか）。</li>
          <li><strong>過去の登記異動履歴:</strong> 過去2年以内に商号変更や本店移転を3回以上繰り返していないか。</li>
          <li>
            <strong>適格請求書発行事業者のステータス:</strong> 
            有効なT番号を保有しているか。
            <Link href={`/${locale}/search?invoice=true`} className="text-[#1B4F8A] dark:text-blue-400 font-bold hover:underline ml-1">
              [インボイス登録企業を確認]
            </Link>
          </li>
          <li><strong>役員の継続性:</strong> 直近で監査役や取締役が全員辞任していないか。</li>
          <li>
            <strong>求人活動の実態:</strong> 
            ハローワーク等で求人を出しているか（採用意欲がある企業は事業拡大中の証拠）。
            <Link href={`/${locale}/search?hiring=true`} className="text-[#1B4F8A] dark:text-blue-400 font-bold hover:underline ml-1">
              [求人募集中企業を検索]
            </Link>
          </li>
          <li>
            <strong>公共入札・補助金の採択歴:</strong> 
            国や自治体の審査を通過している企業は公的信用度が一段高い。
            <Link href={`/${locale}/search?bidding=true`} className="text-[#1B4F8A] dark:text-blue-400 font-bold hover:underline ml-1">
              [公共入札実績企業一覧]
            </Link>
          </li>
          <li><strong>Webサイトの更新状況:</strong> お知らせ欄が数年前で止まっていないか、SSL証明書が切れていないか。</li>
        </ul>
      </section>

      <section id="automated-monitoring">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. Kigyou-listの企業監視・倒産速報を活用したリスク自動検知
        </h2>
        <p>
          自社の取引先数十社〜数百社を一社ずつ定期的に調べるのは現実的ではありません。
          Kigyou-listの<strong>「企業監視・検知（ウォッチリスト）」機能</strong>に取引先を登録しておくだけで、代表者変更・本社移転・インボイス取消・解散登記を毎日システムが自動検知し、ダッシュボードでお知らせします。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/watchlist`}
            className="px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs"
          >
            企業監視ウォッチリストを開く ➔
          </Link>
          <Link
            href={`/${locale}/status/bankruptcies`}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
          >
            全国の倒産速報一覧を見る ➔
          </Link>
        </div>
      </section>
    </div>
  );
}"""

if old_bankruptcy not in code:
    print("[ERROR] Could not find old_bankruptcy in page.tsx")
    sys.exit(1)

code = code.replace(old_bankruptcy, new_bankruptcy, 1)

# 3. Replace renderEdinetSalaryContent
old_edinet = """function renderEdinetSalaryContent() {
  return (
    <div className="space-y-8">
      <section id="edinet-source-of-truth">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          1. なぜ有価証券報告書（EDINET）が企業分析の最高峰なのか？
        </h2>
        <p>
          求人サイトや企業のコーポレートサイトに掲載されている「平均年収」や「モデル給与」には、残業代の多寡やインセンティブ、特定の好調部署のみを切り出した数値が含まれることが多く、実態を正確に反映していないケースが多々あります。
        </p>
        <p>
          これに対し、<strong>金融庁の電子開示システム（EDINET）に提出される「有価証券報告書」</strong>に記載された平均年間給与・平均年齢・平均勤続年数は、公認会計士や監査法人の厳格な監査を受けた法定の確定データです。
          虚偽の記載には金融商品取引法に基づく重い刑事罰が科されるため、<strong>日本国内において最も信頼性の高い企業実態データ（Source of Truth）</strong>と断言できます。
        </p>
      </section>

      <section id="three-golden-metrics">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          2. 優良企業を見抜く「3大公的指標」（年収・勤続年数・被保険者数）
        </h2>
        <p>
          企業を分析する際、「年収が高い企業 ＝ 素晴らしい企業」と短絡的に結論づけるのは危険です。
          投資・転職・営業ターゲティングのすべてにおいて、以下の<strong>3大指標のバランス</strong>を読み解くことが肝要です。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded w-fit mb-2">
              金融庁 EDINET
            </div>
            <h3 className="font-bold text-sm mb-1">平均年間給与</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              全正社員の基準内賃金＋賞与の実績値。企業の労働分配率と1人あたり付加価値の高さを示します。
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded w-fit mb-2">
              厚労省 職場情報
            </div>
            <h3 className="font-bold text-sm mb-1">平均継続勤務年数</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              定着率と職場環境の安定性。15年〜20年を超える企業は離職率が低く「真のホワイト企業」の証左。
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded w-fit mb-2">
              日本年金機構
            </div>
            <h3 className="font-bold text-sm mb-1">厚生年金被保険者数</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              厚生年金適用事業所の現役被保険者数。名目上の「グループ連結」ではない単体の正規雇用実力値。
            </p>
          </div>
        </div>
      </section>

      <section id="sales-targeting-strategy">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          3. 高単価B2B商材で成約率を跳ね上げる「高年収企業ターゲティング」
        </h2>
        <p>
          SaaSシステム、コンサルティング、DX支援、役員研修などの高単価B2B商材を販売する場合、平均年収ランキング上位企業を狙い撃ちにするのが最も費用対効果が高い戦略です。
        </p>
        <p>
          平均年収1,000万円超の企業は、従業員1人の時間コストが非常に高く評価されているため、「業務時間を月5時間削減できる」といった提案に対し、数百万円の予算決済が即座に下りやすい特徴があります。
        </p>
      </section>

      <section id="ranking-matrix-how-to">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. Kigyou-listのランキング一覧からCSVを出力して活用する手順
        </h2>
        <p>
          Kigyou-listでは、EDINET開示の給与ランキング（/ja/ranking/salary）、厚労省データの勤続年数ランキング（/ja/ranking/tenure）、被保険者数ランキング（/ja/ranking/employees）をすべて公式公表情報に基づいて公開しています。
        </p>
        <p>
          各ランキングページから上場市場別・都道府県別でさらに絞り込み、役員名や公式電話番号が紐づいたリストを即座にエクスポートしてアプローチに活用できます。
        </p>
      </section>
    </div>
  );
}"""

new_edinet = """function renderEdinetSalaryContent(locale: string) {
  return (
    <div className="space-y-8">
      <section id="edinet-source-of-truth">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          1. なぜ有価証券報告書（EDINET）が企業分析の最高峰なのか？
        </h2>
        <p>
          求人サイトや企業のコーポレートサイトに掲載されている「平均年収」や「モデル給与」には、残業代の多寡やインセンティブ、特定の好調部署のみを切り出した数値が含まれることが多く、実態を正確に反映していないケースが多々あります。
        </p>
        <p>
          これに対し、<strong>金融庁の電子開示システム（EDINET）に提出される「有価証券報告書」</strong>に記載された平均年間給与・平均年齢・平均勤続年数は、公認会計士や監査法人の厳格な監査を受けた法定の確定データです。
          虚偽の記載には金融商品取引法に基づく重い刑事罰が科されるため、<strong>日本国内において最も信頼性の高い企業実態データ（Source of Truth）</strong>と断言できます。
        </p>
      </section>

      <section id="three-golden-metrics">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          2. 優良企業を見抜く「3大公的指標」（年収・勤続年数・被保険者数）
        </h2>
        <p>
          企業を分析する際、「年収が高い企業 ＝ 素晴らしい企業」と短絡的に結論づけるのは危険です。
          投資・転職・営業ターゲティングのすべてにおいて、以下の<strong>3大指標のバランス</strong>を読み解くことが肝要です。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
          <Link 
            href={`/${locale}/ranking/salary`}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-[#1B4F8A] transition-all group block"
          >
            <div className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded w-fit mb-2">
              金融庁 EDINET
            </div>
            <h3 className="font-bold text-sm mb-1 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
              平均年間給与 ➔
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              全正社員の基準内賃金＋賞与の実績値。企業の労働分配率と1人あたり付加価値の高さを示します。
            </p>
          </Link>

          <Link 
            href={`/${locale}/ranking/tenure`}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-[#1B4F8A] transition-all group block"
          >
            <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded w-fit mb-2">
              厚労省 職場情報
            </div>
            <h3 className="font-bold text-sm mb-1 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
              平均継続勤務年数 ➔
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              定着率と職場環境の安定性。15年〜20年を超える企業は離職率が低く「真のホワイト企業」の証左。
            </p>
          </Link>

          <Link 
            href={`/${locale}/ranking/employees`}
            className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-[#1B4F8A] transition-all group block"
          >
            <div className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded w-fit mb-2">
              日本年金機構
            </div>
            <h3 className="font-bold text-sm mb-1 group-hover:text-[#1B4F8A] dark:group-hover:text-blue-400 transition-colors">
              厚生年金被保険者数 ➔
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              厚生年金適用事業所の現役被保険者数。名目上の「グループ連結」ではない単体の正規雇用実力値。
            </p>
          </Link>
        </div>
      </section>

      <section id="sales-targeting-strategy">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          3. 高単価B2B商材で成約率を跳ね上げる「高年収企業ターゲティング」
        </h2>
        <p>
          SaaSシステム、コンサルティング、DX支援、役員研修などの高単価B2B商材を販売する場合、
          <Link href={`/${locale}/ranking/salary`} className="text-[#1B4F8A] dark:text-blue-400 font-bold hover:underline mx-1">
            平均年収ランキング上位企業（1,000万円超）
          </Link>
          を狙い撃ちにするのが最も費用対効果が高い戦略です。
        </p>
        <p>
          平均年収1,000万円超の企業は、従業員1人の時間コストが非常に高く評価されているため、「業務時間を月5時間削減できる」といった提案に対し、数百万円の予算決済が即座に下りやすい特徴があります。
        </p>

        {/* Lead Magnet CTA Callout */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white block mb-0.5 font-bold">
              📊 上場企業4,000社の有報財務データを一括分析
            </strong>
            平均年間給与・勤続年数・資本金・従業員数から、予算潤沢な優良ターゲット企業を瞬時に抽出できます。
          </div>
          <Link
            href={`/${locale}/ranking/salary`}
            className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
          >
            年収ランキングを見る（無料）
          </Link>
        </div>
      </section>

      <section id="ranking-matrix-how-to">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white border-b pb-2 mb-4">
          4. Kigyou-listのランキング一覧からCSVを出力して活用する手順
        </h2>
        <p>
          Kigyou-listでは、EDINET開示の
          <Link href={`/${locale}/ranking/salary`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
            給与ランキング（/ja/ranking/salary）
          </Link>
          、厚労省データの
          <Link href={`/${locale}/ranking/tenure`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
            勤続年数ランキング（/ja/ranking/tenure）
          </Link>
          、
          <Link href={`/${locale}/ranking/employees`} className="font-bold text-[#1B4F8A] dark:text-blue-400 hover:underline mx-1">
            被保険者数ランキング（/ja/ranking/employees）
          </Link>
          をすべて公式公表情報に基づいて公開しています。
        </p>
        <p>
          各ランキングページから上場市場別・都道府県別でさらに絞り込み、役員名や公式電話番号が紐づいたリストを即座にエクスポートしてアプローチに活用できます。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/ranking/salary`}
            className="px-4 py-2 rounded-lg bg-[#1B4F8A] hover:bg-[#143D6C] text-white text-xs font-bold transition-colors shadow-2xs"
          >
            平均年間給与ランキングTOP100 ➔
          </Link>
          <Link
            href={`/${locale}/search`}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
          >
            500万社から条件で探す ➔
          </Link>
        </div>
      </section>
    </div>
  );
}"""

if old_edinet not in code:
    print("[ERROR] Could not find old_edinet in page.tsx")
    sys.exit(1)

code = code.replace(old_edinet, new_edinet, 1)

# 4. Update signatures of remaining functions
code = code.replace("function renderAiSalesListContent() {", "function renderAiSalesListContent(locale: string) {", 1)
code = code.replace("function renderExcelSalesListContent() {", "function renderExcelSalesListContent(locale: string) {", 1)
code = code.replace("function renderFormMarketingContent() {", "function renderFormMarketingContent(locale: string) {", 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("[SUCCESS] Successfully updated /ja/guide/[slug]/page.tsx with rich in-content anchor links and data tables!")
