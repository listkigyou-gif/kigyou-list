import asyncio
import sqlite3
import random
import sys
import os
from playwright.async_api import async_playwright

# Add current directory and crawlers/hellowork to sys.path
sys.path.insert(0, os.path.abspath('.'))
sys.path.insert(0, os.path.abspath('crawlers/hellowork'))
from extractor import HelloworkExtractor, PROXY_CONFIGS

async def test_run():
    extractor = HelloworkExtractor()
    db_path = 'data/hellowork.db'
    test_jobs = ['0909003605261', '1105009589461']
    
    # 1. Reset jobs to pending with retry_count = 0
    conn = sqlite3.connect(db_path)
    conn.execute("UPDATE jobs_queue SET status='pending', retry_count=0 WHERE job_id IN (?, ?)", test_jobs)
    conn.commit()
    conn.close()
    
    print("--- STARTING RETRY TEST FOR JOBS:", test_jobs, "---")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # We will loop 4 times. By run #3 it should fail and mark failed permanently.
        # Run #4 should find no pending jobs to run.
        for run_idx in range(1, 5):
            print(f"\n=== SIMULATED BATCH RUN #{run_idx} ===")
            
            # Fetch the status and retry_count of test_jobs
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT job_id, status, retry_count FROM jobs_queue WHERE job_id IN (?, ?)", test_jobs)
            jobs_to_run = cursor.fetchall()
            conn.close()
            
            print("Jobs state in DB before processing:", jobs_to_run)
            
            # Filter to run only jobs that are 'pending'
            jobs_to_run = [r for r in jobs_to_run if r[1] == 'pending']
            if not jobs_to_run:
                print("No more pending jobs to run. Test loop finished.")
                break
                
            # Set to processing in DB
            conn = sqlite3.connect(db_path)
            placeholders = ','.join(['?'] * len(jobs_to_run))
            job_ids = [r[0] for r in jobs_to_run]
            conn.execute(f"UPDATE jobs_queue SET status='processing' WHERE job_id IN ({placeholders})", job_ids)
            conn.commit()
            conn.close()
            
            async def task_wrapper(jid, idx, retry_count):
                # Rotate proxy dynamically based on retry_count
                cfg_idx = (idx + retry_count) % len(PROXY_CONFIGS)
                cfg = PROXY_CONFIGS[cfg_idx]
                
                USER_AGENTS = [
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36"
                ]
                ua = random.choice(USER_AGENTS)
                
                ctx_args = {
                    "user_agent": ua,
                    "viewport": {"width": 1280, "height": 800},
                    "locale": "ja-JP",
                    "timezone_id": "Asia/Tokyo"
                }
                if cfg: ctx_args["proxy"] = cfg
                
                temp_ctx = await browser.new_context(**ctx_args)
                page = await temp_ctx.new_page()
                try:
                    print(f"[{jid}] Run #{run_idx}: Trying with proxy={cfg['server']}, UA={ua[:30]}..., retry_count={retry_count}")
                    success = await extractor.process_single_job(page, jid)
                    if success:
                        print(f"[{jid}] Run #{run_idx}: SUCCESS!")
                        return True
                    print(f"[{jid}] Run #{run_idx}: process_single_job returned False")
                    raise Exception("Process returned False")
                except Exception as e:
                    print(f"[{jid}] Run #{run_idx}: FAILED with error: {str(e)}")
                    # Call mark_failed in the extractor
                    await extractor.mark_failed(jid, permanent=False)
                    return False
                finally:
                    await page.close()
                    await temp_ctx.close()

            # Run in parallel
            await asyncio.gather(*[task_wrapper(row[0], i, row[2] or 0) for i, row in enumerate(jobs_to_run)])
            
        await browser.close()
        
    # Check final state of the jobs in the database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT job_id, status, retry_count FROM jobs_queue WHERE job_id IN (?, ?)", test_jobs)
    print("\n=== FINAL STATE IN DB ===")
    print(cursor.fetchall())
    conn.close()

if __name__ == "__main__":
    asyncio.run(test_run())
