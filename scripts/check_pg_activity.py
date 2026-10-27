import os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from vps_remote_exec import run_command

cmd = "sudo -u postgres psql -d kigyou_list -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state != 'idle' AND query LIKE '%indexnow_submissions%' AND pid != pg_backend_pid();\" "
out, err = run_command(cmd)
print("TERMINATED:", out)

cmd2 = "cd /var/www/kigyou-list && node scripts/auto_indexnow_submitter_pg.js --dry-run --batch-size 10"
out2, err2 = run_command(cmd2)
print("INDEXNOW TEST OUTPUT:\n", out2)
print("INDEXNOW TEST ERR:\n", err2)
