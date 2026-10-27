import os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from vps_remote_exec import run_command

print("[*] Creating partitioned index on companies(updated_at DESC)...")
cmd = "sudo -u postgres psql -d kigyou_list -c \"CREATE INDEX IF NOT EXISTS idx_companies_updated_at ON companies (updated_at DESC);\""
out, err = run_command(cmd)
print("OUT:", out)
print("ERR:", err)
