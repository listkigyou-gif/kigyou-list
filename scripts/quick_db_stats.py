import sqlite3

conn = sqlite3.connect('file:c:/kigyou-list/kigyou-list.db?mode=ro', uri=True, timeout=5)
c = conn.cursor()
c.execute('PRAGMA query_only = ON;')

forms = c.execute("SELECT count(1) FROM companies WHERE contact_form_url IS NOT NULL AND contact_form_url != ''").fetchone()[0]
emails = c.execute("SELECT count(1) FROM companies WHERE email_address IS NOT NULL AND email_address != ''").fetchone()[0]
websites = c.execute("SELECT count(1) FROM companies WHERE website_url IS NOT NULL AND website_url != ''").fetchone()[0]
raw_cnt = c.execute("SELECT count(1) FROM raw_website").fetchone()[0]
ind_cnt = c.execute("SELECT count(1) FROM company_industries").fetchone()[0]

print(f"Websites: {websites:,}")
print(f"Contact Forms: {forms:,}")
print(f"Emails: {emails:,}")
print(f"Raw Website Records: {raw_cnt:,}")
print(f"Industry Tag Mappings: {ind_cnt:,}")

conn.close()
