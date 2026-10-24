import paramiko
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"
REMOTE_BASE = "/var/www/kigyou-list"

FILES_TO_SYNC = [
    "frontend/src/app/globals.css",
    "frontend/src/app/[locale]/layout.tsx",
    "frontend/src/app/[locale]/page.tsx",
    "frontend/src/app/[locale]/developer/page.tsx",
    "frontend/src/components/dashboard/DeveloperTab.tsx",
    ".agents/skills/jp-b2b-design-system/SKILL.md",
    ".agents/skills/b2b-feature-orchestrator/SKILL.md",
    "FEATURES.md"
]

def main():
    print(f"Connecting to VPS {VPS_HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)
    print("SSH Connected!")
    
    sftp = ssh.open_sftp()
    
    local_base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    for rel_path in FILES_TO_SYNC:
        local_path = os.path.join(local_base, rel_path.replace("/", os.sep))
        remote_path = f"{REMOTE_BASE}/{rel_path}"
        
        # Ensure remote dir exists
        remote_dir = os.path.dirname(remote_path)
        ssh.exec_command(f"mkdir -p {remote_dir}")
        
        print(f"Uploading {rel_path} -> {remote_path}...")
        sftp.put(local_path, remote_path)
        
    sftp.close()
    print("Files uploaded successfully!")
    
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
        
    print("\n[SUCCESS] Deployed UI Dark Mode Fixes to VPS!")
    ssh.close()

if __name__ == "__main__":
    main()
