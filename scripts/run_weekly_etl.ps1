# Kigyou-list: Weekly ETL & Crawler Runner for Windows
# ===================================================
# This script is designed to be executed by Windows Task Scheduler.
# It runs the update crawlers, processes staging, crawls target websites,
# consolidates data, tags industries using AI, and syncs to Postgres.

$ErrorActionPreference = "Stop"

# Resolve paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..")
Write-Output "[*] Kigyou-list ETL Runner started. Project Root: $ProjectRoot"

# Define Python executable path (Update if using virtual environments e.g. .venv\Scripts\python.exe)
$PythonExec = "python"

# --- STEP 1: HelloWork Incremental Scraping ---
Write-Output "`n[1/3] Running HelloWork Incremental Crawler..."
Set-Location -Path (Join-Path $ProjectRoot "crawlers/hellowork")
# Stage harvest: Scrape only page 1-30 for new jobs (incremental mode)
& $PythonExec main.py --mode update --stage harvest
# Stage extract: Process queued pending jobs from database
& $PythonExec main.py --mode update --stage extract

# --- STEP 2: Yahoo Maps Scraping (Targeted) ---
Write-Output "`n[2/3] Running Yahoo Maps Crawler..."
Set-Location -Path (Join-Path $ProjectRoot "crawlers/yahoo")
# Search Yahoo Map for new corporate registry items (limit to 500 per weekly cycle to avoid block)
& $PythonExec yahoo_searcher.py --limit 500 --headless

# --- STEP 3: Run Orchestrator Pipeline ---
Write-Output "`n[3/4] Running central ETL Pipeline Orchestrator..."
Set-Location -Path $ProjectRoot
# Run Step 1 (G-Biz Sync), Step 3 (Staging Load), Step 4 (Website Crawl limit 100),
# Step 5 (Consolidation), Step 6 (AI Tagging), and Step 7 (PostgreSQL Sync)
& $PythonExec scripts/run_pipeline.py --steps 1,3,4,5,6,7 --limit 100 --offline

# --- STEP 4: Programmatic Blog Post Generation (JP & EN) ---
Write-Output "`n[4/4] Running Programmatic Blog Post Generators..."
Set-Location -Path (Join-Path $ProjectRoot "frontend")
Write-Output "[*] Generating Japanese blog post..."
npx tsx src/scripts/generate-blog.ts
Write-Output "[*] Generating English blog post..."
npx tsx src/scripts/generate-blog-en.ts

Write-Output "`n[+] Weekly ETL Run Completed Successfully!"
