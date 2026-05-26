# -*- coding: utf-8 -*-
import logging
import time
import asyncio
from datetime import datetime, timedelta, timezone

logger = logging.getLogger('hellowork_maintenance')

def is_hellowork_maintenance(now_jst=None):
    if now_jst is None:
        now_utc = datetime.now(timezone.utc)
        now_jst = now_utc + timedelta(hours=9)
    
    # 1. Weekly: Saturday 24:00 - Sunday 06:00 JST (equivalent to Sunday 00:00 - 06:00 JST)
    # weekday(): Monday is 0, Sunday is 6
    if now_jst.weekday() == 6:
        if 0 <= now_jst.hour < 6:
            return True
            
    # 2. Monthly: Last day of the month 21:30 to 1st day of the next month 06:00 JST
    next_day = now_jst + timedelta(days=1)
    is_last_day = next_day.month != now_jst.month
    if is_last_day:
        if now_jst.hour > 21 or (now_jst.hour == 21 and now_jst.minute >= 30):
            return True
            
    if now_jst.day == 1:
        if 0 <= now_jst.hour < 6:
            return True
            
    return False

def get_maintenance_remaining_seconds(now_jst=None):
    if now_jst is None:
        now_utc = datetime.now(timezone.utc)
        now_jst = now_utc + timedelta(hours=9)
        
    if not is_hellowork_maintenance(now_jst):
        return 0
        
    # Case 1: Weekly Sunday 00:00 - 06:00 JST
    if now_jst.weekday() == 6 and 0 <= now_jst.hour < 6:
        target = now_jst.replace(hour=6, minute=0, second=0, microsecond=0)
        return max(int((target - now_jst).total_seconds()), 60)
        
    # Case 2a: 1st day of month 00:00 - 06:00 JST
    if now_jst.day == 1 and 0 <= now_jst.hour < 6:
        target = now_jst.replace(hour=6, minute=0, second=0, microsecond=0)
        return max(int((target - now_jst).total_seconds()), 60)
        
    # Case 2b: Last day of month 21:30 - 24:00 JST
    next_day = now_jst + timedelta(days=1)
    is_last_day = next_day.month != now_jst.month
    if is_last_day:
        tomorrow_6am = next_day.replace(hour=6, minute=0, second=0, microsecond=0)
        return max(int((tomorrow_6am - now_jst).total_seconds()), 60)
        
    return 0

def wait_if_maintenance(service_name="HelloWork Scraper"):
    """Checks if HelloWork is in maintenance and sleeps until it ends."""
    while True:
        now_utc = datetime.now(timezone.utc)
        now_jst = now_utc + timedelta(hours=9)
        if not is_hellowork_maintenance(now_jst):
            break
            
        secs = get_maintenance_remaining_seconds(now_jst)
        sleep_secs = secs + 60
        resume_time = (now_jst + timedelta(seconds=sleep_secs)).strftime('%Y-%m-%d %H:%M:%S')
        logger.info(f"[MAINTENANCE] {service_name} detected HelloWork system maintenance JST time.")
        logger.info(f"[MAINTENANCE] Sleeping for {sleep_secs} seconds ({sleep_secs/60:.1f} minutes). Will resume at approx {resume_time} JST.")
        time.sleep(sleep_secs)

async def async_wait_if_maintenance(service_name="HelloWork Scraper"):
    """Checks if HelloWork is in maintenance and sleeps (async) until it ends."""
    while True:
        now_utc = datetime.now(timezone.utc)
        now_jst = now_utc + timedelta(hours=9)
        if not is_hellowork_maintenance(now_jst):
            break
            
        secs = get_maintenance_remaining_seconds(now_jst)
        sleep_secs = secs + 60
        resume_time = (now_jst + timedelta(seconds=sleep_secs)).strftime('%Y-%m-%d %H:%M:%S')
        logger.info(f"[MAINTENANCE] {service_name} detected HelloWork system maintenance JST time.")
        logger.info(f"[MAINTENANCE] Sleeping for {sleep_secs} seconds ({sleep_secs/60:.1f} minutes). Will resume at approx {resume_time} JST.")
        await asyncio.sleep(sleep_secs)

if __name__ == "__main__":
    import sys
    # Reconfigure stdout to UTF-8 to avoid encoding crashes on Windows
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
        
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    now_utc = datetime.now(timezone.utc)
    now_jst = now_utc + timedelta(hours=9)
    print(f"Current JST Time: {now_jst.strftime('%Y-%m-%d %H:%M:%S')} (Weekday: {now_jst.weekday()})")
    in_maint = is_hellowork_maintenance(now_jst)
    print(f"Is HelloWork currently in maintenance? {in_maint}")
    if in_maint:
        rem = get_maintenance_remaining_seconds(now_jst)
        print(f"Remaining seconds: {rem} ({rem/60:.1f} minutes)")
