import sqlite3
import time

def sync_hellowork_websites():
    t0 = time.time()
    conn = sqlite3.connect("kigyou-list.db", timeout=60.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("ATTACH DATABASE 'crawlers/hellowork/data/hellowork.db' AS hw;")

    cur = conn.cursor()
    print("[*] Checking how many Master companies need website sync from HelloWork...")
    cur.execute("""
        SELECT COUNT(1) 
        FROM companies c
        JOIN hw.companies h ON c.corporate_number = h.corporate_number
        WHERE (c.website_url IS NULL OR c.website_url = '' OR c.website_url LIKE '%なし%')
          AND h.website IS NOT NULL AND length(h.website) > 5 AND h.website NOT LIKE '%なし%';
    """)
    needed = cur.fetchone()[0]
    print(f"[+] Companies needing website update: {needed:,}")

    if needed > 0:
        print("[*] Updating companies.website_url from HelloWork...")
        cur.execute("""
            UPDATE companies
            SET website_url = (
                SELECT h.website 
                FROM hw.companies h 
                WHERE h.corporate_number = companies.corporate_number
                  AND h.website IS NOT NULL AND length(h.website) > 5 AND h.website NOT LIKE '%なし%'
                LIMIT 1
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE (website_url IS NULL OR website_url = '' OR website_url LIKE '%なし%')
              AND EXISTS (
                SELECT 1 
                FROM hw.companies h 
                WHERE h.corporate_number = companies.corporate_number
                  AND h.website IS NOT NULL AND length(h.website) > 5 AND h.website NOT LIKE '%なし%'
              );
        """)
        updated = cur.rowcount
        conn.commit()
        print(f"[+] Successfully synced {updated:,} websites into Master DB in {time.time()-t0:.1f}s!")

    conn.close()

if __name__ == "__main__":
    sync_hellowork_websites()
