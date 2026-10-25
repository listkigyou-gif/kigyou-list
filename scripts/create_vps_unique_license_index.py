import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)

cmd = """sudo -u postgres psql -d kigyoulist -c "
DELETE FROM company_licenses a USING (
    SELECT MIN(ctid) as ctid, corporate_number, license_type, license_number
    FROM company_licenses 
    GROUP BY corporate_number, license_type, license_number HAVING COUNT(*) > 1
) b
WHERE a.corporate_number = b.corporate_number 
  AND a.license_type = b.license_type 
  AND a.license_number = b.license_number 
  AND a.ctid <> b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_corp_type_num ON company_licenses(corporate_number, license_type, license_number);
"
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
