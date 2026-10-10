"""
KIGYOU-LIST: 1,000-Company Batch Orchestrator
Executes campaign in batches of 1,000 target companies.
After each batch:
1. Runs automated error analyzer (analyzer.py)
2. Summarizes success & protection rates
3. Either pauses for AI/user optimization review OR automatically launches the next batch
"""

import os
import sys
import time
import argparse
import subprocess
from dotenv import load_dotenv

# Ensure UTF-8 on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTERNAL_RUNNER = os.path.join(BASE_DIR, "internal_runner.py")
ANALYZER_SCRIPT = os.path.join(BASE_DIR, "analyzer.py")

def run_batch(campaign_id: str, batch_size: int = 1000, concurrency: int = 8, rotate_every: int = 2) -> int:
    print("\n" + "=" * 78)
    print(f"  🚀 LAUNCHING 1,000-COMPANY BATCH FOR CAMPAIGN: {campaign_id}")
    print(f"  Target Limit: {batch_size} | Concurrency: {concurrency} workers | WARP Rotating Pool: Active")
    print("=" * 78 + "\n")

    cmd = [
        sys.executable,
        INTERNAL_RUNNER,
        "--campaign-id", campaign_id,
        "--limit", str(batch_size),
        "--concurrency", str(concurrency),
        "--rotate-every", str(rotate_every),
        "--warp",
        "--live"
    ]

    ret = subprocess.call(cmd)
    return ret

def run_diagnostics(campaign_id: str, minutes: int = 45):
    print("\n" + "=" * 78)
    print("  🔍 RUNNING POST-BATCH ERROR ANALYZER (AI CONTINUOUS FLYWHEEL)")
    print("=" * 78 + "\n")
    cmd = [sys.executable, ANALYZER_SCRIPT, campaign_id, str(minutes)]
    subprocess.call(cmd)

def main():
    parser = argparse.ArgumentParser(description="Run 1,000-company batches with automated analysis")
    parser.add_argument("--campaign-id", required=True, help="Campaign UUID")
    parser.add_argument("--batch-size", type=int, default=1000, help="Batch size (default: 1000)")
    parser.add_argument("--concurrency", type=int, default=8, help="Concurrent workers (default: 8)")
    parser.add_argument("--rotate-every", type=int, default=2, help="Proxy rotation interval (default: 2)")
    parser.add_argument("--auto-next", action="store_true", help="Automatically trigger next batch without pausing")
    parser.add_argument("--cooldown", type=int, default=10, help="Cooldown seconds between batches (default: 10)")

    args = parser.parse_args()

    batch_index = 1
    while True:
        print(f"\n>>> [BATCH #{batch_index}] STARTING {args.batch_size} TARGETS <<<\n")
        exit_code = run_batch(
            campaign_id=args.campaign_id,
            batch_size=args.batch_size,
            concurrency=args.concurrency,
            rotate_every=args.rotate_every
        )

        # Run diagnostics after every batch
        run_diagnostics(args.campaign_id, minutes=50)

        if not args.auto_next:
            print(f"\n[✓] Batch #{batch_index} completed. Orchestrator pausing for review.")
            print("To run the next batch, invoke with --auto-next or run batch_1000_orchestrator.py again.")
            break

        print(f"\n[🔄] Batch #{batch_index} finished. Cooldown {args.cooldown}s before Batch #{batch_index + 1}...")
        time.sleep(args.cooldown)
        batch_index += 1

if __name__ == "__main__":
    main()
