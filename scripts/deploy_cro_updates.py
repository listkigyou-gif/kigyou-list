#!/usr/bin/env python3
import os
import sys
import paramiko

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"
REMOTE_FRONTEND_DIR = "/var/www/kigyou-list/frontend"
LOCAL_ROOT = r"c:\kigyou-list"

FILES_TO_SYNC = [
    ("frontend/src/lib/gtag.ts", f"{REMOTE_FRONTEND_DIR}/src/lib/gtag.ts"),
    ("frontend/src/components/CompanyConversionBar.tsx", f"{REMOTE_FRONTEND_DIR}/src/components/CompanyConversionBar.tsx"),
    ("frontend/src/components/SearchClientContainer.tsx", f"{REMOTE_FRONTEND_DIR}/src/components/SearchClientContainer.tsx"),
    ("frontend/src/components/ExportCSVButton.tsx", f"{REMOTE_FRONTEND_DIR}/src/components/ExportCSVButton.tsx"),
    ("frontend/src/app/[locale]/opt-out/page.tsx", f"{REMOTE_FRONTEND_DIR}/src/app/[locale]/opt-out/page.tsx"),
    ("frontend/src/app/[locale]/company/[id]/page.tsx", f"{REMOTE_FRONTEND_DIR}/src/app/[locale]/company/[id]/page.tsx"),
    ("frontend/src/middleware.ts", f"{REMOTE_FRONTEND_DIR}/src/middleware.ts"),
]

def main():
    print(f"[*] Connecting to {VPS_HOST} via SSH/SFTP...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
    
    sftp = ssh.open_sftp()
    
    for rel_local, remote_path in FILES_TO_SYNC:
        local_path = os.path.join(LOCAL_ROOT, rel_local.replace("/", os.sep))
        print(f"[*] Uploading {rel_local} -> {remote_path}...")
        remote_dir = os.path.dirname(remote_path)
        # Ensure remote dir exists
        try:
            sftp.stat(remote_dir)
        except FileNotFoundError:
            ssh.exec_command(f"mkdir -p {remote_dir}")
        sftp.put(local_path, remote_path)
        print(f"    [+] Uploaded successfully.")
        
    sftp.close()
    
    print("\n[*] Starting Next.js production build on VPS...")
    build_cmd = f"cd {REMOTE_FRONTEND_DIR} && npm run build && pm2 reload kigyou-list"
    stdin, stdout, stderr = ssh.exec_command(build_cmd, get_pty=True)
    
    for line in iter(stdout.readline, ""):
        print(line, end="")
        
    exit_status = stdout.channel.recv_exit_status()
    print(f"\n[*] Process exited with code {exit_status}")
    
    ssh.close()
    if exit_status != 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
