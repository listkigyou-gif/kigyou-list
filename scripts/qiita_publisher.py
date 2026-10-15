# -*- coding: utf-8 -*-
"""
Qiita Automated Publisher for kigyoulist.com SEO and GEO Strategy
Account: listkigyou (https://qiita.com/listkigyou)
"""

import os
import sys

# Ensure UTF-8 output on Windows terminal
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

import argparse
import requests

QIITA_TOKEN = os.environ.get('QIITA_TOKEN', '178d101ef29be2f2c9915a9d34a5ba2c95a2f510')
API_BASE = 'https://qiita.com/api/v2'

headers = {
    'Authorization': f'Bearer {QIITA_TOKEN}',
    'Content-Type': 'application/json'
}

def get_current_user():
    res = requests.get(f'{API_BASE}/authenticated_user', headers=headers)
    if res.status_code == 200:
        return res.json()
    else:
        raise Exception(f'Auth error ({res.status_code}): {res.text}')

def list_my_items():
    res = requests.get(f'{API_BASE}/authenticated_user/items', headers=headers)
    if res.status_code == 200:
        return res.json()
    return []

def post_article(title: str, body_markdown: str, tags: list, is_private: bool = False, tweet: bool = False):
    payload = {
        'title': title,
        'body': body_markdown,
        'tags': [{'name': t} for t in tags],
        'private': is_private,
        'tweet': tweet
    }
    res = requests.post(f'{API_BASE}/items', headers=headers, json=payload)
    if res.status_code in [200, 201]:
        data = res.json()
        print(f'Successfully published: {data.get("title")}')
        print(f'URL: {data.get("url")}')
        print(f'Item ID: {data.get("id")}')
        return data
    else:
        print(f'Failed to publish ({res.status_code}): {res.text}')
        return None

def publish_article_1(is_private=False):
    article_path = os.path.join(os.path.dirname(__file__), 'articles', 'article_01.md')
    if not os.path.exists(article_path):
        article_path = r'C:\kigyou-list\scripts\articles\article_01.md'
    with open(article_path, 'r', encoding='utf-8') as f:
        body = f.read()
    
    title = '【Python/Playwright】企業の問い合わせフォーム構造を自動判定・最適化する実践アーキテクチャ'
    tags = ['Python', 'Playwright', 'スクレイピング', '自動化', 'DX']
    return post_article(title, body, tags, is_private=is_private)

def publish_article_2(is_private=False):
    article_path = os.path.join(os.path.dirname(__file__), 'articles', 'article_02.md')
    if not os.path.exists(article_path):
        article_path = r'C:\kigyou-list\scripts\articles\article_02.md'
    with open(article_path, 'r', encoding='utf-8') as f:
        body = f.read()
    
    title = '【Python/PostgreSQL】500万社規模の日本企業オープンデータを名寄せ・高速統合する実践アーキテクチャ'
    tags = ['Python', 'PostgreSQL', 'データ分析', 'OpenData', 'アーキテクチャ']
    return post_article(title, body, tags, is_private=is_private)

def publish_article_3(is_private=False):
    article_path = os.path.join(os.path.dirname(__file__), 'articles', 'article_03.md')
    if not os.path.exists(article_path):
        article_path = r'C:\kigyou-list\scripts\articles\article_03.md'
    with open(article_path, 'r', encoding='utf-8') as f:
        body = f.read()
    
    title = '【Python/AsyncIO】ハローワーク求人・助成金オープンデータをリアルタイム解析するインテントデータ（購買意欲シグナル）基盤の実装'
    tags = ['Python', 'AsyncIO', 'PostgreSQL', 'データ分析', 'スクレイピング']
    return post_article(title, body, tags, is_private=is_private)

