#!/bin/bash

# Kigyou-list: Optimized PostgreSQL User & Transaction Data Backup Script
# ======================================================================
# This script dumps only dynamic user-related tables (quotas, jobs, billing, keys, etc.)
# and excludes all heavy company reference tables to minimize Cloudflare R2 storage usage.

# 1. Configuration variables
DB_NAME="kigyou_list"
BACKUP_DIR="/home/ubuntu/backups"
FILE_NAME="db_user_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

# Attempt to load Cloudflare R2 configurations dynamically from Next.js environment file
ENV_FILE="/var/www/kigyou-list/frontend/.env.local"
if [ -f "$ENV_FILE" ]; then
  R2_ENDPOINT_URL=$(grep "^R2_ENDPOINT=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
  R2_BUCKET_NAME=$(grep "^R2_BUCKET_NAME=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
  R2_BUCKET="s3://$R2_BUCKET_NAME/backups"
  
  # Extract and export credentials for the AWS CLI dynamically
  export AWS_ACCESS_KEY_ID=$(grep "^R2_ACCESS_KEY_ID=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
  export AWS_SECRET_ACCESS_KEY=$(grep "^R2_SECRET_ACCESS_KEY=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
  export AWS_DEFAULT_REGION="us-east-1"
else
  # Local development fallbacks
  R2_BUCKET="s3://kigyou-list-storage/backups"
  R2_ENDPOINT_URL="https://baafa3ec333eb25d4b1f26d03dce1c14.r2.cloudflarestorage.com"
fi

mkdir -p $BACKUP_DIR

echo "[$(date)] Starting PostgreSQL Backup (User & Payment Data only)..."

# 2. pg_dump executing with table exclusion filters
# Wildcards are used to catch all partitions of companies (e.g. companies_p01, etc.)
sudo -u postgres pg_dump -d $DB_NAME \
  --exclude-table="companies*" \
  --exclude-table="business_signals*" \
  --exclude-table="company_industries*" \
  --exclude-table="financial_records*" \
  --exclude-table="m_industries*" \
  --exclude-table="sitemap_companies*" \
  --exclude-table="prefecture_counts*" \
  --exclude-table="industry_counts*" \
  --exclude-table="city_counts*" \
  --exclude-table="database_stats*" \
  --exclude-table="database_stats_history*" \
  --exclude-table="yahoo_stats_history*" \
  --exclude-table="raw_*" \
  | gzip > $BACKUP_DIR/$FILE_NAME

if [ $? -eq 0 ]; then
  echo "[$(date)] Database dump successfully created: $BACKUP_DIR/$FILE_NAME"
else
  echo "[$(date)] Error: PostgreSQL pg_dump failed!"
  exit 1
fi

# 3. Upload backup file to Cloudflare R2
echo "[$(date)] Uploading backup file to Cloudflare R2..."
aws s3 cp $BACKUP_DIR/$FILE_NAME $R2_BUCKET/$FILE_NAME --endpoint-url $R2_ENDPOINT_URL

if [ $? -eq 0 ]; then
  echo "[$(date)] Upload completed successfully."
else
  echo "[$(date)] Error: Failed to upload backup to R2!"
  exit 1
fi

# 4. Cleanup local file on VPS to save disk space
rm -f $BACKUP_DIR/$FILE_NAME
echo "[$(date)] Cleaned up local backup file. Process complete!"
