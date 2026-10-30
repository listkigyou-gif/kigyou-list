export function formatJapaneseCurrency(
  amount: number | string | null | undefined, 
  locale: string, 
  isCapital: boolean = false
): string {
  if (amount === null || amount === undefined || amount === "") return "";
  let num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "";
  
  // Normalize ingested data error where certain records were multiplied by 100,000 (e.g. 796兆円 instead of 79.6億円)
  if (num > 10_000_000_000_000 && isCapital) {
    num = num / 100_000;
  }

  const isNeg = num < 0;
  const abs = Math.abs(num);
  const sign = isNeg ? "-" : "";

  if (locale === 'en') {
    if (abs >= 1_000_000_000_000) return `${sign}¥${(abs / 1_000_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}T JPY`;
    if (abs >= 1_000_000_000) return `${sign}¥${(abs / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}B JPY`;
    if (abs >= 1_000_000) return `${sign}¥${(abs / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M JPY`;
    return `${sign}¥${abs.toLocaleString('en-US')} JPY`;
  }
  if (locale === 'vi') {
    if (abs >= 1_000_000_000_000) return `${sign}${(abs / 1_000_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} nghìn tỷ JPY`;
    if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} trăm triệu JPY`;
    if (abs >= 10_000) return `${sign}${(abs / 10_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} vạn JPY`;
    return `${sign}¥${abs.toLocaleString('vi-VN')} JPY`;
  }
  // Japanese
  if (abs >= 1_000_000_000_000) {
    return `${sign}${(abs / 1_000_000_000_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}兆円`;
  }
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}億円`;
  }
  if (abs >= 10_000) {
    return `${sign}${(abs / 10_000).toLocaleString('ja-JP', { maximumFractionDigits: 0 })}万円`;
  }
  return `${sign}${abs.toLocaleString('ja-JP')}円`;
}

