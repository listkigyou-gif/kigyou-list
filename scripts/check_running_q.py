import os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from vps_remote_exec import run_command

cmd = "sudo -u postgres psql -d kigyou_list -c \"SELECT pid, age(clock_timestamp(), query_start), state, query FROM pg_stat_activity WHERE state != 'idle';\" "
out, err = run_command(cmd)
print("RUNNING QUERIES:")
print(out)
