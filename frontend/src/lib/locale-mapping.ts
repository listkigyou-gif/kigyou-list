export const prefectureJaToEn: Record<string, string> = {
  "北海道": "Hokkaido",
  "青森県": "Aomori",
  "岩手県": "Iwate",
  "宮城県": "Miyagi",
  "秋田県": "Akita",
  "山形県": "Yamagata",
  "福島県": "Fukushima",
  "茨城県": "Ibaraki",
  "栃木県": "Tochigi",
  "群馬県": "Gunma",
  "埼玉県": "Saitama",
  "千葉県": "Chiba",
  "東京都": "Tokyo",
  "神奈川県": "Kanagawa",
  "新潟県": "Niigata",
  "富山県": "Toyama",
  "石川県": "Ishikawa",
  "福井県": "Fukui",
  "山梨県": "Yamanashi",
  "長野県": "Nagano",
  "岐阜県": "Gifu",
  "静岡県": "Shizuoka",
  "愛知県": "Aichi",
  "三重県": "Mie",
  "滋賀県": "Shiga",
  "京都府": "Kyoto",
  "大阪府": "Osaka",
  "兵庫県": "Hyogo",
  "奈良県": "Nara",
  "和歌山県": "Wakayama",
  "鳥取県": "Tottori",
  "島根県": "Shimane",
  "岡山県": "Okayama",
  "広島県": "Hiroshima",
  "山口県": "Yamaguchi",
  "徳島県": "Tokushima",
  "香川県": "Kagawa",
  "愛媛県": "Ehime",
  "高知県": "Kochi",
  "福岡県": "Fukuoka",
  "佐賀県": "Saga",
  "長崎県": "Nagasaki",
  "熊本県": "Kumamoto",
  "大分県": "Oita",
  "宮崎県": "Miyazaki",
  "鹿児島県": "Kagoshima",
  "沖縄県": "Okinawa"
};

