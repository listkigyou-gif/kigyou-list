import psycopg2
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

DATABASE_URL = "postgresql://postgres:Hrptlcct6789%40@160.251.203.84:5432/kigyou_list"

def test_perf():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("--- 1. TABLES & ROW COUNTS ---")
    tables = ['companies', 'company_industries', 'company_signal_flags', 'company_financial_latest', 'm_industries', 'hidden_companies']
    for t in tables:
        try:
            cur.execute(f"SELECT COUNT(*) FROM {t};")
            count = cur.fetchone()[0]
            print(f"{t}: {count:,} rows")
        except Exception as e:
            conn.rollback()
            print(f"{t}: Error ({e})")

    print("\n--- 2. INDEXES ON companies ---")
    cur.execute("""
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'companies'
        ORDER BY indexname;
    """)
    for row in cur.fetchall():
        print(f"Index: {row[0]} -> {row[1]}")

    print("\n--- 3. INDEXES ON company_industries & company_signal_flags & company_financial_latest ---")
    cur.execute("""
        SELECT tablename, indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename IN ('company_industries', 'company_signal_flags', 'company_financial_latest')
        ORDER BY tablename, indexname;
    """)
    for row in cur.fetchall():
        print(f"[{row[0]}] {row[1]} -> {row[2]}")

    print("\n--- 4. TEST COMMON FILTER QUERIES & EXPLAIN ANALYZE ---")
    test_queries = [
        ("Default 1st Page (No filter, Order by has_financials desc, capital desc, corp asc)",
         "SELECT corporate_number, company_name, capital_amount, has_financials FROM companies WHERE NOT EXISTS (SELECT 1 FROM hidden_companies hc WHERE hc.corporate_number = companies.corporate_number) ORDER BY has_financials DESC, capital_amount DESC NULLS LAST, corporate_number ASC LIMIT 15;"),
        
        ("Prefecture Tokyo (13)",
         "SELECT corporate_number, company_name, capital_amount, has_financials FROM companies WHERE prefecture_code = '13' AND NOT EXISTS (SELECT 1 FROM hidden_companies hc WHERE hc.corporate_number = companies.corporate_number) ORDER BY has_financials DESC, capital_amount DESC NULLS LAST, corporate_number ASC LIMIT 15;"),

        ("Industry Filter (Major A: Agriculture)",
         "SELECT corporate_number, company_name FROM companies WHERE corporate_number IN (SELECT corporate_number FROM company_industries WHERE industry_path LIKE 'A%') LIMIT 15;"),

        ("Signal Filter (has_hiring = true)",
         "SELECT corporate_number, company_name FROM companies WHERE corporate_number IN (SELECT corporate_number FROM company_signal_flags WHERE has_hiring = true) LIMIT 15;"),

        ("Contact Filter (has_email, has_phone)",
         "SELECT corporate_number, company_name FROM companies WHERE email_address IS NOT NULL AND email_address != '' AND phone_number IS NOT NULL AND phone_number != '' LIMIT 15;"),

        ("Financial Filter (min_operating_income > 100M)",
         "SELECT corporate_number, company_name FROM companies WHERE corporate_number IN (SELECT corporate_number FROM company_financial_latest WHERE operating_income >= 100000000) LIMIT 15;"),

        ("Combo Filter (Prefecture 13 + has_email + min_employees >= 50)",
         "SELECT corporate_number, company_name FROM companies WHERE prefecture_code = '13' AND employee_count >= 50 AND email_address IS NOT NULL AND email_address != '' ORDER BY has_financials DESC, capital_amount DESC NULLS LAST, corporate_number ASC LIMIT 15;"),
        
        ("Count Query (Prefecture 13 + has_email + min_employees >= 50 bounded 2000)",
         "SELECT COUNT(*) FROM (SELECT 1 FROM companies WHERE prefecture_code = '13' AND employee_count >= 50 AND email_address IS NOT NULL AND email_address != '' LIMIT 2000) sub;")
    ]

    for name, sql in test_queries:
        t0 = time.time()
        try:
            cur.execute(f"EXPLAIN (ANALYZE, BUFFERS) {sql}")
            plan = cur.fetchall()
            exec_time = (time.time() - t0) * 1000
            print(f"\n>> {name} (Client wall time: {exec_time:.2f}ms)")
            # Print last few lines of explain (Execution Time)
            for p in plan[-4:]:
                print(f"   {p[0]}")
        except Exception as e:
            conn.rollback()
            print(f"\n>> {name} FAILED: {e}")

    conn.close()

if __name__ == '__main__':
    test_perf()
