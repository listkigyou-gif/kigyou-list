import os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from vps_remote_exec import run_command

cmd = "sudo -u postgres psql -d kigyou_list -c \"SELECT inhrelid::regclass as partition_name FROM pg_inherits WHERE inhparent = 'companies'::regclass;\" "
out, err = run_command(cmd)
print("PARTITIONS:")
print(out)