export const industryJaToEn: Record<string, string> = {
  // Major divisions
  "農業，林業": "Agriculture & Forestry",
  "農業,林業": "Agriculture & Forestry",
  "漁業": "Fisheries",
  "鉱業，採石業，砂利採取業": "Mining, Quarrying & Gravel Extraction",
  "鉱業,採石業,砂利採取業": "Mining, Quarrying & Gravel Extraction",
  "建設業": "Construction",
  "製造業": "Manufacturing",
  "電気・ガス・熱供給・水道業": "Electricity, Gas, Heat Supply & Water",
  "電気,ガス,熱供給,水道業": "Electricity, Gas, Heat Supply & Water",
  "情報通信業": "Information & Communications",
  "運輸業，郵便業": "Transport & Postal Services",
  "運輸業,郵便業": "Transport & Postal Services",
  "卸売業，小売業": "Wholesale & Retail Trade",
  "卸売業,小売業": "Wholesale & Retail Trade",
  "金融業，保険業": "Finance & Insurance",
  "金融業,保険業": "Finance & Insurance",
  "不動産業，物品賃貸業": "Real Estate & Goods Rental",
  "不動産業,物品賃貸業": "Real Estate & Goods Rental",
  "学術研究，専門・技術サービス業": "Scientific Research, Professional & Technical Services",
  "学術研究,専門・技術サービス業": "Scientific Research, Professional & Technical Services",
  "宿泊業，飲食サービス業": "Accommodations & Food Services",
  "宿泊業,飲食サービス業": "Accommodations & Food Services",
  "生活関連サービス業，娯楽業": "Living-related, Personal & Amusement Services",
  "生活関連サービス業,娯楽業": "Living-related, Personal & Amusement Services",
  "教育，学習支援業": "Education, Learning Support",
  "教育,学習支援業": "Education, Learning Support",
  "医療，福祉": "Medical, Health Care & Welfare",
  "医療,福祉": "Medical, Health Care & Welfare",
  "複合サービス事業": "Compound Services",
  "サービス業（他に分類されないもの）": "Services (not elsewhere classified)",
  "サービス業(他に分類されないもの)": "Services (not elsewhere classified)",
  "公務（他に分類されるものを除く）": "Government Services",
  "公務(他に分類されるものを除く)": "Government Services",
  "分類不能の産業": "Unclassifiable Industries",

  // Common medium divisions (to enhance select dropdown visual polish)
  "農業": "Agriculture",
  "林業": "Forestry",
  "建設 / 設備": "Construction / Equipment",
  "総合工事業": "General Construction Contracting",
  "職別工事業(設備工事業を除く)": "Specialized Construction Contracting",
  "設備工事業": "Equipment Installation Work",
  "繊維工業": "Textile Mill Products",
  "化学工業": "Chemical & Allied Products",
  "鉄鋼業": "Iron & Steel Industry",
  "非鉄金属製造業": "Non-ferrous Metals Manufacturing",
  "金属製品製造業": "Fabricated Metal Products",
  "はん用機械器具製造業": "General-purpose Machinery Manufacturing",
  "生産用機械器具製造業": "Production Machinery Manufacturing",
  "業務用機械器具製造業": "Business Machinery Manufacturing",
  "電子部品・デバイス・電子回路製造業": "Electronic Components & Devices",
  "電気機械器具製造業": "Electrical Machinery & Equipment",
  "情報通信機械器具製造業": "Information & Communication Equipment",
  "輸送用機械器具製造業": "Transportation Equipment Manufacturing",
  "通信業": "Communications",
  "放送業": "Broadcasting",
  "情報サービス業": "Information Services / IT",
  "インターネット付随サービス業": "Internet Portal & Related Services",
  "映像・音声・文字情報制作業": "Video, Audio & Publishing Services",
  "鉄道業": "Railway Transport",
  "道路旅客運送業": "Road Passenger Transport",
  "道路貨物運送業": "Road Freight Transport",
  "水運業": "Water Transport",
  "航空運輸業": "Air Transport",
  "倉庫業": "Warehousing & Storage",
  "運輸に付帯するサービス業": "Services Incidental to Transport",
  "郵便業(信書便送達業を含む)": "Postal & Mail Services",
  "各種商品卸売業": "Wholesale Trade, General Merchandise",
  "繊維・衣服等卸売業": "Wholesale Trade, Textiles & Apparel",
  "飲食料品卸売業": "Wholesale Trade, Food & Beverages",
  "建築材料，鉱物・金属材料等卸売業": "Wholesale Trade, Building Materials & Ores",
  "機械器具卸売業": "Wholesale Trade, Machinery & Equipment",
  "その他の卸売業": "Other Wholesale Trade",
  "各種商品小売業": "Retail Trade, General Merchandise",
  "織物・衣服・身の回り品小売業": "Retail Trade, Dry Goods, Apparel",
  "飲食料品小売業": "Retail Trade, Food & Beverages",
  "機械器具小売業": "Retail Trade, Machinery & Equipment",
  "その他の小売業": "Other Retail Trade",
  "無店舗小売業": "Non-store Retailers",
  "銀行業": "Banking",
  "不動産取引業": "Real Estate Transactions",
  "不動産賃貸業・管理業": "Real Estate Leasing & Management",
  "物品賃貸業": "Goods Rental & Leasing",
  "専門サービス業（他に分類されないもの）": "Professional Services (NEC)",
  "広告業": "Advertising Services",
  "技術サービス業（他に分類されないもの）": "Technical Services (NEC)",
  "宿泊業": "Hotel & Accommodations",
  "飲食店": "Eating & Drinking Places",
  "持ち帰り・配達飲食サービス業": "Take-out & Delivery Food Services",
  "洗濯・理容・美容・浴場業": "Laundry, Barber, Beauty & Bath Services",
  "その他の生活関連サービス業": "Other Personal Services",
  "娯楽業": "Amusement & Recreation Services",
  "学校教育": "School Education",
  "医療業": "Medical Services",
  "社会保険・社会福祉・介護事業": "Social Insurance & Welfare Services",
  "専門サービス業": "Professional Services",
  "技術サービス業": "Technical Services",
  "協同組合（他に分類されないもの）": "Cooperative Associations (NEC)",
  "政治・経済・文化団体": "Political, Economic & Cultural Organizations",
  "宗教": "Religion",
  "その他のサービス業": "Other Services",

  // Missing JSIC Medium divisions
  "水産養殖業": "Aquaculture",
  "食料品製造業": "Food Manufacturing",
  "飲料・たばこ・飼料製造業": "Beverage, Tobacco & Feed Manufacturing",
  "木材・木製品製造業": "Wood & Wood Products Manufacturing",
  "家具・装備品製造業": "Furniture & Fixtures Manufacturing",
  "パルプ・紙・紙加工品製造業": "Pulp, Paper & Paper Products Manufacturing",
  "印刷・同関連業": "Printing & Allied Industries",
  "石油製品・石炭製品製造業": "Petroleum & Coal Products Manufacturing",
  "プラスチック製品製造業": "Plastic Products Manufacturing",
  "ゴム製品製造業": "Rubber Products Manufacturing",
  "なめし革・同製品・毛皮製造業": "Leather, Tanning & Leather Products Manufacturing",
  "窯業・土石製品製造業": "Ceramics, Stone & Clay Products Manufacturing",
  "その他の製造業": "Miscellaneous Manufacturing",
  "電気業": "Electricity",
  "ガス業": "Gas",
  "熱供給業": "Heat Supply",
  "水道業": "Water",
  "インターネット附随サービス業": "Internet Portal & Related Services",
  "郵便業": "Postal Services",
  "協同組織金融業": "Cooperative Financial Institutions",
  "貸金業，クレジットカード業等非預金信用機関": "Non-deposit Credit Institutions",
  "貸金業,クレジットカード業等非預金信用機関": "Non-deposit Credit Institutions",
  "金融商品取引業，商品先物取引業": "Financial Instruments & Commodity Futures Trading",
  "金融商品取引業,商品先物取引業": "Financial Instruments & Commodity Futures Trading",
  "補助的金融業等": "Auxiliary Financial Services",
  "保険業": "Insurance",
  "学術・開発研究機関": "Scientific & Development Research Institutes",
  "その他の教育，学習支援業": "Other Education & Learning Support Services",
  "保健衛生": "Public Health & Hygiene",
  "郵便局": "Post Offices",
  "協同組合": "Cooperative Associations",
  "廃棄物処理業": "Waste Disposal & Treatment Services",
  "自動車整備業": "Automobile Maintenance & Repair Services",
  "機械等修理業": "Machinery & Equipment Repair Services",
  "職業紹介・労働者派遣業": "Employment & Worker Dispatching Services",
  "その他の事業サービス業": "Other Business Services",
  "外国公務": "Foreign Government Services",
  "国家公務": "National Government Services",
  "地方公務": "Local Government Services",
  "未分類": "Unclassified",
  "漁業（水産養殖業を除く）": "Fisheries (except Aquaculture)",
  "木材・木製品製造業（家具を除く）": "Wood & Wood Products Manufacturing (except Furniture)",
  "プラスチック製品製造業（別掲を除く）": "Plastic Products Manufacturing (except otherwise classified)",
  "運輸に附帯するサービス業": "Services Incidental to Transport",
  "郵便業（信書便事業を含む）": "Postal Services (including correspondence delivery)",
  "保険業（保険媒介代理業，保険サービス業を含む）": "Insurance (including insurance agents and brokers, and insurance services)",
  "機械等修理業（別掲を除く）": "Machinery & Equipment Repair Services (except otherwise classified)"
};

