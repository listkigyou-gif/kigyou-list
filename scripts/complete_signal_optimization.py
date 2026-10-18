import psycopg2
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')
DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

def optimize():
    print("🚀 Starting Index Creation & Optimization for Kigyou-List...", flush=True)
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    indexes = [
        ("idx_comp_hiring_sort", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_hiring = true)"),
        ("idx_comp_subsidy_sort", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_subsidy = true)"),
        ("idx_comp_bidding_sort", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_bidding = true)"),
        ("idx_comp_patent_sort", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_patent = true)"),
        ("idx_comp_cert_sort", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_certification = true)"),
        ("idx_comp_award_sort", "ON companies (has_financials DESC, capital_amount DESC NULLS LAST, corporate_number) WHERE (has_award = true)"),
    ]

    print("\n--- CREATING PARTIAL COVERING INDEXES ON 'companies' ---", flush=True)
    for idx_name, idx_def in indexes:
        t0 = time.time()
        print(f"  Creating {idx_name}...", end="", flush=True)
        try:
            cur.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} {idx_def};")
            print(f" ✅ Done in {time.time() - t0:.2f}s", flush=True)
        except Exception as e:
            print(f" ⚠️ {e}", flush=True)

    print("\n--- RUNNING ANALYZE ON 'companies' ---", flush=True)
    t0 = time.time()
    cur.execute("ANALYZE companies;")
    print(f"  ✅ ANALYZE completed in {time.time() - t0:.2f}s", flush=True)

    conn.close()
    print("\n🎉 ALL SIGNAL INDEXES CREATED & STATISTICS UPDATED!", flush=True)

if __name__ == '__main__':
    optimize()
