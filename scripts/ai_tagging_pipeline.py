#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-list: Integrated AI-Tagging Pipeline (Groq & SQLite Version)
====================================================================
Processes raw corporate recruitment text from raw_hellowork (industry thô only),
website summaries (business_summary thô), and G-Biz business signals (patents, certifications, awards)
to map them to Japan Standard Industrial Classifications (JSIC).
Updates the 'jigyo_shumoku' (事業種目) tags in the Master table (companies)
and the 'company_industries' mapping table, accumulating new tags without deleting old ones.
Supports both active Groq API mode and offline rule-based fallback mode.
Console outputs are ASCII/English to prevent CP1252 Windows encoding crashes.
"""

import os
import sys
import sqlite3
import json
import re

# Force sys.stdout to write UTF-8 to prevent UnicodeEncodeErrors when printing Vietnamese on Windows CMD
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass
import urllib.request
import urllib.error
from datetime import datetime

DB_PATH = "kigyou-list.db"

# List of valid JSIC codes (2-digit Medium Category Codes) for verification
VALID_JSIC_CODES = {
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
    "31", "32", "33", "34", "35", "36", "37", "38", "39", "40",
    "41", "42", "43", "44", "45", "46", "47", "48", "49", "50",
    "51", "52", "53", "54", "55", "56", "57", "58", "59", "60",
    "61", "62", "63", "64", "65", "66", "67", "68", "69", "70",
    "71", "72", "73", "74", "75", "76", "77", "78", "79", "80",
    "81", "82", "83", "84", "85", "86", "87", "88", "89", "90",
    "91", "92", "93", "94", "95", "96", "97", "98", "99"
}

# Global state tracking if the Groq API has been rate-limited or run out of credits
API_SUSPENDED = False

# Offline mapping dictionary from JSIC code to Medium Category Name
JSIC_NAME_MAP = {
    "01": "農業",
    "02": "林業",
    "03": "漁業",
    "04": "水産養殖業",
    "05": "鉱業，採石業，砂利採取業",
    "06": "総合工事業",
    "07": "職別工事業",
    "08": "設備工事業",
    "09": "食料品製造業",
    "10": "飲料・たばこ・飼料製造業",
    "11": "繊維工業",
    "12": "木材・木製品製造業",
    "13": "家具・装備品製造業",
    "14": "パルプ・紙・紙加工品製造業",
    "15": "印刷・同関連業",
    "16": "化学工業",
    "17": "石油製品・石炭製品製造業",
    "18": "プラスチック製品製造業",
    "19": "ゴム製品製造業",
    "20": "なめし革・同製品・毛皮製造業",
    "21": "窯業・土石製品製造業",
    "22": "鉄鋼業",
    "23": "非鉄金属製造業",
    "24": "金属製品製造業",
    "25": "はん用機械器具製造業",
    "26": "生産用機械器具製造業",
    "27": "業務用機械器具製造業",
    "28": "電子部品・デバイス・電子回路製造業",
    "29": "電気機械器具製造業",
    "30": "情報通信機械器具製造業",
    "31": "輸送用機械器具製造業",
    "32": "その他の製造業",
    "33": "電気業",
    "34": "ガス業",
    "35": "熱供給業",
    "36": "水道業",
    "37": "通信業",
    "38": "放送業",
    "39": "情報サービス業",
    "40": "インターネット附随サービス業",
    "41": "映像・音声・文字情報制作業",
    "42": "鉄道業",
    "43": "道路旅客運送業",
    "44": "道路貨物運送業",
    "45": "水運業",
    "46": "航空運輸業",
    "47": "倉庫業",
    "48": "運輸に附帯するサービス業",
    "49": "郵便業",
    "50": "各種商品卸売業",
    "51": "繊維・衣服等卸売業",
    "52": "飲食料品卸売業",
    "53": "建築材料，鉱物・金属材料等卸売業",
    "54": "機械器具卸売業",
    "55": "その他の卸売業",
    "56": "各種商品小売業",
    "57": "織物・衣服・身の回り品小売業",
    "58": "飲食料品小売業",
    "59": "機械器具小売業",
    "60": "その他の小売業",
    "61": "無店舗小売業",
    "62": "銀行業",
    "63": "協同組織金融業",
    "64": "貸金業，クレジットカード業等非預金信用機関",
    "65": "金融商品取引業，商品先物取引業",
    "66": "補助的金融業等",
    "67": "保険業",
    "68": "不動産取引業",
    "69": "不動産賃貸業・管理業",
    "70": "物品賃貸業",
    "71": "学術・開発研究機関",
    "72": "専門サービス業",
    "73": "広告業",
    "74": "技術サービス業",
    "75": "宿泊業",
    "76": "飲食店",
    "77": "持ち帰り・配達飲食サービス業",
    "78": "洗濯・理容・美容・浴場業",
    "79": "その他の生活関連サービス業",
    "80": "娯楽業",
    "81": "学校教育",
    "82": "その他の教育，学習支援業",
    "83": "医療業",
    "84": "保健衛生",
    "85": "社会福祉・介護事業",
    "86": "郵便局",
    "87": "協同組合",
    "88": "廃棄物処理業",
    "89": "自動車整備業",
    "90": "機械等修理業",
    "91": "職業紹介・労働者派遣業",
    "92": "その他の事業サービス業",
    "93": "政治・経済・文化団体",
    "94": "宗教",
    "95": "その他のサービス業",
    "96": "外国公務",
    "97": "国家公務",
    "98": "地方公務",
    "99": "分類不能 of 産業"
}

def to_half_width(text):
    """Convert zenkaku characters (full-width) to hankaku (half-width) for numbers, hyphens, and punctuation."""
    if not text:
        return ""
    text = str(text)
    zenkaku = "０１２３４５６７８９－ー（）＠．，"
    hankaku = "0123456789--()@.,"
    trans_table = str.maketrans(zenkaku, hankaku)
    text = text.translate(trans_table)
    text = text.replace("　", " ").replace("（", "(").replace("）", ")")
    return text.strip()

def load_env():
    """Load environment variables from .env.local and .env files."""
    for env_file in [".env.local", ".env"]:
        if os.path.exists(env_file):
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            key, val = line.split("=", 1)
                            os.environ[key.strip()] = val.strip()
            except Exception as e:
                print(f"[!] Error loading {env_file}: {e}")

def get_db_connection():
    """Establish SQLite database connection with WAL mode and timeout."""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30.0)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA cache_size=-64000;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn
    except Exception as e:
        print(f"[-] Could not connect to SQLite database: {e}")
        sys.exit(1)

def run_offline_tagging(company_name, industry, website_summary, signals_summary):
    """
    Offline/Deterministic Rule-Based Fallback Mapper.
    Uses localized keyword matching against raw text to assign highly accurate
    JSIC codes and clean Japanese industry tags without calling the live API.
    """
    company_name = (company_name or "").strip()
    industry = (industry or "").strip()
    web_sum = (website_summary or "").strip()
    sig_sum = (signals_summary or "").strip()
    
    combined_text = f"{company_name} {industry} {web_sum} {sig_sum}"
    assigned_codes = []
    
    # Highly detailed offline classification rules covering all standard sectors
    rules = [
        # G. Information & Communications (39: Information services, 40: Internet services, 37: Telecom, 38: Broadcast, 41: Video/Sound/Text production)
        (r"システム|エンジニア|開発|プログラマ|ＩＴ|Ｉｔ|it|software|ソフト|情報サービス|アプリ|パッケージ|ＳＩｅｒ|ネットワーク|クラウド|データセンター|プログラミング|web制作|ウェブ制作|iot|ai開発|デジタルトランスフォーメーション|dx|インテグレーション", "39"),
        (r"インターネット|ウェブサイト|ポータル|ＥＣサイト|ホームページ|ｗｅｂ|Webサービス|ドメイン|サーバー|ecサイト|ネットショップ|ソーシャルゲーム|オンラインゲーム|アフィリエイト|メディア運営|sns", "40"),
        (r"通信|携帯キャリア|回線|光ファイバー|プロバイダ|電気通信|基地局|テレコム|ip電話", "37"),
        (r"放送|テレビ|ラジオ|ＣＡＴV|番組制作|有線放送|cm制作|配信", "38"),
        (r"映像制作|映画|アニメ|音楽|レコード|出版|編集|デザイン|書籍|グラフィック|映像|デジタルコンテンツ|キャラクター|漫画", "41"),

        # D. Construction (06: General construction, 07: Special construction, 08: Equipment installation)
        (r"建設|建築|施工管理|土木|現場|大工|工務店|リフォーム|とび|解体|配管|塗装工事|防水工事|ハウスメーカー|改修工事|造園|耐震|土木工事|外構|左官|基礎工事|足場", "06"),
        (r"設備工事|電気工事|管工事|冷暖房|空調設備|配管工事|電気通信工事|消防施設工事|ダクト|エレベーター工事|換気設備", "08"),
        (r"職別工事|鉄骨|石工|タイル工事|屋根工事|ガラス工事|内装仕上|板金工事|建具工事|畳", "07"),

        # P. Medical & Welfare (85: Social insurance/Social welfare/Care, 83: Medical, 84: Public health)
        (r"介護|福祉|ヘルパー|ケアマネ|デイサービス|高齢者|施設|ケア|サ高住|障害者支援|グループホーム|老人ホーム|保育園|保育所|託児所|児童発達支援|放課後等デイ|児童クラブ|福祉用具", "85"),
        (r"看護|病院|クリニック|歯科|医師|医療|リハビリ|セラピスト|接骨|整骨|医院|透析|調剤薬局|内科|外科|小児科|眼科|耳鼻科|精神科|メンタルクリニック|ドクター", "83"),
        (r"保健所|検疫|健診センター|健康診断|衛生管理|予防接種|産業医", "84"),

        # M. Accommodations & Food Services (76: Restaurants, 77: Food delivery/Takeout, 75: Hotels/Lodging)
        (r"調理|ホールスタッフ|飲食店|レストラン|居酒屋|カフェ|ラーメン|接客|厨房|バル|バー|食堂|割烹|寿司|うどん|そば|中華|イタリアン|フレンチ|焼肉|カフェ|喫茶|焼き鳥|居酒屋", "76"),
        (r"デリバリー|テイクアウト|持ち帰り|弁当屋|ケータリング|仕出し|宅配|惣菜|デリ", "77"),
        (r"宿泊|ホテル|旅館|ゲストハウス|ペンション|宿|フロント|ビジネスホテル|カプセルホテル|リゾートホテル|ホステル", "75"),

        # H. Transport & Postal Activities (44: Road freight, 43: Road passenger, 42: Railways, 47: Warehousing, 49: Postal/Courier)
        (r"運送|トラック|ドライバー|配達|配送|運転手|運輸|軽貨物|貨物運送|陸運|引っ越し|物流|運賃|ロジスティクス|トレーラー", "44"),
        (r"タクシー|観光バス|高速バス|路線バス|旅客運送|ハイヤー|送迎バス|代行運転", "43"),
        (r"鉄道|電車|私鉄|地下鉄|軌道|jr|モノレール", "42"),
        (r"倉庫|トランクルーム|冷蔵倉庫|保管庫|物流センター|発送代行|梱包|検品|仕分け", "47"),
        (r"郵便|信書便|ゆうパック|レターパック", "49"),

        # R. Services (not elsewhere classified) (91: Job placement/Worker dispatch, 92: Other business services, 88: Waste disposal, 89: Automobile maintenance, 90: Repair)
        (r"派遣|職業紹介|紹介予定|人材紹介|人材派遣|求人サイト|ヘッドハンティング|キャリアコンサル|求人広告|アウトソーシング", "91"),
        (r"警備|ガードマン|ビルメンテナンス|ビル清掃|害虫駆除|コールセンター|事務代行|アウトソーシング|受付|駐車場管理|消毒", "92"),
        (r"廃棄物|ゴミ回収|クリーン|産廃|清掃|リサイクル|解体回収|遺品整理|不用品回収|浄化槽|環境測定", "88"),
        (r"自動車整備|板金|塗装|カーリペア|車検|ディーラー整備|タイヤ交換|オイル交換|カスタム|カーオーディオ", "89"),
        (r"修理|時計修理|家具修理|電気製品修理|メンテナンス|オーバーホール|靴修理|洋服リフォーム|鍵交換", "90"),

        # O. Education & Learning Support (81: School education, 82: Other education/Learning support)
        (r"学校教育|大学|高校|中学校|小学校|特別支援学校|幼稚園", "81"),
        (r"教育|講師|塾|指導|教員|家庭教師|英会話|各種教室|カルチャースクール|セミナー|そろばん|ピアノ教室|ダンススクール|資格取得", "82"),

        # E. Manufacturing
        (r"食品製造|加工|パン|惣菜|仕込み|食品工場|製菓|菓子|水産加工|食肉|豆腐|納豆|漬物|洋菓子|和菓子|製粉|製油", "09"),
        (r"飲料製造|酒造|醸造|清涼飲料|茶|たばこ|飼料製造|ペットフード製造|ビール|ワイナリー", "10"),
        (r"繊維|紡績|織物|染色|糸|縫製|衣類製造|ニット|刺繍|アパレル製造", "11"),
        (r"木材|製材|木箱|木製品|合板", "12"),
        (r"家具|建具|オフィス家具|インテリア製造|装備品|ベッド|机|椅子", "13"),
        (r"パルプ|製紙|ダンボール|紙加工品|トイレットペーパー", "14"),
        (r"印刷|製本|印刷業|パンフレット印刷|オフセット印刷|印刷技術|シール印刷|シルクスクリーン|パッケージ印刷", "15"),
        (r"化学|医薬品製造|化粧品製造|塗料|インキ|化学工業|樹脂製造|接着剤|バイオテクノロジー|農薬|石鹸|洗剤", "16"),
        (r"プラスチック|成形|射出成形|プラスチック製品|ブロー成形|真空成形", "18"),
        (r"鉄鋼|製鉄|鋳物|鋼材|高炉|鋳造|鍛造|鉄板|製鋼|合金", "22"),
        (r"金属製品|サッシ|金型|ネジ|めっき|ボルト|金属加工|プレス加工|製缶|溶接|切削|研磨|板金加工|アルミ|ステンレス", "24"),
        (r"一般機械|ボイラ|エンジン製造|ピストン|はん用機械|ベアリング|バルブ|油圧機器|コンプレッサー", "25"),
        (r"生産用機械|工作機械|半導体製造装置|農業用機械|繊維機械|産業用ロボット|射出成形機|包装機械|食品加工機械", "26"),
        (r"電気機械|モーター|発電機|変圧器|配電盤|乾電池|照明器具|家電製品製造|スイッチ|基板実装|インダクタ", "29"),
        (r"情報通信機械|パソコン製造|携帯電話製造|ラジオ|テレビ製造|ルーター|スマートデバイス", "30"),
        (r"輸送用機械|自動車|カーパーツ|造船|航空機|自転車製造|自動車部品|造船所|マフラー|クラッチ|ブレーキ|車体", "31"),

        # I. Wholesale & Retail Trade (50-55: Wholesale, 56-61: Retail)
        (r"総合卸|卸売|商社|総合商社|貿易商社|問屋", "50"),
        (r"食料品卸売|飲料卸売|水産卸売|青果卸売|食品商社|食品卸|酒類卸", "52"),
        (r"機械卸売|自動車卸売|電機卸売|部品卸|建材卸|化学品卸|専門商社", "54"),
        (r"百貨店|デパート|総合小売|ショッピングセンター", "56"),
        (r"スーパー|八百屋|肉屋|魚屋|惣菜屋|食料品小売|青果店|鮮魚店|精肉店|スーパーマーケット|コンビニエンスストア|コンビニ", "58"),
        (r"小売|アパレル|洋服屋|ドラッグストア|書店|ペットショップ|花屋|販売|店舗|レジ|ブティック|メガネ店|家電量販店|家具店|玩具店|文具店", "60"),
        (r"無店舗|通信販売|ネットショップ|テレビショッピング|カタログ通販|ＥＣ販売|ネットデリバリー|ecサイト販売|ヤフオク|メルカリ物販", "61"),

        # J. Finance & Insurance (62-66: Finance, 67: Insurance)
        (r"銀行|信託|政府系金融|信用金庫|信金|地銀|メガバンク", "62"),
        (r"消費者金融|クレジットカード|信販|リース|ローン|キャッシング|ファクタリング", "64"),
        (r"証券|投資信託|先物取引|証券業|アセットマネジメント|fx", "65"),
        (r"保険|生命保険|損害保険|代理店|保険ショップ|生保|損保|共済|アフラック|かんぽ", "67"),

        # K. Real Estate & Goods Rental and Leasing (68: Real estate trading, 69: Real estate leasing/management, 70: Goods rental/leasing)
        (r"不動産取引|不動産仲介|宅建|マンション販売|土地販売|デベロッパー|不動産売買|戸建て販売|ハウスメーカー仲介", "68"),
        (r"アパート管理|不動産管理|マンション管理|賃貸|アパート経営|大家|ビル管理|テナント管理|コインランドリー運営|駐車場運営", "69"),
        (r"レンタル|物品賃貸|カーリース|衣装レンタル|ＤＶＤレンタル|レンタルショップ|リース業|建機レンタル|レンタカー", "70"),

        # L. Scientific Research, Professional & Technical Services (71: Research, 72: Professional services, 73: Advertising, 74: Technical services)
        (r"研究所|学術研究|バイオ研究|開発研究|大学研究所|シンクタンク", "71"),
        (r"弁護士|司法書士|行政書士|税理士|公認会計士|特許事務所|コンサルティング|法律事務所|会計事務所|社労士|弁理士|特許業務法人|コンサルタント", "72"),
        (r"広告|プロモーション|マーケティング|ポスター|チラシ|メディアバイイング|広告代理店|パブリシティ|pr会社|ポスティング|看板効果", "73"),
        (r"技術サービス|建築設計|測量|土木設計|計量|検査|デザイン業|製図|cadオペレーター|非破壊検査|地質調査", "74"),

        # N. Living-related & Personal Services and Amusement Services (78: Laundry/Beauty, 79: Other life services, 80: Amusement)
        (r"美容室|理容室|ヘアサロン|エステ|ネイル|洗濯|クリーニング|銭湯|浴場|理髪|散髪|スタイリスト|アイリスト|まつエク|マッサージ", "78"),
        (r"旅行代理店|葬儀|ウエディング|ブライダル|家事代行|冠婚葬祭|生活サービス|結婚相談所|ハウスクリーニング|ペットサロン|ペットホテル", "79"),
        (r"カラオケ|ゲームセンター|遊園地|パチンコ|ゴルフ場|フィットネス|スポーツジム|劇団|映画館|エンターテインメント|競馬|アミューズメント|ヨガスタジオ|ボルダリング|雀荘|温泉施設", "80"),

        # A. Agriculture & Forestry (01: Agriculture, 02: Forestry)
        (r"農業|農園|栽培|米|野菜|果物|畜産|酪農|養鶏|農家|稲作|ビニールハウス|牧場|茶園", "01"),
        (r"林業|伐採|素材生産|植林|木材伐採", "02"),

        # B. Fisheries (03: Fisheries, 04: Aquaculture)
        (r"漁業|漁師|沿岸漁業|遠洋漁業|巻き網|一本釣り", "03"),
        (r"養殖|水産養殖|ノリ養殖|真珠養殖|牡蠣養殖", "04"),

        # C. Mining, Quarrying & Gravel Extraction (05: Mining/Quarrying)
        (r"採石|砂利|鉱業|鉱山|粘土|砕石|石炭|金山", "05"),
    ]
    
    matched_codes = []
    for pattern, code in rules:
        if re.search(pattern, combined_text, re.IGNORECASE):
            assigned_codes.append(code)
            matched_codes.append(code)
            
    # Deduplicate and sort
    assigned_codes = sorted(list(set(assigned_codes)))
    
    is_fallback = False
    # Default fallback if no keywords matched
    if not assigned_codes:
        assigned_codes.append("95")
        is_fallback = True
        
    # Limit to max 3
    assigned_codes = assigned_codes[:3]
    
    # Translate codes to tags
    tags = [JSIC_NAME_MAP.get(c, "サービス業") for c in assigned_codes]
    
    return {
        "industry_codes": assigned_codes,
        "industry_tags": tags,
        "is_fallback": is_fallback
    }

def run_api_tagging_batch(api_key, batch_data):
    """
    Live AI-Tagging using Groq API (llama-3.3-70b-versatile) on a BATCH of companies.
    batch_data is a list of dicts: [{'corporate_number': ..., 'industry': ..., 'website_summary': ..., 'signals_summary': ...}]
    """
    global API_SUSPENDED
    if API_SUSPENDED:
        return None
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    
    # Minimize text inputs for cost and token reduction
    cleaned_batch = []
    for item in batch_data:
        cleaned_batch.append({
            "corporate_number": item["corporate_number"],
            "industry": (item["industry"] or "")[:100],
            "website_summary": (item["website_summary"] or "")[:200],
            "signals_summary": (item["signals_summary"] or "")[:150]
        })
        
    context_str = json.dumps(cleaned_batch, ensure_ascii=False, indent=2)
    
    prompt = f"""
