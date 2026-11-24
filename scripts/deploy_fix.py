import paramiko
import os
import sys
import json
import urllib.request
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv('frontend/.env.local')
load_dotenv('.env.local')
load_dotenv()

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"
REMOTE_BASE = "/var/www/kigyou-list"

FILES_TO_SYNC = [
    "frontend/src/components/CompanyActions.tsx",
    "frontend/src/components/SearchClientContainer.tsx",
]

def main():
    print(f"Connecting to VPS {VPS_HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
    sftp = ssh.open_sftp()

    local_base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print("\n--- Synchronizing Modified Files via SFTP ---")
    for rel_path in FILES_TO_SYNC:
        local_path = os.path.join(local_base, rel_path.replace("/", os.sep))
        remote_path = f"{REMOTE_BASE}/{rel_path}"
        print(f"Uploading {local_path} -> {remote_path}...")
        sftp.put(local_path, remote_path)
    sftp.close()
    print("Files uploaded successfully!")

    print("\n--- Building Frontend & Reloading PM2 Service on Production VPS ---")
    build_cmd = (
        "cd /var/www/kigyou-list/frontend && "
        "npm run build && "
        "pm2 reload 0 && "
        "rm -rf /var/cache/nginx/kigyou/* && "
        "systemctl restart nginx"
    )
    stdin, stdout, stderr = ssh.exec_command(build_cmd, get_pty=True)
    for line in iter(stdout.readline, ""):
        print(line, end="")
    exit_code = stdout.channel.recv_exit_status()
    if exit_code != 0:
        ssh.close()
        raise RuntimeError(f"Production build/reload failed with exit code {exit_code}")

    print("\n--- Production Build & PM2 Reload Complete ---")
    ssh.close()

    print("\n--- Purging Cloudflare Edge Cache ---")
    email = os.getenv("CLOUDFLARE_EMAIL", "trungkim8694@gmail.com")
    key = os.getenv("CLOUDFLARE_API_KEY", "")
    zone_id = os.getenv("CLOUDFLARE_ZONE_ID", "881d2cbd9004c4216cb9f8d28c99b0b9")
    if key:
        url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache"
        headers = {
            "X-Auth-Email": email,
            "X-Auth-Key": key,
            "Content-Type": "application/json"
        }
        data = json.dumps({"purge_everything": True}).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                print("Cloudflare Purge response:", resp.read().decode("utf-8"))
        except Exception as e:
            print("Cloudflare purge error:", e)
    else:
        print("Warning: CLOUDFLARE_API_KEY not found in env")

    print("\n[SUCCESS] Deployment complete!")

if __name__ == "__main__":
    main()
