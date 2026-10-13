import sqlite3
import os

DB_PATH = r"c:\kigyou-list\kigyou-list.db"

def init_tables():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS webhook_subscriptions (
        id TEXT PRIMARY KEY,
        user_email TEXT,
        api_key TEXT,
        webhook_url TEXT NOT NULL,
        secret_token TEXT NOT NULL,
        filter_events TEXT DEFAULT '["hiring", "subsidy", "bidding"]',
        filter_prefecture TEXT,
        is_active INTEGER DEFAULT 1,
        failure_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_dispatched_at DATETIME
    );
    """)
    conn.commit()
    conn.close()
    print("Table webhook_subscriptions successfully initialized!")

if __name__ == "__main__":
    init_tables()
