import sqlite3
import psycopg2
import os
import csv
import time

def get_postgres_url():
    if os.path.exists(".env.local"):
        with open(".env.local", "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith("DATABASE_URL="):
                    return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
    return os.environ.get("DATABASE_URL")

def main():
    url = get_postgres_url()
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    
    # 1. Truncate table
    print("Truncating companies...")
    cur.execute("TRUNCATE TABLE companies CASCADE;")
    conn.commit()
    
    # Check count in companies_p01
    cur.execute("SELECT COUNT(*) FROM companies_p01;")
    print("Count after truncate:", cur.fetchone()[0])
    
    # 2. Query SQLite for prefecture 01
    lite_conn = sqlite3.connect("kigyou-list.db")
    lite_cur = lite_conn.cursor()
    
    select_query = """
        SELECT 
            corporate_number, company_name, company_name_kana, company_name_en, postal_code,
            prefecture_code, prefecture_name, city_name, street_address, full_address,
            representative_name, representative_position, establishment_date, capital_amount,
            employee_count, sales_amount, phone_number, fax_number, website_url, email_address,
            business_summary, status, created_at, updated_at, jigyo_shumoku, branch_phone_numbers,
            yahoo_last_crawled_at, website_last_crawled_at
        FROM companies WHERE prefecture_code = '01'
    """
    lite_cur.execute(select_query)
    rows = lite_cur.fetchall()
    print("Rows queried from SQLite:", len(rows))
    
    # Write to temp CSV
    temp_file = "temp_test_p01.csv"
    cleaned_rows = []
    nullable_non_text_indices = [13, 14, 15, 22, 23]
    for row in rows:
        r = list(row)
        for idx in nullable_non_text_indices:
            if idx < len(r):
                val = r[idx]
                if val == "" or val == "None" or val is None:
                    r[idx] = None
        cleaned_rows.append(r)
        
    with open(temp_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL, doublequote=True)
        writer.writerows(cleaned_rows)
        
    # Copy to PG
    columns = [
        "corporate_number", "company_name", "company_name_kana", "company_name_en", "postal_code",
        "prefecture_code", "prefecture_name", "city_name", "street_address", "full_address",
        "representative_name", "representative_position", "establishment_date", "capital_amount",
        "employee_count", "sales_amount", "phone_number", "fax_number", "website_url", "email_address",
        "business_summary", "status", "created_at", "updated_at", "jigyo_shumoku", "branch_phone_numbers",
        "yahoo_last_crawled_at", "website_last_crawled_at"
    ]
    cols_str = ", ".join(columns)
    copy_sql = f"COPY companies_p01 ({cols_str}) FROM STDIN WITH (FORMAT CSV, HEADER FALSE, NULL '')"
    
    print("Executing COPY...")
    try:
        with open(temp_file, 'r', encoding='utf-8') as f:
            cur.copy_expert(copy_sql, f)
        conn.commit()
        print("COPY SUCCESSFUL!")
    except Exception as e:
        conn.rollback()
        print("COPY FAILED:", e)
        
    # Check count again
    cur.execute("SELECT COUNT(*) FROM companies_p01;")
    print("Count after COPY attempt:", cur.fetchone()[0])
    
    # Cleanup
    if os.path.exists(temp_file):
        os.remove(temp_file)
    lite_conn.close()
    conn.close()

if __name__ == '__main__':
    main()
