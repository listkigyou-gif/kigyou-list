import os
import re
import glob

def analyze_logs():
    logs_dir = r"c:\TUHOCLAPTRINH\kigyou-list\crawlers\yahoo\logs"
    log_files = glob.glob(os.path.join(logs_dir, "crawler_*.log"))
    
    if not log_files:
        print("No crawler log files found in directory:", logs_dir)
        return
        
    runs_before_block = []
    total_blocks_found = 0
    total_proactive_rotations = 0
    
    for log_path in log_files:
        if not os.path.exists(log_path):
            continue
            
        with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            
        request_count = 0
        for line in lines:
            # Check for a search request (successful/unsuccessful search attempts)
            # FOUND or NOT_FOUND indicates a request was sent to Yahoo
            if "FOUND [" in line or "NOT_FOUND |" in line:
                request_count += 1
            
            # Check for a block event
            elif "[BLOCK_429]" in line or "[BLOCKED]" in line:
                if request_count > 0:
                    runs_before_block.append(request_count)
                total_blocks_found += 1
                request_count = 0  # Reset counter on block/rotation
                
            # Check for proactive rotation
            elif "[PROACTIVE]" in line:
                total_proactive_rotations += 1
                request_count = 0  # Reset counter on proactive rotation
                
    if not runs_before_block:
        print("No block events with prior request counts found in logs.")
        print(f"Total blocks detected: {total_blocks_found}")
        print(f"Total proactive rotations: {total_proactive_rotations}")
        return
        
    runs_before_block.sort()
    avg_runs = sum(runs_before_block) / len(runs_before_block)
    median_runs = runs_before_block[len(runs_before_block) // 2]
    min_runs = min(runs_before_block)
    max_runs = max(runs_before_block)
    
    print(f"--- LOG ANALYSIS REPORT ---")
    print(f"Total log files analyzed: {len(log_files)}")
    print(f"Total blocks detected: {total_blocks_found}")
    print(f"Total proactive rotations: {total_proactive_rotations}")
    print(f"Number of clean runs ending in a block: {len(runs_before_block)}")
    print(f"Requests before Yahoo blocks:")
    print(f"  - Minimum: {min_runs}")
    print(f"  - Maximum: {max_runs}")
    print(f"  - Average (Mean): {avg_runs:.1f}")
    print(f"  - Median: {median_runs}")
    
if __name__ == "__main__":
    analyze_logs()