export const translatePosition = (pos: string | null): string => {
  if (!pos) return "";
  const posMap: Record<string, string> = {
    "代表取締役": "Representative Director",
    "代表取締役社長": "Representative Director & President",
    "代表社員": "Representative Partner",
    "代表": "Representative",
    "取締役": "Director",
    "社長": "President",
    "執行役員": "Executive Officer",
    "CEO": "CEO"
  };
  return posMap[pos] || pos;
};

export const formatEnglishAddress = (comp: {
  prefecture_name?: string | null;
  city_name?: string | null;
  street_address?: string | null;
  postal_code?: string | null;
}): string => {
  const pref = comp.prefecture_name ? (prefectureJaToEn[comp.prefecture_name] || comp.prefecture_name) : "";
  let city = comp.city_name || "";
  if (city.endsWith("区")) city = city.replace(/区$/, "-ku");
  else if (city.endsWith("市")) city = city.replace(/市$/, "-shi");
  else if (city.endsWith("町")) city = city.replace(/町$/, "-machi");
  else if (city.endsWith("村")) city = city.replace(/村$/, "-mura");
  
  const street = comp.street_address || "";
  const zip = comp.postal_code ? `〒${comp.postal_code}` : "";
  
  const parts = [street, city, pref, zip, "Japan"].filter(Boolean);
  return parts.join(", ");
};

export const formatEnglishDate = (dateStr: string | null): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return d.toLocaleDateString('en-US', options);
    }
  }
  return dateStr;
};
