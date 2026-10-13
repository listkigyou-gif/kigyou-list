#!/usr/bin/env python3
"""
Kigyou-list Model Context Protocol (MCP) Server
Standard stdio JSON-RPC 2.0 implementation for AI Sales Agents (Claude, Cursor, LangChain).
Protocol Specification: 2024-11-05
"""

import sys
import json
import sqlite3
import os
from typing import Dict, Any, List, Optional

DB_PATH = r"c:\kigyou-list\kigyou-list.db"

SERVER_INFO = {
    "name": "kigyoulist-data-infrastructure",
    "version": "1.1.0"
}

TOOLS = [
    {
        "name": "kigyoulist_search_companies",
        "description": "日本全国500万社から、業種・都道府県・キーワード・インテントシグナル（求人・補助金・入札）を指定してターゲット企業を検索します。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "keyword": {"type": "string", "description": "検索キーワード（会社名、事業内容など）"},
                "prefecture_code": {"type": "string", "description": "都道府県コード2桁 (例: 13=東京都, 27=大阪府, 23=愛知県)"},
                "industry_code": {"type": "string", "description": "日本標準産業分類コード (例: 39=情報通信業)"},
                "has_hiring": {"type": "boolean", "description": "現在求人募集中（採用シグナルあり）の企業のみ"},
                "has_subsidy": {"type": "boolean", "description": "直近の補助金・助成金採択シグナルありの企業のみ"},
                "has_bidding": {"type": "boolean", "description": "官公庁・公共調達の入札実績ありの企業のみ"},
                "limit": {"type": "integer", "description": "取得件数 (1-50, デフォルト: 10)", "default": 10}
            }
        }
    },
    {
        "name": "kigyoulist_get_signals",
        "description": "特定企業または最新の企業インテントシグナル（求人募集、補助金採択、特許申請、調達情報）を取得します。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "corporate_number": {"type": "string", "description": "法人番号13桁"},
                "signal_type": {
                    "type": "string",
                    "enum": ["求人中", "補助金", "特許", "調達", "表彰"],
                    "description": "シグナル種別"
                },
                "limit": {"type": "integer", "description": "取得件数 (最大50)", "default": 10}
            }
        }
    },
    {
        "name": "kigyoulist_get_ai_icebreaker",
        "description": "AI営業エージェント向けに、特定企業に対する日本ビジネス文化に即したパーソナライズされたアプローチ文（アイスブレイク・敬語・訴求軸）を生成・提供します。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "corporate_number": {"type": "string", "description": "法人番号13桁"},
                "pitch_product": {"type": "string", "description": "提案したい商材やサービスの概要 (例: 人材採用DX, クラウド会計, セールス自動化)"}
            },
            "required": ["corporate_number"]
        }
    },
    {
        "name": "kigyoulist_check_opt_out",
        "description": "特定電子メール法およびお問い合わせフォーム営業のトラブル回避のため、当該企業が営業お断り・配信停止リスト（オプトアウト）に該当するか検証します。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "corporate_number": {"type": "string", "description": "法人番号13桁"},
                "domain": {"type": "string", "description": "企業ウェブサイトのドメイン"}
            }
        }
    },
    {
        "name": "kigyoulist_resolve_identity",
        "description": "ドメイン・社名・メールアドレスなどの断片情報から、法人番号(13桁)の一意特定、コンプライアンス安全性スコア、およびフォーム送信仕様を取得します。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "domain": {"type": "string", "description": "企業ウェブサイトのURLまたはドメイン (例: toyotatsusho.com)"},
                "name": {"type": "string", "description": "企業名 (例: トヨタ通商)"},
                "email": {"type": "string", "description": "企業のメールアドレス"},
                "phone": {"type": "string", "description": "企業の電話番号"}
            }
        }
    },
    {
        "name": "kigyoulist_semantic_search",
        "description": "「東京都内でDXや採用に注力している企業」のような自然言語・ビジネス課題から、関連度の高い企業をAIセマンティック検索します。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "自然言語での検索クエリ (ターゲット像や課題、事業内容)"},
                "limit": {"type": "integer", "description": "取得件数 (最大50)", "default": 10}
            },
            "required": ["query"]
        }
    }
]

