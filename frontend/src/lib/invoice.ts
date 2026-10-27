export function generateInvoiceHtml(params: {
  email: string;
  paymentId: string;
  formattedDate: string;
  priceJpy: number;
  priceName: string;
  linesAdded: number;
  taxExclusivePrice: number;
  taxAmount: number;
  billingName?: string;
  billingAddress?: string;
  billingTaxId?: string;
  billingPhone?: string;
  isRefunded?: boolean;
  refundedAtFormatted?: string;
}) {
  const isRefunded = !!params.isRefunded;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>${isRefunded ? '【返金済・無効】' : ''}領収書 / インボイス - ${params.paymentId}</title>
  <link rel="icon" href="/icon.svg" type="image/svg+xml" />
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;
      color: #333;
      margin: 0;
      padding: 40px;
      background-color: #f9f9f9;
    }
    .invoice-card {
      position: relative;
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid ${isRefunded ? '#f87171' : '#eaeaea'};
      overflow: hidden;
    }
    .void-watermark {
      position: absolute;
      top: 42%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      font-size: 56px;
      font-weight: 900;
      color: rgba(220, 38, 38, 0.16);
      border: 6px dashed rgba(220, 38, 38, 0.3);
      padding: 16px 40px;
      border-radius: 14px;
      pointer-events: none;
      white-space: nowrap;
      letter-spacing: 6px;
      user-select: none;
      z-index: 20;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid ${isRefunded ? '#dc2626' : '#0066cc'};
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      color: ${isRefunded ? '#dc2626' : '#0066cc'};
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .refund-badge {
      font-size: 13px;
      background: #fee2e2;
      color: #991b1b;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #f87171;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .refund-notice-box {
      background: #fff5f5;
      border: 1.5px solid #f87171;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 25px;
      color: #991b1b;
    }
    .company-details {
      text-align: right;
      font-size: 14px;
      line-height: 1.6;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 35px;
    }
    .meta-box h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #555;
      border-left: 4px solid ${isRefunded ? '#dc2626' : '#0066cc'};
      padding-left: 8px;
    }
    .meta-box p {
      margin: 4px 0;
      font-size: 14px;
    }
    .total-display {
      background: ${isRefunded ? '#fff1f2' : '#f4f8fc'};
      border: 1px solid ${isRefunded ? '#fecdd3' : '#d2e4f6'};
      padding: 20px;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 35px;
    }
    .total-label {
      font-size: 16px;
      color: #555;
      margin-bottom: 5px;
    }
    .total-amount {
      font-size: 32px;
      font-weight: bold;
      color: ${isRefunded ? '#dc2626' : '#0066cc'};
    }
    .total-amount-strike {
      font-size: 20px;
      color: #94a3b8;
      text-decoration: line-through;
      margin-right: 10px;
    }
    .item-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .item-table th {
      background: #f5f5f5;
      border-bottom: 2px solid #ddd;
      padding: 12px;
      text-align: left;
      font-size: 14px;
      font-weight: 600;
    }
    .item-table td {
      border-bottom: 1px solid #eee;
      padding: 12px;
      font-size: 14px;
    }
    .item-table th.num, .item-table td.num {
      text-align: right;
    }
    .tax-breakdown {
      width: 50%;
      margin-left: auto;
      border-collapse: collapse;
      margin-bottom: 40px;
    }
    .tax-breakdown td {
      padding: 8px 12px;
      font-size: 14px;
    }
    .tax-breakdown td.label {
      text-align: right;
      color: #666;
    }
    .tax-breakdown td.val {
      text-align: right;
      font-weight: 600;
    }
    .footer-note {
      font-size: 12px;
      color: #777;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    .no-print {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-btn {
      background-color: #0066cc;
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: background 0.2s;
    }
    .print-btn:hover {
      background-color: #0052a3;
    }
    @media print {
      body {
        background-color: #fff;
        padding: 0;
      }
      .invoice-card {
        box-shadow: none;
        border: none;
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      ${isRefunded ? '<span style="color: #dc2626; font-weight: bold; font-size: 14px;">※本領収書は全額返金済のため無効です</span>' : ''}
    </div>
    <button class="print-btn" onclick="window.print()">このページを印刷する</button>
  </div>

  <div class="invoice-card">
    ${isRefunded ? '<div class="void-watermark">VOID / 返金済</div>' : ''}

    ${isRefunded ? `
    <div class="refund-notice-box">
      <div style="font-weight: bold; font-size: 15px; margin-bottom: 6px;">
        ⚠️ 【全額返金済・適格請求書（インボイス）として無効】
      </div>
      <div style="font-size: 13px; line-height: 1.6;">
        本取引は全額返金（Refund）が完了しているため、本領収書は<b>無効（VOID）</b>となります。<br>
        消費税法上の仕入税額控除の対象外です。税務申告・会計処理にはご使用いただけません。<br>
        ${params.refundedAtFormatted ? `<b>返金完了日時:</b> ${params.refundedAtFormatted}` : ''}
      </div>
    </div>
    ` : ''}

    <div class="header">
      <div>
        <h1>
          領収書
          ${isRefunded ? '<span class="refund-badge">無効 / 返金済</span>' : ''}
        </h1>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
          ${isRefunded ? '適格返還明細（返金済のため仕入税額控除の対象外）' : '適格請求書（インボイス）'}
        </p>
      </div>
      <div class="company-details">
        <strong>Kigyou-List (TQC株式会社)</strong><br>
        〒171-0022 東京都豊島区南池袋２丁目３３－６ 佐藤ビル３F<br>
        TEL / FAX: (03) 6907-1219 / (03) 6701-2399<br>
        登録番号: T4013301048678<br>
        EMAIL: info@kigyoulist.com<br>
        website: kigyoulist.com
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h3>宛先</h3>
        <p><strong>${params.billingName ? params.billingName : `${params.email} 様`}</strong></p>
        ${params.billingAddress ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #555;">${params.billingAddress}</p>` : '<p>※ご登録のメールアドレス</p>'}
        ${params.billingPhone ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #555;">TEL: ${params.billingPhone}</p>` : ''}
        ${params.billingTaxId ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #555;">登録番号: ${params.billingTaxId}</p>` : ''}
      </div>
      <div class="meta-box" style="text-align: right;">
        <h3>詳細</h3>
        <p>領収書番号: ${params.paymentId}</p>
        <p>発行日: ${params.formattedDate}</p>
        <p>お支払い方法: クレジットカード</p>
        <p>ステータス: <strong>${isRefunded ? '<span style="color: #dc2626;">全額返金済 (VOID)</span>' : '<span style="color: #16a34a;">決済完了</span>'}</strong></p>
      </div>
    </div>

    <div class="total-display">
      <div class="total-label">${isRefunded ? '領収実質金額（返金処理済）' : '領収金額（税込）'}</div>
      <div class="total-amount">
        ${isRefunded ? `
          <span class="total-amount-strike">¥${params.priceJpy.toLocaleString()}-</span>
          <span>¥0-</span>
          <span style="font-size: 14px; font-weight: normal; color: #dc2626; display: block; margin-top: 4px;">
            (返金額: -¥${params.priceJpy.toLocaleString()})
          </span>
        ` : `
          ¥${params.priceJpy.toLocaleString()}-
        `}
      </div>
    </div>

    <table class="item-table">
      <thead>
        <tr>
          <th>品名 / サービス名</th>
          <th class="num">単価 (税抜)</th>
          <th class="num">数量</th>
          <th class="num">金額 (税込)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            ${params.priceName} (+${params.linesAdded.toLocaleString()} 行)
            ${isRefunded ? '<span style="color: #dc2626; font-size: 12px; margin-left: 6px;">[失効・返金]</span>' : ''}
          </td>
          <td class="num">${isRefunded ? '<span style="text-decoration: line-through; color: #94a3b8;">' : ''}¥${params.taxExclusivePrice.toLocaleString()}${isRefunded ? '</span>' : ''}</td>
          <td class="num">${isRefunded ? '0' : '1'}</td>
          <td class="num">${isRefunded ? '<span style="color: #dc2626;">¥0</span>' : `¥${params.priceJpy.toLocaleString()}`}</td>
        </tr>
      </tbody>
    </table>

    <table class="tax-breakdown">
      <tr>
        <td class="label">10%対象額 (税抜)</td>
        <td class="val">${isRefunded ? '¥0' : `¥${params.taxExclusivePrice.toLocaleString()}`}</td>
      </tr>
      <tr>
        <td class="label">消費税 (10%)</td>
        <td class="val">${isRefunded ? '¥0' : `¥${params.taxAmount.toLocaleString()}`}</td>
      </tr>
      <tr style="border-top: 1px solid #ddd; font-size: 16px;">
        <td class="label" style="font-weight: bold;">合計金額 (税込)</td>
        <td class="val" style="font-weight: bold; color: ${isRefunded ? '#dc2626' : '#0066cc'};">
          ${isRefunded ? '¥0 (返金済)' : `¥${params.priceJpy.toLocaleString()}`}
        </td>
      </tr>
    </table>

    <div class="footer-note">
      ${isRefunded ? `
        <p style="color: #dc2626; font-weight: bold;">※本取引は Stripe を通じて全額返金処理が完了しております。適格請求書としては無効です。</p>
      ` : `
        <p>上記の通り領収いたしました。ご利用ありがとうございます。</p>
      `}
      <p style="margin-top: 10px; color: #999;">Kigyou-List - Easy B2B Leads Extraction Tool</p>
    </div>
  </div>
</body>
</html>`;
}
