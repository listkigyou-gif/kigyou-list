import os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from vps_remote_exec import run_command
import json

cmd = "sudo -u postgres psql -d kigyou_list -t -A -c \"SELECT corporate_number, company_name, phone_number, website_url FROM companies WHERE phone_number IS NOT NULL AND phone_number != '' LIMIT 3;\""
out, err = run_command(cmd)
print("[*] Companies with Phone (Rich):")
print(out)

cmd2 = "sudo -u postgres psql -d kigyou_list -t -A -c \"SELECT corporate_number, company_name, phone_number, website_url FROM companies WHERE (phone_number IS NULL OR phone_number = '') AND (website_url IS NULL OR website_url = '') AND (capital_amount IS NULL) LIMIT 3;\""
out2, err2 = run_command(cmd2)
print("[*] Companies without Phone/Web/Capital (Thin):")
print(out2)