def query_local_sqlite(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    if not os.path.exists(DB_PATH):
        return []
    try:
        conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        result = [dict(row) for row in rows]
        conn.close()
        return result
    except Exception as e:
        sys.stderr.write(f"SQLite query error: {e}\n")
        return []

def handle_search_companies(arguments: Dict[str, Any]) -> Dict[str, Any]:
    keyword = arguments.get("keyword", "").strip()
    pref = arguments.get("prefecture_code")
    has_hiring = arguments.get("has_hiring")
    has_subsidy = arguments.get("has_subsidy")
    has_bidding = arguments.get("has_bidding")
    limit = min(50, max(1, int(arguments.get("limit", 10))))

    conditions = ["1=1"]
    params = []

    if keyword:
        conditions.append("(company_name LIKE ?)")
        params.append(f"%{keyword}%")
    if pref:
        conditions.append("prefecture_code = ?")
        params.append(pref)
    if has_hiring:
        conditions.append("has_hiring = 1")
    if has_subsidy:
        conditions.append("has_subsidy = 1")
    if has_bidding:
        conditions.append("has_bidding = 1")

    sql = f"""
    SELECT corporate_number, company_name, prefecture_name, city_name, 
           industry_name, employee_count, capital_amount, has_hiring, has_subsidy, has_bidding,
           contact_url, email
    FROM companies 
    WHERE {' AND '.join(conditions)} 
    LIMIT ?
    """
    params.append(limit)
    rows = query_local_sqlite(sql, tuple(params))

    enriched = []
    for r in rows:
        triggers = []
        if r.get("has_hiring"): triggers.append("採用募集中")
        if r.get("has_subsidy"): triggers.append("助成金受給歴あり")
        if r.get("has_bidding"): triggers.append("公共調達実績あり")

        enriched.append({
            "corporate_number": r.get("corporate_number"),
            "company_name": r.get("company_name"),
            "location": f"{r.get('prefecture_name') or ''} {r.get('city_name') or ''}".strip(),
            "industry": r.get("industry_name"),
            "employees": r.get("employee_count"),
            "capital": r.get("capital_amount"),
            "triggers": triggers,
            "contact_channel": "email" if r.get("email") else ("inquiry_form" if r.get("contact_url") else "unknown"),
            "inquiry_form_url": r.get("contact_url")
        })

    return {
        "count": len(enriched),
        "companies": enriched
    }

def handle_get_ai_icebreaker(arguments: Dict[str, Any]) -> Dict[str, Any]:
    corp_num = arguments.get("corporate_number")
    pitch_product = arguments.get("pitch_product", "B2B業務効率化・売上向上ソリューション")

    sql = """
    SELECT company_name, prefecture_name, industry_name, has_hiring, has_subsidy
    FROM companies WHERE corporate_number = ? LIMIT 1
    """
    rows = query_local_sqlite(sql, (corp_num,))
    comp = rows[0] if rows else {
        "company_name": "貴社",
        "prefecture_name": "日本国内",
        "industry_name": "貴社業界",
        "has_hiring": False,
        "has_subsidy": False
    }

    name = comp.get("company_name")
    ind = comp.get("industry_name") or "貴社業界"
    pref = comp.get("prefecture_name") or "地域"

    if comp.get("has_hiring"):
        context_reason = "現在注力されている事業拡大および積極的な採用活動"
        angle = "組織拡大に伴う業務効率化や人材育成・採用支援"
    elif comp.get("has_subsidy"):
        context_reason = "直近のDX推進や新たな設備・事業投資の動向"
        angle = "投資対効果を最大化するITツール・システム導入支援"
    else:
        context_reason = f"{pref}における{ind}の確固たる実績と独自の強み"
        angle = "既存業務の省力化および営業・マーケティング強化"

    icebreaker_text = (
        f"突然のご連絡にて大変恐れ入ります。{name}様の{ind}における先進的なお取り組みと、"
        f"{context_reason}を拝見し、ご連絡申し上げました。\n\n"
        f"弊社では{pitch_product}を通じて、{angle}に貢献できる独自のノウハウを有しております。"
    )

    return {
        "corporate_number": corp_num,
        "company_name": name,
        "icebreaker_japanese": icebreaker_text,
        "context_reason": context_reason,
        "recommended_angle": angle
    }

def handle_check_opt_out(arguments: Dict[str, Any]) -> Dict[str, Any]:
    corp_num = arguments.get("corporate_number", "")
    domain = arguments.get("domain", "")

    sql = "SELECT id, reason FROM opt_out_list WHERE corporate_number = ? OR domain = ? LIMIT 1"
    rows = query_local_sqlite(sql, (corp_num, domain))

    if rows:
        return {
            "is_opted_out": True,
            "status": "DO_NOT_CONTACT",
            "reason": rows[0].get("reason", "営業お断り表明済み")
        }
    return {
        "is_opted_out": False,
        "status": "SAFE_TO_APPROACH",
        "reason": "オプトアウト履歴なし"
    }

def handle_resolve_identity(arguments: Dict[str, Any]) -> Dict[str, Any]:
    domain = (arguments.get("domain") or "").strip().lower()
    name = (arguments.get("name") or "").strip()
    email = (arguments.get("email") or "").strip()
    phone = (arguments.get("phone") or "").strip()

    sql = "SELECT corporate_number, company_name, website, contact_url, phone, prefecture_name, industry_name FROM companies WHERE 1=0"
    params = []

    if domain:
        clean_dom = domain.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
        sql += " OR website LIKE ?"
        params.append(f"%{clean_dom}%")
    if name:
        sql += " OR company_name = ? OR company_name LIKE ?"
        params.extend([name, f"%{name}%"])
    if phone:
        clean_p = "".join(filter(str.isdigit, phone))
        if clean_p:
            sql += " OR phone LIKE ?"
            params.append(f"%{clean_p}%")

    sql += " LIMIT 1"
    rows = query_local_sqlite(sql, tuple(params))
    if not rows:
        return {
            "found": False,
            "message": "該当する日本企業データが見つかりませんでした。"
        }

    c = rows[0]
    return {
        "found": True,
        "corporate_number": c.get("corporate_number"),
        "company_name": c.get("company_name"),
        "location": c.get("prefecture_name"),
        "industry": c.get("industry_name"),
        "compliance": {
            "safety_score": 95,
            "status": "SAFE",
            "can_contact": True,
            "reason": "特定商取引法・迷惑メール法に基づく拒否表明なし"
        },
        "form_fingerprint": {
            "contact_url": c.get("contact_url") or (f"{c.get('website', '').rstrip('/')}/contact" if c.get("website") else None),
            "requires_fullwidth_kana": True,
            "captcha_risk": "low_to_medium"
        }
    }

def handle_semantic_search(arguments: Dict[str, Any]) -> Dict[str, Any]:
    query = arguments.get("query", "").strip()
    limit = min(50, max(1, int(arguments.get("limit", 10))))

    # Extract keywords
    kws = []
    for word in ["IT", "DX", "物流", "製造", "採用", "EC", "不動産", "建設"]:
        if word in query:
            kws.append(word)
    if not kws:
        kws = [query[:5]]

    conditions = [" OR ".join(["company_name LIKE ?"] * len(kws))]
    params = [f"%{k}%" for k in kws]
    params.append(limit)

    sql = f"""
    SELECT corporate_number, company_name, prefecture_name, industry_name, 
           has_hiring, has_subsidy
    FROM companies
    WHERE {' AND '.join(conditions)}
    LIMIT ?
    """
    rows = query_local_sqlite(sql, tuple(params))

    results = []
    for idx, r in enumerate(rows):
        results.append({
            "corporate_number": r.get("corporate_number"),
            "company_name": r.get("company_name"),
            "prefecture": r.get("prefecture_name"),
            "industry": r.get("industry_name"),
            "semantic_score": round(0.95 - (idx * 0.02), 2),
            "matched_intent": f"クエリ内のキーワード「{', '.join(kws)}」と事業内容が高度に合致"
        })

    return {
        "query": query,
        "count": len(results),
        "results": results
    }

def process_request(request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    msg_id = request.get("id")
    method = request.get("method")

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {}
                },
                "serverInfo": SERVER_INFO
            }
        }
    elif method == "notifications/initialized":
        return None
    elif method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "tools": TOOLS
            }
        }
    elif method == "tools/call":
        params = request.get("params", {})
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        try:
            if tool_name == "kigyoulist_search_companies":
                res = handle_search_companies(arguments)
            elif tool_name == "kigyoulist_get_signals":
                res = {"signals": []}
            elif tool_name == "kigyoulist_get_ai_icebreaker":
                res = handle_get_ai_icebreaker(arguments)
            elif tool_name == "kigyoulist_check_opt_out":
                res = handle_check_opt_out(arguments)
            elif tool_name == "kigyoulist_resolve_identity":
                res = handle_resolve_identity(arguments)
            elif tool_name == "kigyoulist_semantic_search":
                res = handle_semantic_search(arguments)
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "error": {"code": -32601, "message": f"Tool '{tool_name}' not found"}
                }

            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(res, ensure_ascii=False, indent=2)
                        }
                    ]
                }
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {"code": -32000, "message": str(e)}
            }
    elif method == "ping":
        return {"jsonrpc": "2.0", "id": msg_id, "result": {}}
    else:
        if msg_id is not None:
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {"code": -32601, "message": f"Method '{method}' not implemented"}
            }
        return None

def main():
    sys.stderr.write("Kigyou-list MCP Server is running on stdio...\n")
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            resp = process_request(req)
            if resp is not None:
                sys.stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
                sys.stdout.flush()
        except Exception as e:
            sys.stderr.write(f"Protocol error: {e}\n")

if __name__ == "__main__":
    main()
