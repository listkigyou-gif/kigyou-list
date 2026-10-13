"""
Kigyou-list AI Sales Multi-Agent Orchestrator Pipeline
4-Stage Specialized Autonomous Agent Chain for Japan B2B Outbound Sales
"""

import sys
import json
from typing import Dict, Any, List

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# ==========================================
# 1. SCOUT AGENT: Phát hiện cơ hội & Lọc mục tiêu
# ==========================================
class ScoutAgent:
    def __init__(self, target_industry: str = "39", target_prefecture: str = "13"):
        self.target_industry = target_industry
        self.target_prefecture = target_prefecture

    def run(self, mock_leads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        print("[1. ScoutAgent] Đang quét các công ty có tín hiệu chuyển động (Hiring, Subsidy, Bidding)...")
        qualified = []
        for c in mock_leads:
            # Tiêu chí lọc: Có ít nhất 1 Intent Signal (Tuyển dụng hoặc Trợ cấp)
            has_intent = c.get("has_hiring") or c.get("has_subsidy") or c.get("has_bidding")
            if has_intent:
                qualified.append(c)
        print(f"[1. ScoutAgent] Phát hiện {len(qualified)}/{len(mock_leads)} doanh nghiệp có tín hiệu mua hàng nóng.")
        return qualified

# ==========================================
# 2. ENRICHMENT AGENT: Làm giàu dữ liệu & Kiểm tra an toàn
# ==========================================
class EnrichmentAgent:
    def run(self, leads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        print("[2. EnrichmentAgent] Đang làm giàu dữ liệu và kiểm tra danh sách Opt-out...")
        enriched = []
        for c in leads:
            # Kiểm tra an toàn (Opt-out)
            is_blacklisted = c.get("is_opt_out", False)
            if is_blacklisted:
                print(f" -> Bỏ qua {c['company_name']} (Nằm trong danh sách nghiêm cấm chào hàng)")
                continue

            triggers = []
            if c.get("has_hiring"):
                triggers.append("求人募集中 (エンジニア・セールス強化)")
            if c.get("has_subsidy"):
                triggers.append("IT導入補助金採択 (DX投資予算あり)")

            c["signals_summary"] = triggers
            c["preferred_channel"] = "inquiry_form" if c.get("contact_url") else ("email" if c.get("email") else "phone")
            enriched.append(c)
        return enriched

# ==========================================
# 3. COPYWRITER AGENT: Soạn thảo thư chào hàng Keigo
# ==========================================
class CopywriterAgent:
    def __init__(self, product_name: str = "AIインサイドセールス自動化ツール"):
        self.product_name = product_name

    def run(self, leads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        print("[3. CopywriterAgent] Đang tạo thư chào hàng siêu cá nhân hóa chuẩn Keigo...")
        for c in leads:
            name = c.get("company_name")
            ind = c.get("industry_name", "貴社業界")
            signals = c.get("signals_summary", [])
            
            trigger_context = "貴社における先進的な取り組み"
            if "求人募集中" in str(signals):
                trigger_context = "現在注力されている事業拡大および積極的な採用動向"
                value_prop = "新規採用に伴う業務効率化および営業チームの立ち上げを即戦力で支援する"
            elif "補助金" in str(signals):
                trigger_context = "近年のDX推進および新たな事業投資のお取り組み"
                value_prop = "補助金対象ツールとして高い投資対効果を実現する"
            else:
                value_prop = "既存の営業プロセスの省力化とアポイント獲得率を最大化する"

            letter = (
                f"{name}\n"
                f"ご担当者様\n\n"
                f"突然のご連絡にて大変恐れ入ります。\n"
                f"私どもは企業の営業DXを支援しております、Kigyou-listパートナー事務局でございます。\n\n"
                f"{name}様の{ind}における先進的な実績、ならびに{trigger_context}を拝見し、"
                f"弊社の『{self.product_name}』が貴社の更なる成長に貢献できるのではないかと考え、ご連絡いたしました。\n\n"
                f"■ 貴社へのご提案ポイント\n"
                f"・{value_prop}\n"
                f"・月間最大100時間の定常業務削減と成約確度の高い商談創出\n\n"
                f"ご興味がございましたら、15分ほどオンラインにて概要をご案内させていただけますと幸いです。\n\n"
                f"--------------------------------------------------\n"
                f"送信元: Kigyou-list Sales Automation\n"
                f"URL: https://kigyoulist.com\n"
                f"--------------------------------------------------"
            )
            c["pitch_draft"] = letter
        return leads

# ==========================================
# 4. DISPATCHER AGENT: Lập lịch & Đẩy hàng đợi thực thi
# ==========================================
class DispatcherAgent:
    def run(self, leads: List[Dict[str, Any]]) -> Dict[str, Any]:
        print("[4. DispatcherAgent] Đang điều phối hàng đợi gửi Form & Email...")
        dispatched = []
        for c in leads:
            task = {
                "corporate_number": c.get("corporate_number"),
                "company_name": c.get("company_name"),
                "channel": c.get("preferred_channel"),
                "target_destination": c.get("contact_url") or c.get("email"),
                "status": "QUEUED_FOR_DISPATCH",
                "length_chars": len(c.get("pitch_draft", ""))
            }
            dispatched.append(task)
            print(f" -> Đã xếp hàng: {c['company_name']} via {task['channel']}")

        return {
            "total_queued": len(dispatched),
            "tasks": dispatched
        }

# ==========================================
# MAIN ORCHESTRATION PIPELINE
# ==========================================
def run_pipeline():
    print("=" * 60)
    print("KIGYOU-LIST AI SALES AGENT PIPELINE: BẮT ĐẦU VẬN HÀNH")
    print("=" * 60)

    # Dữ liệu mẫu đại diện cho 5 triệu doanh nghiệp
    mock_input_companies = [
        {
            "corporate_number": "1010001002003",
            "company_name": "大和システム開発株式会社",
            "industry_name": "情報通信業",
            "has_hiring": True,
            "has_subsidy": True,
            "contact_url": "https://example.jp/contact",
            "is_opt_out": False
        },
        {
            "corporate_number": "2010001004567",
            "company_name": "東京不動産流通株式会社",
            "industry_name": "不動産業",
            "has_hiring": False,
            "has_subsidy": False,
            "contact_url": "https://example-re.jp/inquiry",
            "is_opt_out": True  # Có thông báo cấm chào hàng
        },
        {
            "corporate_number": "3010001009876",
            "company_name": "関西ロジスティクス株式会社",
            "industry_name": "運輸・倉庫業",
            "has_hiring": True,
            "has_subsidy": False,
            "email": "info@kansai-logi.example.com",
            "is_opt_out": False
        }
    ]

    scout = ScoutAgent()
    enrichment = EnrichmentAgent()
    copywriter = CopywriterAgent(product_name="次世代AI営業アシスタント")
    dispatcher = DispatcherAgent()

    # Chạy chuỗi pipeline tuần tự qua 4 tác nhân
    step1 = scout.run(mock_input_companies)
    step2 = enrichment.run(step1)
    step3 = copywriter.run(step2)
    result = dispatcher.run(step3)

    print("\n" + "=" * 60)
    print("PIPELINE HOÀN TẤT THÀNH CÔNG:")
    print(f"Tổng số tác vụ sẵn sàng gửi: {result['total_queued']}")
    print("=" * 60)
    print("\nVí dụ mẫu thư được tạo tự động cho công ty đầu tiên:")
    print("-" * 40)
    print(step3[0]["pitch_draft"])
    print("-" * 40)

if __name__ == "__main__":
    run_pipeline()
