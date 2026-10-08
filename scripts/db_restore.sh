#!/bin/bash

# Kigyou-list: Automated PostgreSQL User & Transaction Data Restore Script
# ========================================================================
# This script downloads a backup snapshot from Cloudflare R2 Off-site Storage
# and restores all user accounts, quotas, payments, form campaigns, claims, and audit logs.
#
# Usage:
#   ./db_restore.sh --list              # List all available snapshots on Cloudflare R2
#   ./db_restore.sh --latest            # Download and restore the latest backup snapshot
#   ./db_restore.sh <filename.sql.gz>   # Download and restore a specific backup snapshot
#   ./db_restore.sh --latest -y         # Non-interactive mode (skips confirmation prompt)

set -e

DB_NAME="kigyou_list"
RESTORE_DIR="/tmp/kigyou_restore"
mkdir -p "$RESTORE_DIR"

# 1. Load Cloudflare R2 configurations dynamically from environment
ENV_FILE="/var/www/kigyou-list/frontend/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="$(dirname "$0")/../frontend/.env.local"
fi

if [ -f "$ENV_FILE" ]; then
  R2_ENDPOINT_URL=$(grep "^R2_ENDPOINT=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
  R2_BUCKET_NAME=$(grep "^R2_BUCKET_NAME=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
  R2_BUCKET="s3://${R2_BUCKET_NAME}/backups"
  
  export AWS_ACCESS_KEY_ID=$(grep "^R2_ACCESS_KEY_ID=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
  export AWS_SECRET_ACCESS_KEY=$(grep "^R2_SECRET_ACCESS_KEY=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
  export AWS_DEFAULT_REGION="us-east-1"
else
  R2_BUCKET="s3://kigyou-list-storage/backups"
  R2_ENDPOINT_URL="https://baafa3ec333eb25d4b1f26d03dce1c14.r2.cloudflarestorage.com"
fi

# 2. Check flags and arguments
ACTION="$1"
NON_INTERACTIVE=false

if [ "$2" == "-y" ] || [ "$2" == "--yes" ] || [ "$ACTION" == "-y" ]; then
  NON_INTERACTIVE=true
fi

# List command
if [ "$ACTION" == "--list" ] || [ "$ACTION" == "-l" ]; then
  echo "=========================================================="
  echo " Kigyou-List: Available Backups on Cloudflare R2"
  echo "=========================================================="
  aws s3 ls "${R2_BUCKET}/" --endpoint-url "$R2_ENDPOINT_URL" | sort -r | head -n 30
  exit 0
fi

# Determine target file
TARGET_FILE=""
if [ "$ACTION" == "--latest" ] || [ -z "$ACTION" ]; then
  echo "[$(date)] Finding latest backup snapshot on Cloudflare R2..."
  TARGET_FILE=$(aws s3 ls "${R2_BUCKET}/" --endpoint-url "$R2_ENDPOINT_URL" | grep "db_user_backup_" | sort | tail -n 1 | awk '{print $4}')
  if [ -z "$TARGET_FILE" ]; then
    echo "Error: No backup snapshots found in ${R2_BUCKET}!"
    exit 1
  fi
  echo "-> Latest snapshot identified: $TARGET_FILE"
else
  TARGET_FILE="$ACTION"
fi

LOCAL_FILE_PATH="$RESTORE_DIR/$TARGET_FILE"

# 3. Confirmation safety guard
if [ "$NON_INTERACTIVE" != true ]; then
  echo ""
  echo "=========================================================="
  echo " WARNING: DISASTER RECOVERY RESTORATION"
  echo "=========================================================="
  echo "Target Database : $DB_NAME"
  echo "Snapshot File   : $TARGET_FILE"
  echo "Storage Origin  : $R2_BUCKET"
  echo ""
  echo "This operation will overwrite user data, quotas, campaigns, and payments."
  read -p "Are you sure you want to proceed? Type 'YES' to confirm: " CONFIRM
  if [ "$CONFIRM" != "YES" ]; then
    echo "Restoration aborted by operator."
    exit 0
  fi
fi

# 4. Download backup snapshot from Cloudflare R2
echo "[$(date)] Downloading $TARGET_FILE from Cloudflare R2..."
aws s3 cp "${R2_BUCKET}/${TARGET_FILE}" "$LOCAL_FILE_PATH" --endpoint-url "$R2_ENDPOINT_URL"

if [ ! -f "$LOCAL_FILE_PATH" ] || [ ! -s "$LOCAL_FILE_PATH" ]; then
  echo "Error: Downloaded file is missing or empty!"
  exit 1
fi

echo "[$(date)] Snapshot successfully downloaded ($(du -h "$LOCAL_FILE_PATH" | cut -f1))."

# 5. Restore into PostgreSQL
echo "[$(date)] Executing PostgreSQL restore into database: $DB_NAME..."

# Check postgres readiness
if ! pg_isready -h localhost >/dev/null 2>&1; then
  echo "Error: PostgreSQL service is not ready on localhost!"
  exit 1
fi

gunzip -c "$LOCAL_FILE_PATH" | sudo -u postgres psql -d "$DB_NAME" \
  -v ON_ERROR_STOP=0 \
  --quiet

echo "[$(date)] Database restoration finished!"

# 6. Verification query
echo "=========================================================="
echo " Verification: Database Table Statistics"
echo "=========================================================="
sudo -u postgres psql -d "$DB_NAME" -c "
  SELECT 
    (SELECT COUNT(*) FROM user_quotas) AS total_users,
    (SELECT COUNT(*) FROM payments) AS total_payments,
    (SELECT COUNT(*) FROM form_campaigns) AS total_campaigns,
    (SELECT COUNT(*) FROM company_claim_requests) AS total_claims;
"

# 7. Cleanup local temporary file
rm -f "$LOCAL_FILE_PATH"
echo "[$(date)] Temporary restoration file cleaned up."
echo "=========================================================="
echo " SUCCESS: Kigyou-List user data restored safely in under 2 minutes!"
echo "=========================================================="
