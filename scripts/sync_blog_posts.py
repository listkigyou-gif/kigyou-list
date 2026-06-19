import sqlite3
import os
import psycopg2
import sys

SQLITE_DB = "kigyou-list.db"

def get_postgres_url():
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url
        
    possible_paths = [
        ".env",
        ".env.local",
        "frontend/.env",
        "frontend/.env.local",
        "../.env",
        "../.env.local",
        "../frontend/.env",
        "../frontend/.env.local"
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip().startswith("DATABASE_URL="):
                        return line.strip().split("DATABASE_URL=")[1].strip().strip('"').strip("'")
    return None

def main():
    pg_url = get_postgres_url()
    if not pg_url:
        print("Error: DATABASE_URL not found.")
        sys.exit(1)

    print(f"Connecting to SQLite: {SQLITE_DB}...")
    lite_conn = sqlite3.connect(SQLITE_DB)
    lite_cur = lite_conn.cursor()

    print("Connecting to PostgreSQL...")
    pg_conn = psycopg2.connect(pg_url)
    pg_cur = pg_conn.cursor()

    try:
        # Step 1: Ensure PostgreSQL has the correct blog_posts table and locale column
        print("Ensuring PostgreSQL blog_posts table exists...")
        pg_cur.execute("""
            CREATE TABLE IF NOT EXISTS blog_posts (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                summary TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                published_at VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        pg_cur.execute("ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'ja';")
        pg_conn.commit()

        # Step 2: Fetch all posts from SQLite
        print("Fetching blog posts from SQLite...")
        lite_cur.execute("SELECT slug, title, content, summary, category, published_at, locale FROM blog_posts")
        posts = lite_cur.fetchall()
        print(f"Found {len(posts)} posts in SQLite.")

        # Step 3: Insert / Sync to PostgreSQL
        print("Syncing posts to PostgreSQL...")
        for post in posts:
            slug, title, content, summary, category, published_at, locale = post
            try:
                safe_title = title.encode(sys.stdout.encoding or 'utf-8', errors='replace').decode(sys.stdout.encoding or 'utf-8')
                print(f"Syncing: [{locale}] {safe_title} (slug: {slug})")
            except Exception:
                print(f"Syncing: [{locale}] slug: {slug}")
            pg_cur.execute("""
                INSERT INTO blog_posts (slug, title, content, summary, category, published_at, locale)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (slug) DO UPDATE SET
                    title = EXCLUDED.title,
                    content = EXCLUDED.content,
                    summary = EXCLUDED.summary,
                    category = EXCLUDED.category,
                    published_at = EXCLUDED.published_at,
                    locale = EXCLUDED.locale
            """, (slug, title, content, summary, category, published_at, locale))
        
        pg_conn.commit()
        print("Sync completed successfully!")

    except Exception as e:
        pg_conn.rollback()
        print("Failed to sync:", e)
    finally:
        lite_conn.close()
        pg_conn.close()

if __name__ == '__main__':
    main()
