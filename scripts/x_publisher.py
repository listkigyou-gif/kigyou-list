"""
X (Twitter) Autonomous Publisher for Kigyou-list (kigyoulist.com)
Account: @kigyoulist
Supports: Single Tweets, Full Threads, Image Uploads, First-Reply Backlink Strategy.
"""

import os
import sys
import argparse
from typing import List, Optional
import tweepy
from dotenv import load_dotenv

# Load credentials
load_dotenv("c:/kigyou-list/.env")

API_KEY = os.getenv("X_API_KEY")
API_SECRET = os.getenv("X_API_SECRET")
ACCESS_TOKEN = os.getenv("X_ACCESS_TOKEN")
ACCESS_TOKEN_SECRET = os.getenv("X_ACCESS_TOKEN_SECRET")
BEARER_TOKEN = os.getenv("X_BEARER_TOKEN")


def get_clients():
    """Initializes Tweepy v2 Client and v1.1 API (for media upload)."""
    if not all([API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET]):
        raise ValueError("Missing X API credentials in .env file!")

    # v2 Client for posting tweets
    client = tweepy.Client(
        bearer_token=BEARER_TOKEN,
        consumer_key=API_KEY,
        consumer_secret=API_SECRET,
        access_token=ACCESS_TOKEN,
        access_token_secret=ACCESS_TOKEN_SECRET
    )

    # v1.1 API handler for media upload
    auth = tweepy.OAuth1UserHandler(
        consumer_key=API_KEY,
        consumer_secret=API_SECRET,
        access_token=ACCESS_TOKEN,
        access_token_secret=ACCESS_TOKEN_SECRET
    )
    api_v1 = tweepy.API(auth)

    return client, api_v1


def upload_media(api_v1, image_path: str) -> Optional[int]:
    """Uploads an image via v1.1 API and returns media_id."""
    if not image_path or not os.path.exists(image_path):
        return None
    try:
        print(f"[*] Uploading image: {image_path}...")
        media = api_v1.media_upload(filename=image_path)
        print(f"[+] Media uploaded successfully. Media ID: {media.media_id}")
        return media.media_id
    except Exception as e:
        print(f"[-] Failed to upload media: {e}")
        return None


def post_single_tweet(text: str, image_path: Optional[str] = None, in_reply_to_tweet_id: Optional[int] = None) -> Optional[dict]:
    """Posts a single tweet with optional media and optional reply target."""
    client, api_v1 = get_clients()
    media_ids = None

    if image_path:
        mid = upload_media(api_v1, image_path)
        if mid:
            media_ids = [mid]

    try:
        kwargs = {"text": text}
        if media_ids:
            kwargs["media_ids"] = media_ids
        if in_reply_to_tweet_id:
            kwargs["in_reply_to_tweet_id"] = in_reply_to_tweet_id

        response = client.create_tweet(**kwargs)
        tweet_id = response.data["id"]
        tweet_url = f"https://x.com/kigyoulist/status/{tweet_id}"
        print(f"[+] Tweet published: {tweet_url}")
        return {"id": tweet_id, "url": tweet_url}
    except Exception as e:
        print(f"[-] Error publishing tweet: {e}")
        return None


def post_thread(tweets: List[str], first_image_path: Optional[str] = None) -> List[dict]:
    """
    Posts a thread of tweets sequentially.
    First tweet gets the image (if provided).
    Subsequent tweets are posted as replies to the preceding tweet.
    """
    if not tweets:
        print("[-] No tweets provided in thread.")
        return []

    client, api_v1 = get_clients()
    results = []
    prev_tweet_id = None

    for idx, tweet_text in enumerate(tweets):
        img = first_image_path if idx == 0 else None
        print(f"[*] Posting Thread Part {idx + 1}/{len(tweets)}...")

        media_ids = None
        if img:
            mid = upload_media(api_v1, img)
            if mid:
                media_ids = [mid]

        kwargs = {"text": tweet_text.strip()}
        if media_ids:
            kwargs["media_ids"] = media_ids
        if prev_tweet_id:
            kwargs["in_reply_to_tweet_id"] = prev_tweet_id

        try:
            res = client.create_tweet(**kwargs)
            curr_id = res.data["id"]
            curr_url = f"https://x.com/kigyoulist/status/{curr_id}"
            results.append({"id": curr_id, "url": curr_url})
            prev_tweet_id = curr_id
            print(f"[+] Part {idx + 1} published: {curr_url}")
        except Exception as e:
            print(f"[-] Failed to publish part {idx + 1}: {e}")
            break

    return results


def check_account():
    """Verifies account credentials and prints user profile info."""
    client, _ = get_clients()
    try:
        me = client.get_me()
        print("=" * 50)
        print("X Account Status: ACTIVE & VERIFIED")
        print(f"Username: @{me.data.username}")
        print(f"Display Name: {me.data.name}")
        print(f"User ID: {me.data.id}")
        print(f"Profile URL: https://x.com/{me.data.username}")
        print("=" * 50)
        return True
    except Exception as e:
        print(f"[-] Connection test failed: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Kigyou-list X Publisher CLI")
    parser.add_argument("--check", action="store_true", help="Check account authentication status")
    parser.add_argument("--text", type=str, help="Text content for a single tweet")
    parser.add_argument("--media", type=str, help="Absolute path to an image to attach")
    parser.add_argument("--thread-file", type=str, help="Path to a text/md file with tweets separated by '---'")
    parser.add_argument("--reply-to", type=int, help="Tweet ID to reply to")

    args = parser.parse_args()

    if args.check:
        check_account()
        return

    if args.thread_file:
        if not os.path.exists(args.thread_file):
            print(f"[-] Thread file not found: {args.thread_file}")
            sys.exit(1)
        with open(args.thread_file, "r", encoding="utf-8") as f:
            content = f.read()
        parts = [p.strip() for p in content.split("---") if p.strip()]
        
        # Use browser engine for free, reliable thread posting
        from x_browser_publisher import post_thread_browser
        post_thread_browser(parts, image_path=args.media)
        return

    if args.text:
        from x_browser_publisher import post_tweet_browser
        post_tweet_browser(args.text, image_path=args.media)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
