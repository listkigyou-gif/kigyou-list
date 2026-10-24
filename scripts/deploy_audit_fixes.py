import paramiko
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"
REMOTE_BASE = "/var/www/kigyou-list"

ITEMS_TO_SYNC = [
    "frontend/src/components/Header.tsx",
    "frontend/src/components/Footer.tsx",
    "frontend/src/components/SearchClientContainer.tsx",
    "frontend/src/components/SearchSidebar.tsx",
    "frontend/src/app/[locale]/search/page.tsx",
    "frontend/src/components/CompanyActions.tsx",
    "frontend/src/components/dashboard/WatchlistTab.tsx",
    "frontend/src/components/dashboard/DeveloperTab.tsx",
    "frontend/src/components/company/CompanyLicensesSection.tsx",
    "frontend/src/components/company/CompanyQuickAuditModal.tsx",
    "frontend/src/components/company/CompanyHubBacklinks.tsx",
    "frontend/src/app/[locale]/dashboard/page.tsx",
    "frontend/src/app/[locale]/page.tsx",
    "frontend/src/app/[locale]/pricing/page.tsx",
    "frontend/src/app/[locale]/company/[id]/page.tsx",
    "frontend/src/app/[locale]/invoice",
    "frontend/src/app/[locale]/changes",
    "frontend/src/app/[locale]/jobs",
    "frontend/src/app/[locale]/new-companies",
    "frontend/src/app/[locale]/status",
    "frontend/src/app/api/invoice",
    "frontend/src/app/api/user/watchlist",
    "frontend/src/lib/db.ts",
    "frontend/src/lib/hubUtils.ts",
    "frontend/src/lib/formCampaigns.ts",
    "scripts/google_indexing_vip.py",
    ".agents/skills/b2b-ui-commander/SKILL.md"
]

def sftp_upload_item(sftp, ssh, local_path, remote_path):
    if os.path.isfile(local_path):
        remote_dir = os.path.dirname(remote_path)
        ssh.exec_command(f"mkdir -p {remote_dir}")
        print(f"Uploading file {local_path} -> {remote_path}...")
        sftp.put(local_path, remote_path)
    elif os.path.isdir(local_path):
        ssh.exec_command(f"mkdir -p {remote_path}")
        for root, dirs, files in os.walk(local_path):
            rel_root = os.path.relpath(root, local_path)
            target_dir = os.path.join(remote_path, rel_root).replace("\\", "/")
            ssh.exec_command(f"mkdir -p {target_dir}")
            for f in files:
                l_file = os.path.join(root, f)
                r_file = os.path.join(target_dir, f).replace("\\", "/")
                print(f"Uploading {l_file} -> {r_file}...")
                sftp.put(l_file, r_file)

def main():
    print(f"Connecting to VPS {VPS_HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)
    print("SSH Connected!")
    
    sftp = ssh.open_sftp()
    
    local_base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    for rel_path in ITEMS_TO_SYNC:
        local_path = os.path.join(local_base, rel_path.replace("/", os.sep))
        remote_path = f"{REMOTE_BASE}/{rel_path}"
        sftp_upload_item(sftp, ssh, local_path, remote_path)
        
    sftp.close()
    print("All files & directories uploaded successfully!")
    
    print("\n--- Building Frontend on VPS ---")
    build_cmd = (
        "cd /var/www/kigyou-list/frontend && "
        "npm run build && "
        "pm2 reload 0 && "
        "pm2 status"
    )
    stdin, stdout, stderr = ssh.exec_command(build_cmd, get_pty=True)
    for line in iter(stdout.readline, ""):
        print(line, end="")
        
    print("\n[SUCCESS] Deployed Streamlined Menu, Invoice, & Dynamic Hubs to Production VPS!")
    ssh.close()

if __name__ == "__main__":
    main()