You are an expert Japanese business classifier specializing in the Japan Standard Industrial Classification (JSIC - 日本標準産業分類).
Analyze the following batch of corporate input details to extract standard JSIC medium-category codes (2-digit numbers) and corresponding clean Japanese industry category tags for each company.

[BATCH OF COMPANIES TO CLASSIFY]:
{context_str}

[CRITICAL INSTRUCTIONS]:
1. For each item in the batch, you MUST select between 1 to 3 matching 2-digit medium-category codes from the standard JSIC taxonomy (range "01" to "99"). Do not return letters (like "R" or "G"), you MUST return the 2-digit code (e.g. "39" for Information Services, "06" for Construction, "76" for Restaurants, "85" for Caregiving/Welfare).
2. Avoid using code '95' (その他のサービス業) if you can find any other more specific industry category code. Only return '95' if no specific industry matches the input context at all.
3. Return the results mapped to their respective 'corporate_number'.

[OUTPUT FORMAT REQUIREMENT]:
You MUST return a clean JSON object ONLY. No markdown, no pre-text, no explanation, no formatting block wrappers. The response structure must be:
{{
  "results": [
    {{
      "corporate_number": "13-digit number",
      "industry_codes": ["code1", "code2"],
      "industry_tags": ["tag1", "tag2"]
    }},
    ...
  ]
}}
"""
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = response.read().decode("utf-8")
            res_json = json.loads(res_data)
            result_text = res_json["choices"][0]["message"]["content"].strip()
            data = json.loads(result_text)
            return data.get("results", [])
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"[-] Live Groq API HTTP Error: {e.code} - {e.reason} - {error_body}")
        
        is_limit_reached = (
            e.code == 429 or 
            e.code == 402 or
            "rate_limit" in error_body.lower() or
            "insufficient_funds" in error_body.lower() or
            "credit" in error_body.lower() or
            "balance" in error_body.lower()
        )
        
        if is_limit_reached:
            print("\n" + "!"*80)
            print("  [CẢNH BÁO NGUY HIỂM] PHÁT HIỆN CẠN KIỆT HẠN MỨC HOẶC TÀI KHOẢN HẾT TIỀN TRÊN GROQ!")
            print(f"  - Mã trạng thái HTTP: {e.code} ({e.reason})")
            print("  - Mọi cuộc gọi API tiếp theo sẽ bị ĐÌNH CHỈ NGAY LẬP TỨC trong phiên chạy này.")
            print("  - Hệ thống tự động chuyển hướng sang chế độ gán nhãn OFFLINE độ chính xác cao.")
            print("!"*80 + "\n")
            API_SUSPENDED = True
            
        return None
    except Exception as e:
        print(f"[-] Live Groq API call failed: {e}. Falling back to offline tagger.")
        return None

def run_gemini_tagging_batch(api_key, batch_data):
    """
    Live AI-Tagging using Google Gemini API (gemini-1.5-flash) on a BATCH of companies.
    """
    global API_SUSPENDED
    if API_SUSPENDED:
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {
        "Content-Type": "application/json"
    }
    
    # Minimize text inputs for cost and token reduction
    cleaned_batch = []
    for item in batch_data:
        cleaned_batch.append({
            "corporate_number": item["corporate_number"],
            "company_name": item["company_name"],
            "industry": (item["industry"] or "")[:100],
            "website_summary": (item["website_summary"] or "")[:250],
            "signals_summary": (item["signals_summary"] or "")[:150]
        })
        
    context_str = json.dumps(cleaned_batch, ensure_ascii=False, indent=2)
    
    prompt = f"""