def publish_article_4(is_private=False):
    article_path = os.path.join(os.path.dirname(__file__), 'articles', 'article_04.md')
    if not os.path.exists(article_path):
        article_path = r'C:\kigyou-list\scripts\articles\article_04.md'
    with open(article_path, 'r', encoding='utf-8') as f:
        body = f.read()
    
    title = '【Python/NLP】企業のWebサイトから1,000種以上のB2B事業カテゴリを自動判定・タグ付けするEmbedding & LLMパイプラインの実装'
    tags = ['Python', 'NLP', '機械学習', 'データ分析', 'DX']
    return post_article(title, body, tags, is_private=is_private)

def publish_article_5(is_private=False):
    article_path = os.path.join(os.path.dirname(__file__), 'articles', 'article_05.md')
    if not os.path.exists(article_path):
        article_path = r'C:\kigyou-list\scripts\articles\article_05.md'
    with open(article_path, 'r', encoding='utf-8') as f:
        body = f.read()
    
    title = '【Python/Playwright】大規模B2BクローリングにおけるCloudflare Turnstile検知ハンドリングとHTTPコネクションプール最適化の実践アーキテクチャ'
    tags = ['Python', 'Playwright', 'スクレイピング', 'Cloudflare', 'アーキテクチャ']
    return post_article(title, body, tags, is_private=is_private)

def publish_article_6(is_private=False):
    article_path = os.path.join(os.path.dirname(__file__), 'articles', 'article_06.md')
    if not os.path.exists(article_path):
        article_path = r'C:\kigyou-list\scripts\articles\article_06.md'
    with open(article_path, 'r', encoding='utf-8') as f:
        body = f.read()
    
    title = '【PostgreSQL/Python】500万社をミリ秒で検索する：日本語形態素解析・カナ曖昧検索・pg_trgmチューニングの実践アーキテクチャ'
    tags = ['PostgreSQL', 'Python', '全文検索', 'データ分析', 'アーキテクチャ']
    return post_article(title, body, tags, is_private=is_private)

def publish_from_file(file_path: str, title: str, tags: list, is_private: bool = False):
    if not os.path.isabs(file_path):
        file_path = os.path.join(os.path.dirname(__file__), file_path)
    with open(file_path, 'r', encoding='utf-8') as f:
        body = f.read()
    return post_article(title, body, tags, is_private=is_private)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Qiita Publisher CLI')
    parser.add_argument('--check', action='store_true', help='Check user profile and list items')
    parser.add_argument('--publish-01', action='store_true', help='Publish Article 01')
    parser.add_argument('--publish-02', action='store_true', help='Publish Article 02')
    parser.add_argument('--publish-03', action='store_true', help='Publish Article 03')
    parser.add_argument('--publish-04', action='store_true', help='Publish Article 04')
    parser.add_argument('--publish-05', action='store_true', help='Publish Article 05')
    parser.add_argument('--publish-06', action='store_true', help='Publish Article 06')
    parser.add_argument('--file', type=str, help='Path to markdown article file to publish')
    parser.add_argument('--title', type=str, help='Title of the article')
    parser.add_argument('--tags', type=str, help='Comma-separated tags (up to 5 tags, e.g. "Python,PostgreSQL,DX")')
    parser.add_argument('--private', action='store_true', help='Publish as private (secret item)')
    args = parser.parse_args()

    user = get_current_user()
    print(f'Authenticated as: @{user["id"]} ({user.get("name") or "No display name"})')
    print(f'Profile URL: https://qiita.com/{user["id"]}')

    if args.file and args.title:
        tags_list = [t.strip() for t in args.tags.split(',')] if args.tags else ['Python', 'Tech']
        publish_from_file(args.file, args.title, tags_list[:5], is_private=args.private)

    if args.publish_01:
        publish_article_1(is_private=args.private)

    if args.publish_02:
        publish_article_2(is_private=args.private)

    if args.publish_03:
        publish_article_3(is_private=args.private)

    if args.publish_04:
        publish_article_4(is_private=args.private)

    if args.publish_05:
        publish_article_5(is_private=args.private)

    if args.publish_06:
        publish_article_6(is_private=args.private)

    if args.check:
        items = list_my_items()
        print(f'Published items count: {len(items)}')
        for it in items:
            print(f"- [{it['title']}]({it['url']}) (Private: {it['private']})")
