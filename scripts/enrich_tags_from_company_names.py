#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Kigyou-List: High-Speed Corporate Name Heuristics Tagging Engine (Clustered RowID Chunking)
========================================================================================
Scans companies using sequential rowid chunks (1..5,070,092) to match unclassified
entities ('分類不能の産業' or NULL) against standard Japanese industry keywords.
Directly updates companies.jigyo_shumoku and inserts into company_industries.
"""

import os
import sys
import time
import re
import sqlite3
import unicodedata
import logging

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger("name_heuristics_tagger")

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(ROOT_DIR, "kigyou-list.db")

# Rules mapping regex pattern on company_name -> (jsic_medium_code, major_code, [tag_names])
RULES = [
    # Medical (P / 83)
    (re.compile(r'(クリニック|医院|歯科|デンタル|整形外科|眼科|皮膚科|内科|外科|耳鼻|小児科|産婦人科|精神科|透析|調剤薬局|調剤|薬局)', re.I),
     "83", "P.83", ["医療業", "医療・クリニック"]),
    
    # Care & Welfare (P / 85)
    (re.compile(r'(介護|福祉|デイサービス|老人ホーム|サ高住|グループホーム|ケアセンター|ケアサービス|保育園|保育所|託児所|こども園|児童発達|放課後デイ)', re.I),
     "85", "P.85", ["社会福祉・介護事業", "介護・福祉"]),

    # Construction - Equipment (D / 08)
    (re.compile(r'(設備|電設|電気工事|電気工事業|空調|ダクト|配管工事|冷暖房|消防設備|換気設備)', re.I),
     "08", "D.08", ["設備工事業", "電気・空調設備"]),

    # Construction - Specialty (D / 07)
    (re.compile(r'(塗装|防水|内装|建具|板金|左官|解体|リフォーム|外壁|屋根|足場|サッシ)', re.I),
     "07", "D.07", ["職別工事業", "リフォーム・内装工事"]),

    # Construction - General (D / 06)
    (re.compile(r'(建設|工務店|土木|技建|建工|工営|ハウスメーカー|ハウジング|組$|土木工事業|建設業)', re.I),
     "06", "D.06", ["総合工事業", "建設・土木"]),

    # Real Estate - Trade (K / 68)
    (re.compile(r'(不動産|リアルエステート|地所|レジデンス|プロパティ|エステート|宅建|住宅販売|不動産販売|デベロッパー)', re.I),
     "68", "K.68", ["不動産取引業", "不動産"]),

    # Real Estate - Management (K / 69)
    (re.compile(r'(ビル管理|マンション管理|アパート管理|建物管理|不動産管理)', re.I),
     "69", "K.69", ["不動産賃貸業・管理業", "建物・不動産管理"]),

    # Logistics & Freight (H / 44)
    (re.compile(r'(運輸|運送|ロジスティクス|ロジ|物流|陸運|貨物|急便|通運|引越|配送|ライン)', re.I),
     "44", "H.44", ["道路貨物運送業", "物流・運送"]),

    # Passenger Transport (H / 43)
    (re.compile(r'(タクシー|ハイヤー|観光バス|交通|バス$|路線バス)', re.I),
     "43", "H.43", ["道路旅客運送業", "タクシー・バス"]),

    # Warehousing (H / 47)
    (re.compile(r'(倉庫|トランクルーム|保管庫|ロジセンター)', re.I),
     "47", "H.47", ["倉庫業", "倉庫・保管"]),

    # Professional Legal / Accounting (L / 72)
    (re.compile(r'(法律事務所|弁護士法人|弁護士|税理士法人|税理士|会計事務所|公認会計士|司法書士法人|司法書士|行政書士|社会保険労務士|社労士法人|特許業務法人|特許事務所|弁理士)', re.I),
     "72", "L.72", ["専門サービス業", "士業・法務・会計"]),

    # Advertising & Marketing (L / 73)
    (re.compile(r'(広告|エージェンシー|プロモーション|マーケティング|パブリシティ|メディアバイイング)', re.I),
     "73", "L.73", ["広告業", "広告・マーケティング"]),

    # Technical & Design Services (L / 74)
    (re.compile(r'(建築設計|設計事務所|測量|エンジニアリング|デザイン事務所|技術研究所)', re.I),
     "74", "L.74", ["技術サービス業", "設計・エンジニアリング"]),

    # IT & Software Services (G / 39)
    (re.compile(r'(システム|ソフトウェア|インフォメーション|ソリューション|テクノロジー|ネットワーク|アイティ|プログラミング|コンピュータ|ソフト開発)', re.I),
     "39", "G.39", ["情報サービス業", "IT・ソフトウェア"]),

    # Internet & Web Services (G / 40)
    (re.compile(r'(インターネット|ウェブ|ポータル|メディア|オンライン|スタジオ)', re.I),
     "40", "G.40", ["インターネット附随サービス業", "Web・ネットサービス"]),

    # Manufacturing - Machinery & Metals (E / 24)
    (re.compile(r'(製作所|精機|鉄工|機械|金型|プレス|鋳造|鍛造|ボルト|ネジ|金属|鉄鋼|パイプ|鋼材)', re.I),
     "24", "E.24", ["金属製品製造業", "機械・金属加工"]),

    # Manufacturing - General (E / 32)
    (re.compile(r'(工業|化成|工芸|化成品|プラスチック|モールド|成型|樹脂)', re.I),
     "32", "E.32", ["その他の製造業", "製造・工業"]),

    # Food Manufacturing (E / 09)
    (re.compile(r'(製麺|製菓|醸造|水産加工|食肉|酒造|フーズ|ベーカリー|製粉|製油)', re.I),
     "09", "E.09", ["食料品製造業", "食品製造"]),

    # Printing (E / 15)
    (re.compile(r'(印刷|製本|プリンティング|グラフィック印刷|凸版|図書印刷)', re.I),
     "15", "E.15", ["印刷・同関連業", "印刷・出版"]),

    # Chemical & Pharma (E / 16)
    (re.compile(r'(製薬|薬品|化学|ペイント|塗料|インキ)', re.I),
     "16", "E.16", ["化学工業", "化学・医薬品"]),

    # Automotive & Transport Equipment (E / 31)
    (re.compile(r'(自動車部品|造船|車体|ボディー|マフラー|タイヤ)', re.I),
     "31", "E.31", ["輸送用機械器具製造業", "自動車・輸送機器"]),

    # Accommodations (M / 75)
    (re.compile(r'(ホテル|旅館|リゾート|ペンション|イン$|ゲストハウス)', re.I),
     "75", "M.75", ["宿泊業", "ホテル・旅館"]),

    # Food & Drink Services (M / 76)
    (re.compile(r'(レストラン|食堂|ダイニング|割烹|寿司|鮨|カフェ|居酒屋|バル|珈琲|焼肉|中華|イタリアン|フレンチ)', re.I),
     "76", "M.76", ["飲食店", "飲食・レストラン"]),

    # Trading & Wholesale (I / 50)
    (re.compile(r'(商事|物産|通商|商会|貿易|実業|興業)', re.I),
     "50", "I.50", ["各種商品卸売業", "商社・卸売"]),

    # Food Retail & Wholesale (I / 58)
    (re.compile(r'(青果|鮮魚|精肉|水産|スーパーマーケット|ストア|マート)', re.I),
     "58", "I.58", ["飲食料品小売業", "小売・スーパー"]),

    # Retail - Specialty (I / 60)
    (re.compile(r'(書店|書籍|文具|メガネ|眼鏡|ドラッグストア|ファーマシー|アパレル|ブティック)', re.I),
     "60", "I.60", ["その他の小売業", "小売・専門店"]),

    # Personal Services & Beauty (N / 78)
    (re.compile(r'(美容室|ヘアサロン|理容|バーバー|エステ|ネイル|サロン|クリーニング)', re.I),
     "78", "N.78", ["洗濯・理容・美容・浴場業", "美容・サロン"]),

    # Ceremonial & Lifestyle (N / 79)
    (re.compile(r'(冠婚葬祭|セレモニー|葬祭|葬儀|ブライダル|結婚式場)', re.I),
     "79", "N.79", ["その他の生活関連サービス業", "冠婚葬祭・ライフサービス"]),

    # Amusement & Sports (N / 80)
    (re.compile(r'(ゴルフ|フィットネス|スポーツクラブ|ジム|カラオケ|パチンコ|アミューズメント|ボウル)', re.I),
     "80", "N.80", ["娯楽業", "スポーツ・娯楽"]),

    # Education (O / 81)
    (re.compile(r'(学園|学院|学校|大学|高校|幼稚園)', re.I),
     "81", "O.81", ["学校教育", "学校・教育"]),

    # Tutoring & Training (O / 82)
    (re.compile(r'(進学塾|予備校|スクール|学習塾|ゼミナール|各種教室|アカデミー)', re.I),
     "82", "O.82", ["その他の教育，学習支援業", "学習塾・スクール"]),

    # Agriculture (A / 01)
    (re.compile(r'(農園|農場|牧場|ファーム|農業|畜産|養鶏|酪農)', re.I),
     "01", "A.01", ["農業", "農業・畜産"]),

    # Forestry (A / 02)
    (re.compile(r'(林業|製材|森林)', re.I),
     "02", "A.02", ["林業", "林業・木材"]),
]

def main():
    t0 = time.time()
    log.info("=" * 75)
    log.info("   KIGYOU-LIST: CORPORATE NAME HEURISTICS TAGGING ENGINE (ROWID CHUNKS)")
    log.info("=" * 75)
    
    conn = sqlite3.connect(DB_PATH, timeout=120.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA busy_timeout=120000;")
    cur = conn.cursor()

    cur.execute("SELECT min(rowid), max(rowid) FROM companies;")
    min_row, max_row = cur.fetchone()
    if not min_row or not max_row:
        log.error("[-] No companies found in database!")
        conn.close()
        return

    log.info(f"[*] Total RowID Range: {min_row:,} to {max_row:,} (Total: {max_row - min_row + 1:,} companies)")
    
    CHUNK_SIZE = 25000
    total_scanned = 0
    total_matched = 0
    total_unclassified = 0
    
    curr = min_row
    while curr <= max_row:
        next_id = min(curr + CHUNK_SIZE - 1, max_row)
        
        cur.execute("""
            SELECT corporate_number, company_name, jigyo_shumoku
            FROM companies
            WHERE rowid BETWEEN ? AND ?;
        """, (curr, next_id))
        rows = cur.fetchall()
        
        batch_comp_updates = []
        batch_ind_inserts = []
        
        for c_num, c_name, j_shumoku in rows:
            total_scanned += 1
            # Check if this company needs tagging
            is_unclass = (not j_shumoku) or ("未分類" in j_shumoku) or ("分類不能" in j_shumoku) or (j_shumoku.strip() == "")
            if not is_unclass:
                continue
                
            total_unclassified += 1
            if not c_name:
                continue
                
            norm_name = unicodedata.normalize('NFKC', c_name)
            
            matched_rule = None
            for pattern, code, path, tags in RULES:
                if pattern.search(norm_name):
                    matched_rule = (code, path, tags)
                    break
                    
            if matched_rule:
                total_matched += 1
                code, path, tags = matched_rule
                tag_str = ",".join(tags) + " (AI確認済)"
                batch_comp_updates.append((tag_str, c_num))
                batch_ind_inserts.append((c_num, code, path, 1))

        if batch_comp_updates:
            cur.executemany("""
                UPDATE companies 
                SET jigyo_shumoku = ?,
                    last_deep_tagged_at = CURRENT_TIMESTAMP
                WHERE corporate_number = ?;
            """, batch_comp_updates)
            
            cur.executemany("""
                INSERT OR IGNORE INTO company_industries (corporate_number, industry_code, industry_path, is_detailed)
                VALUES (?, ?, ?, ?);
            """, batch_ind_inserts)
            conn.commit()

        pct = (curr / max_row) * 100
        rate = total_scanned / max(time.time() - t0, 0.01)
        if (curr // CHUNK_SIZE) % 5 == 0 or next_id == max_row:
            log.info(f"   - Progress: {curr:,}/{max_row:,} ({pct:.1f}%) | Matched: {total_matched:,} new tags | Speed: {rate:,.0f} comp/sec")

        curr = next_id + 1

    conn.close()
    
    elapsed = time.time() - t0
    log.info("=" * 75)
    log.info("🎉 CORPORATE NAME HEURISTICS TAGGING COMPLETED!")
    log.info(f"   - Total Companies Scanned:       {total_scanned:,}")
    log.info(f"   - Unclassified Found:            {total_unclassified:,}")
    log.info(f"   - Newly Tagged Companies:        {total_matched:,} ({(total_matched/total_unclassified*100) if total_unclassified else 0:.1f}%)")
    log.info(f"   - Elapsed Time:                  {elapsed:.1f}s ({total_scanned/elapsed:.1f} comp/sec)")
    log.info("=" * 75)

if __name__ == '__main__':
    main()