You are an expert Japanese business classifier specializing in the Japan Standard Industrial Classification (JSIC - 日本標準産業分類).
Analyze the following batch of corporate input details to extract standard JSIC medium-category codes (2-digit numbers) and corresponding clean Japanese industry category tags for each company.

[BATCH OF COMPANIES TO CLASSIFY]:
{context_str}

[CRITICAL INSTRUCTIONS]:
1. For each item in the batch, you MUST select between 1 to 3 matching 2-digit medium-category codes from the standard JSIC taxonomy (range "01" to "99"). Do not return letters (like "R" or "G"), you MUST return the 2-digit code (e.g. "39" for Information Services, "06" for Construction, "76" for Restaurants, "85" for Caregiving/Welfare).
2. Avoid using code '95' (その他のサービス業) if you can find any other more specific industry category code. Only return '95' if no specific industry matches the input context at all.
3. Return the results mapped to their respective 'corporate_number'.

[OUTPUT FORMAT REQUIREMENT]:
You MUST return a clean JSON object ONLY. No markdown, no pre-text, no explanation, no formatting block wrappers. The response structure must be:
{{
  "results": [
    {{
      "corporate_number": "13-digit number",
      "industry_codes": ["code1", "code2"],
      "industry_tags": ["tag1", "tag2"]
    }},
    ...
  ]
}}
"""
    
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = response.read().decode("utf-8")
            res_json = json.loads(res_data)
            result_text = res_json["candidates"][0]["content"]["parts"][0]["text"].strip()
            data = json.loads(result_text)
            return data.get("results", [])
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"[-] Live Gemini API HTTP Error: {e.code} - {e.reason} - {error_body}")
        
        is_limit_reached = (
            e.code == 429 or 
            e.code == 402 or
            "rate_limit" in error_body.lower() or
            "quota" in error_body.lower()
        )
        
        if is_limit_reached:
            print("\n" + "!"*80)
            print("  [CẢNH BÁO NGUY HIỂM] PHÁT HIỆN HẠN MỨC HOẶC TÀI KHOẢN HẾT TIỀN TRÊN GEMINI!")
            print(f"  - Mã trạng thái HTTP: {e.code} ({e.reason})")
            print("  - Mọi cuộc gọi API tiếp theo sẽ bị ĐÌNH CHỈ NGAY LẬP TỨC trong phiên chạy này.")
            print("  - Hệ thống tự động chuyển hướng sang chế độ gán nhãn OFFLINE độ chính xác cao.")
            print("!"*80 + "\n")
            API_SUSPENDED = True
            
        return None
    except Exception as e:
        print(f"[-] Live Gemini API call failed: {e}. Falling back to offline tagger.")
        return None

def save_company_tags(cursor, corp_num, codes, tags, master_shumoku, is_deep=False):
    """Update company_industries and companies tables with the assigned codes and tags."""
    # Verify and filter codes
    valid_codes = [c for c in codes if c in VALID_JSIC_CODES]
    
    # Query all currently mapped industry codes for the company in the database
    cursor.execute("SELECT industry_code FROM company_industries WHERE corporate_number = ?;", (corp_num,))
    existing_db_codes = {row[0] for row in cursor.fetchall()}
    
    # Compute the union of all codes
    all_codes = existing_db_codes.union(valid_codes)
    
    # Define generic fallback industry codes
    fallback_codes = {"95", "99", "T"}
    
    # If the union contains specific codes (not in fallback_codes), we must prune fallback_codes
    has_specific_codes = any(c not in fallback_codes for c in all_codes)
    overlapping_fallbacks = all_codes.intersection(fallback_codes)
    
    if has_specific_codes and overlapping_fallbacks:
        # Remove fallback codes from our sets/lists
        for f_code in overlapping_fallbacks:
            all_codes.discard(f_code)
            existing_db_codes.discard(f_code)
            valid_codes = [c for c in valid_codes if c != f_code]
            
        # Delete redundant fallback mappings from database
        placeholders = ",".join("?" for _ in overlapping_fallbacks)
        cursor.execute(f"""
            DELETE FROM company_industries 
            WHERE corporate_number = ? AND industry_code IN ({placeholders});
        """, (corp_num, *overlapping_fallbacks))
        
    if not all_codes:
        # Fallback to '95' if there are absolutely no codes left
        valid_codes = ["95"]
        all_codes = {"95"}

    # 1. Update company_industries (Insert mapping - ACCUMULATE by inserting OR ignoring)
    for code in valid_codes:
        if code not in existing_db_codes:
            cursor.execute("""
                INSERT OR IGNORE INTO company_industries (corporate_number, industry_code)
                VALUES (?, ?);
            """, (corp_num, code))
        
    # 2. Update Master jigyo_shumoku by reconstructing it from all_codes using m_industries names
    # This guarantees that jigyo_shumoku matches exactly the codes in company_industries.
    cursor.execute(f"""
        SELECT DISTINCT m.industry_name 
        FROM m_industries m
        WHERE m.industry_code IN ({','.join('?' for _ in all_codes)});
    """, tuple(all_codes))
    final_tags = [row[0] for row in cursor.fetchall() if row[0]]
    
    # Rebuild jigyo_shumoku. If for some reason final_tags is empty, default to "その他のサービス業"
    if not final_tags:
        final_tags = ["その他のサービス業"]
        
    final_shumoku = ", ".join(final_tags)
    
    if is_deep:
        cursor.execute("""
            UPDATE companies 
            SET jigyo_shumoku = ?,
                last_deep_tagged_at = datetime('now', 'localtime'),
                updated_at = CURRENT_TIMESTAMP
            WHERE corporate_number = ?;
        """, (final_shumoku, corp_num))
    else:
        cursor.execute("""
            UPDATE companies 
            SET jigyo_shumoku = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE corporate_number = ?;
        """, (final_shumoku, corp_num))
    
    return len(valid_codes)

def process_tagging(force_offline=False, limit_gbiz=100000, stage1_only=False):
    """Orchestrates AI tagging processing for companies."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if last_deep_tagged_at column exists in companies table
    cursor.execute("PRAGMA table_info(companies);")
    columns = [col[1] for col in cursor.fetchall()]
    if "last_deep_tagged_at" not in columns:
        print("[*] Migrating SQLite schema: Adding last_deep_tagged_at column to companies table...")
        cursor.execute("ALTER TABLE companies ADD COLUMN last_deep_tagged_at TEXT;")
        conn.commit()
    
    # -------------------------------------------------------------------------
    # STAGE 1: Fast G-Biz Registry Offline Regex Tagging (Giai đoạn Phân loại sơ khai)
    # -------------------------------------------------------------------------
    print("\n" + "="*60)
    print("  STAGE 1: FAST OFFLINE G-BIZ REGISTRY REGEX TAGGING")
    print("="*60)
    
    # Fetch untagged companies (jigyo_shumoku is NULL or '')
    cursor.execute("""
        SELECT corporate_number, company_name, business_summary 
        FROM companies 
        WHERE jigyo_shumoku IS NULL OR jigyo_shumoku = ''
        LIMIT ?;
    """, (limit_gbiz,))
    gbiz_companies = cursor.fetchall()
    print(f"[+] Loaded {len(gbiz_companies)} untagged companies from G-Biz registry.")
    
    stage1_tagged = 0
    stage1_inserted_mappings = 0
    
    if gbiz_companies:
        for idx, row in enumerate(gbiz_companies, 1):
            corp_num, comp_name, gbiz_summary = row
            
            # Fetch G-Biz signals (except recruitment)
            cursor.execute("""
                SELECT DISTINCT signal_type, signal_title 
                FROM business_signals 
                WHERE corporate_number = ? AND signal_type != '求人あり' AND signal_title IS NOT NULL AND signal_title != '';
            """, (corp_num,))
            signals_records = cursor.fetchall()
            signals_list = [f"[{s[0]}]: {s[1]}" for s in signals_records]
            raw_signals_str = ", ".join(signals_list) if signals_list else ""
            
            # Run offline rules on Name + G-Biz Summary + G-Biz Signals
            regex_result = run_offline_tagging(comp_name, "", gbiz_summary, raw_signals_str)
            
            if regex_result and not regex_result.get("is_fallback"):
                # Hit a specific category!
                codes = regex_result["industry_codes"]
                tags = regex_result["industry_tags"]
                num_inserted = save_company_tags(cursor, corp_num, codes, tags, "")
                stage1_tagged += 1
                stage1_inserted_mappings += num_inserted
            else:
                # No match, mark as '未分類' (Chưa phân loại) to avoid scanning again in subsequent runs
                cursor.execute("""
                    UPDATE companies 
                    SET jigyo_shumoku = '未分類',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE corporate_number = ?;
                """, (corp_num,))
                stage1_tagged += 1
                
            if idx % 20000 == 0:
                conn.commit()
                print(f"  [+] Stage 1: Processed {idx}/{len(gbiz_companies)} companies...")
                
        conn.commit()
        print(f"[+] Stage 1 Complete: Processed {len(gbiz_companies)} companies.")
        print(f"    - Classified specifically: {stage1_inserted_mappings} mappings across {stage1_tagged - (len(gbiz_companies) - stage1_inserted_mappings)} companies")
        print(f"    - Marked as '未分類': {len(gbiz_companies) - stage1_inserted_mappings} companies")
    else:
        print("[~] No untagged G-Biz companies found.")

    if stage1_only:
        print("[*] Stage 1 Only requested. Skipping Stage 2 refined tagging.")
        conn.close()
        return

    # -------------------------------------------------------------------------
    # STAGE 2: Crawler-Driven Refined Hybrid Tagging (Giai đoạn Tinh chỉnh sau khi cào)
    # -------------------------------------------------------------------------
    print("\n" + "="*60)
    print("  STAGE 2: CRAWLER-DRIVEN REFINED HYBRID TAGGING")
    print("="*60)
    
    # Fetch companies with raw crawler data that:
    # 1) Have never been deep-tagged (last_deep_tagged_at IS NULL).
    # 2) OR have newly crawled data that is newer than their last deep-tagged timestamp.
    cursor.execute("""
        WITH scraped_companies AS (
            SELECT corporate_number, max(scraped_at) as max_scraped_at
            FROM (
                SELECT corporate_number, scraped_at FROM raw_hellowork WHERE corporate_number IS NOT NULL AND scraped_at IS NOT NULL
                UNION ALL
                SELECT corporate_number, scraped_at FROM raw_website WHERE corporate_number IS NOT NULL AND scraped_at IS NOT NULL
            )
            GROUP BY corporate_number
        )
        SELECT c.corporate_number
        FROM scraped_companies sc
        JOIN companies c ON c.corporate_number = sc.corporate_number
        WHERE c.last_deep_tagged_at IS NULL 
           OR c.last_deep_tagged_at < sc.max_scraped_at;
    """)
    crawler_companies = cursor.fetchall()
    print(f"[+] Loaded {len(crawler_companies)} companies with crawler data needing refinement.")
    
    if not crawler_companies:
        print("[~] No crawled companies require refined tagging. Stage 2 complete.")
        conn.close()
        return
        
    # Load API keys from environment (.env.local / .env)
    load_env()
    gemini_key = os.environ.get("GEMINI_API_KEY")
    groq_key = os.environ.get("GROQ_API_KEY")
    
    use_api = False
    api_mode = None
    api_key = None
    
    if not force_offline:
        if gemini_key:
            use_api = True
            api_mode = "GEMINI"
            api_key = gemini_key
            print("[*] Gemini API Key found. Running in LIVE BATCH API mode using gemini-1.5-flash on Google AI Studio.")
        elif groq_key:
            use_api = True
            api_mode = "GROQ"
            api_key = groq_key
            print("[*] Groq API Key found. Running in LIVE BATCH API mode using llama-3.3-70b-versatile on Groq.")
            
    if not use_api:
        print("[!] Running in OFFLINE/DETERMINISTIC FALLBACK mode.")
        print("[!] Note: Set 'GEMINI_API_KEY' or 'GROQ_API_KEY' in '.env.local' to switch to live AI model.")
        
    stage2_tagged = 0
    stage2_inserted_mappings = 0
    stats_api_calls = 0
    
    batch_queue = []
    
    for idx, row in enumerate(crawler_companies, 1):
        corp_num = row[0]
        
        # A. Query Master jigyo_shumoku and company_name
        cursor.execute("SELECT company_name, jigyo_shumoku FROM companies WHERE corporate_number = ?;", (corp_num,))
        row_c = cursor.fetchone()
        comp_name = row_c[0] or ""
        master_shumoku = row_c[1] or ""
        
        # B. Query HelloWork raw industries
        cursor.execute("SELECT DISTINCT industry FROM raw_hellowork WHERE corporate_number = ? AND industry IS NOT NULL AND industry != '';", (corp_num,))
        hw_industries = [r[0] for r in cursor.fetchall()]
        raw_hw_ind = ", ".join(hw_industries) if hw_industries else ""
        
        # C. Query Website raw summaries
        cursor.execute("SELECT DISTINCT business_summary FROM raw_website WHERE corporate_number = ? AND business_summary IS NOT NULL AND business_summary != '';", (corp_num,))
        web_summaries = [r[0] for r in cursor.fetchall()]
        raw_web_sum = " | ".join(web_summaries) if web_summaries else ""
        
        # D. Query G-Biz business signals
        cursor.execute("""
            SELECT DISTINCT signal_type, signal_title 
            FROM business_signals 
            WHERE corporate_number = ? AND signal_type != '求人あり' AND signal_title IS NOT NULL AND signal_title != '';
        """, (corp_num,))
        signals_records = cursor.fetchall()
        signals_list = [f"[{s[0]}]: {s[1]}" for s in signals_records]
        raw_signals_str = ", ".join(signals_list) if signals_list else ""
        
        # Skip if no raw data clues are available at all (unlikely if they have raw entries, but good guard)
        if not raw_hw_ind and not raw_web_sum and not raw_signals_str:
            if master_shumoku in (None, '', '未分類'):
                cursor.execute("""
                    UPDATE companies 
                    SET jigyo_shumoku = '未分類 (AI確認済)',
                        last_deep_tagged_at = datetime('now', 'localtime'),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE corporate_number = ?;
                """, (corp_num,))
            else:
                cursor.execute("""
                    UPDATE companies 
                    SET last_deep_tagged_at = datetime('now', 'localtime'),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE corporate_number = ?;
                """, (corp_num,))
            stage2_tagged += 1
            continue
            
        # Run Regex Rule engine on company details
        regex_result = run_offline_tagging(comp_name, raw_hw_ind, raw_web_sum, raw_signals_str)
        
        if regex_result and not regex_result.get("is_fallback"):
            # Confident offline regex match found
            codes = regex_result["industry_codes"]
            tags = regex_result["industry_tags"]
            num_inserted = save_company_tags(cursor, corp_num, codes, tags, master_shumoku, is_deep=True)
            stage2_tagged += 1
            stage2_inserted_mappings += num_inserted
        else:
            # Not confident, queue for Groq live API
            if use_api and not API_SUSPENDED:
                batch_queue.append({
                    "corporate_number": corp_num,
                    "company_name": comp_name,
                    "industry": raw_hw_ind,
                    "website_summary": raw_web_sum,
                    "signals_summary": raw_signals_str,
                    "master_shumoku": master_shumoku
                })
                
                if len(batch_queue) >= 15:
                    print(f"  - Dispatching batch of {len(batch_queue)} companies to {api_mode} API...")
                    if api_mode == "GEMINI":
                        results = run_gemini_tagging_batch(api_key, batch_queue)
                    else:
                        results = run_api_tagging_batch(api_key, batch_queue)
                    stats_api_calls += 1
                    
                    if results:
                        results_map = {res["corporate_number"]: res for res in results}
                        for queued_item in batch_queue:
                            q_corp_num = queued_item["corporate_number"]
                            q_master_shumoku = queued_item["master_shumoku"]
                            
                            if q_corp_num in results_map:
                                res_item = results_map[q_corp_num]
                                num_inserted = save_company_tags(cursor, q_corp_num, res_item.get("industry_codes", []), res_item.get("industry_tags", []), q_master_shumoku, is_deep=True)
                                stage2_tagged += 1
                                stage2_inserted_mappings += num_inserted
                            else:
                                # Fallback to Unclassified (AI checked) to avoid calling API again
                                cursor.execute("""
                                    UPDATE companies 
                                    SET jigyo_shumoku = '未分類 (AI確認済)',
                                        last_deep_tagged_at = datetime('now', 'localtime'),
                                        updated_at = CURRENT_TIMESTAMP
                                    WHERE corporate_number = ?;
                                """, (q_corp_num,))
                                stage2_tagged += 1
                    else:
                        # API call failed, fallback to offline rule mapping for this batch
                        for queued_item in batch_queue:
                            q_corp_num = queued_item["corporate_number"]
                            q_comp_name = queued_item["company_name"]
                            q_master_shumoku = queued_item["master_shumoku"]
                            q_reg = run_offline_tagging(q_comp_name, queued_item["industry"], queued_item["website_summary"], queued_item["signals_summary"])
                            if q_reg and not q_reg.get("is_fallback"):
                                num_inserted = save_company_tags(cursor, q_corp_num, q_reg["industry_codes"], q_reg["industry_tags"], q_master_shumoku, is_deep=True)
                            else:
                                cursor.execute("""
                                    UPDATE companies 
                                    SET jigyo_shumoku = '未分類 (AI確認済)',
                                        last_deep_tagged_at = datetime('now', 'localtime'),
                                        updated_at = CURRENT_TIMESTAMP
                                    WHERE corporate_number = ?;
                                """, (q_corp_num,))
                            stage2_tagged += 1
                            
                    batch_queue = []
            else:
                # Offline mode or API suspended, save fallback or update jigyo_shumoku to Unclassified (AI checked)
                if regex_result and not regex_result.get("is_fallback"):
                    codes = regex_result["industry_codes"]
                    tags = regex_result["industry_tags"]
                    num_inserted = save_company_tags(cursor, corp_num, codes, tags, master_shumoku, is_deep=True)
                    stage2_inserted_mappings += num_inserted
                else:
                    cursor.execute("""
                        UPDATE companies 
                        SET jigyo_shumoku = '未分類 (AI確認済)',
                            last_deep_tagged_at = datetime('now', 'localtime'),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE corporate_number = ?;
                    """, (corp_num,))
                stage2_tagged += 1
                
        if idx % 5000 == 0:
            conn.commit()
            print(f"  [+] Stage 2: Processed {idx}/{len(crawler_companies)} companies...")
            
    # Process remaining batch
    if batch_queue:
        if use_api and not API_SUSPENDED:
            print(f"  - Dispatching final batch of {len(batch_queue)} companies to {api_mode} API...")
            if api_mode == "GEMINI":
                results = run_gemini_tagging_batch(api_key, batch_queue)
            else:
                results = run_api_tagging_batch(api_key, batch_queue)
            stats_api_calls += 1
            if results:
                results_map = {res["corporate_number"]: res for res in results}
                for queued_item in batch_queue:
                    q_corp_num = queued_item["corporate_number"]
                    q_master_shumoku = queued_item["master_shumoku"]
                    
                    if q_corp_num in results_map:
                        res_item = results_map[q_corp_num]
                        num_inserted = save_company_tags(cursor, q_corp_num, res_item.get("industry_codes", []), res_item.get("industry_tags", []), q_master_shumoku, is_deep=True)
                        stage2_tagged += 1
                        stage2_inserted_mappings += num_inserted
                    else:
                        cursor.execute("""
                            UPDATE companies 
                            SET jigyo_shumoku = '未分類 (AI確認済)',
                                last_deep_tagged_at = datetime('now', 'localtime'),
                                updated_at = CURRENT_TIMESTAMP
                            WHERE corporate_number = ?;
                        """, (q_corp_num,))
                        stage2_tagged += 1
            else:
                for queued_item in batch_queue:
                    q_corp_num = queued_item["corporate_number"]
                    q_comp_name = queued_item["company_name"]
                    q_master_shumoku = queued_item["master_shumoku"]
                    q_reg = run_offline_tagging(q_comp_name, queued_item["industry"], queued_item["website_summary"], queued_item["signals_summary"])
                    if q_reg and not q_reg.get("is_fallback"):
                        num_inserted = save_company_tags(cursor, q_corp_num, q_reg["industry_codes"], q_reg["industry_tags"], q_master_shumoku, is_deep=True)
                    else:
                        cursor.execute("""
                            UPDATE companies 
                            SET jigyo_shumoku = '未分類 (AI確認済)',
                                last_deep_tagged_at = datetime('now', 'localtime'),
                                updated_at = CURRENT_TIMESTAMP
                            WHERE corporate_number = ?;
                        """, (q_corp_num,))
                    stage2_tagged += 1
        else:
            for queued_item in batch_queue:
                q_corp_num = queued_item["corporate_number"]
                q_comp_name = queued_item["company_name"]
                q_master_shumoku = queued_item["master_shumoku"]
                q_reg = run_offline_tagging(q_comp_name, queued_item["industry"], queued_item["website_summary"], queued_item["signals_summary"])
                if q_reg and not q_reg.get("is_fallback"):
                    num_inserted = save_company_tags(cursor, q_corp_num, q_reg["industry_codes"], q_reg["industry_tags"], q_master_shumoku, is_deep=True)
                else:
                    cursor.execute("""
                        UPDATE companies 
                        SET jigyo_shumoku = '未分類 (AI確認済)',
                            last_deep_tagged_at = datetime('now', 'localtime'),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE corporate_number = ?;
                    """, (q_corp_num,))
                stage2_tagged += 1
                
    conn.commit()
    conn.close()
    
    print("\n" + "="*50)
    print("      SUMMARY OF AI-TAGGING PIPELINE (STAGE 2)")
    print("="*50)
    print(f"  - Mode of Operation              : {f'LIVE BATCH {api_mode} API' if use_api else 'OFFLINE FALLBACK'}")
    print(f"  - Total API calls made           : {stats_api_calls}")
    print(f"  - Total companies processed      : {stage2_tagged} records")
    print(f"  - JSIC category mappings loaded  : {stage2_inserted_mappings} records")
    print("="*50)

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Kigyou-list: Integrated Groq AI-Tagging System")
    parser.add_argument("--offline", action="store_true", help="Force offline modes (Rule-Based mapping only)")
    parser.add_argument("--limit-gbiz", type=int, default=100000, help="Limit number of untagged G-Biz companies processed in Phase 1")
    parser.add_argument("--stage1-only", action="store_true", help="Only run Stage 1 G-Biz Registry Offline Regex Tagging")
    args = parser.parse_args()
    
    print("="*60)
    print("      KIGYOU-LIST: INTEGRATED GROQ AI-TAGGING SYSTEM")
    print("="*60)
    
    start_time = datetime.now()
    try:
        process_tagging(force_offline=args.offline, limit_gbiz=args.limit_gbiz, stage1_only=args.stage1_only)
        duration = datetime.now() - start_time
        print(f"[+] AI-Tagging pipeline completed successfully in: {duration}")
    except Exception as e:
        print(f"[-] Fatal error during AI-Tagging: {e}")

if __name__ == "__main__":
    main()
