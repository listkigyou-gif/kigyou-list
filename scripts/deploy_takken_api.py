import paramiko
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"
REMOTE_FILE = "/var/www/kigyou-list/frontend/src/app/api/external/takken-agencies/route.ts"
LOCAL_FILE = "C:/kigyou-list/frontend/src/app/api/external/takken-agencies/route.ts"

def main():
    print(f"Connecting to VPS {VPS_HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)
    print("SSH Connected!")

    sftp = ssh.open_sftp()
    remote_dir = os.path.dirname(REMOTE_FILE)
    ssh.exec_command(f"mkdir -p {remote_dir}")
    print(f"Uploading {LOCAL_FILE} -> {REMOTE_FILE}...")
    sftp.put(LOCAL_FILE, REMOTE_FILE)
    sftp.close()
    print("File uploaded successfully!")

    print("\n--- Building Frontend & Restarting PM2 on VPS ---")
    build_cmd = (
        "cd /var/www/kigyou-list/frontend && "
        "npm run build && "
        "pm2 reload 0 && "
        "curl -s 'http://127.0.0.1:3000/api/external/takken-agencies?prefecture=東京都&limit=2' | head -c 200"
    )
    stdin, stdout, stderr = ssh.exec_command(build_cmd, get_pty=True)
    for line in iter(stdout.readline, ""):
        print(line, end="")

    ssh.close()
    print("\n[SUCCESS] takken-agencies API deployed and verified on kigyoulist.com!")

if __name__ == "__main__":
    main()
