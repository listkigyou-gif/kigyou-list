import paramiko
import sys
import time
import urllib.request
import ssl

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"

def deploy():
    print(f"Connecting to VPS {VPS_HOST} via SSH/SFTP...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)

    sftp = ssh.open_sftp()
    files_to_upload = [
        ("c:\\kigyou-list\\frontend\\src\\app\\[locale]\\dashboard\\page.tsx", "/var/www/kigyou-list/frontend/src/app/[locale]/dashboard/page.tsx"),
        ("c:\\kigyou-list\\frontend\\src\\components\\dashboard\\WatchlistTab.tsx", "/var/www/kigyou-list/frontend/src/components/dashboard/WatchlistTab.tsx"),
        ("c:\\kigyou-list\\frontend\\src\\locales\\vi.ts", "/var/www/kigyou-list/frontend/src/locales/vi.ts")
    ]
    for local_path, remote_path in files_to_upload:
        print(f"Uploading {local_path} -> {remote_path}...")
        sftp.put(local_path, remote_path)
    sftp.close()
    print("All files uploaded successfully!")

    # Build and reload PM2
    cmds = (
        "cd /var/www/kigyou-list/frontend && "
        "npm run build && "
        "pm2 reload kigyou-list || pm2 restart kigyou-list"
    )
    print("\nExecuting build and PM2 reload on VPS...")
    stdin, stdout, stderr = ssh.exec_command(cmds, get_pty=True)
    while not stdout.channel.exit_status_ready() or stdout.channel.recv_ready():
        if stdout.channel.recv_ready():
            sys.stdout.write(stdout.channel.recv(1024).decode('utf-8', errors='replace'))
            sys.stdout.flush()
        else:
            time.sleep(0.5)

    exit_code = stdout.channel.recv_exit_status()
    print(f"\n[DONE] Build & PM2 reload exit code: {exit_code}")
    ssh.close()

    # Verify live production endpoint
    print("\nVerifying live production URL: https://kigyoulist.com/ja/dashboard ...")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        req = urllib.request.Request(
            "https://kigyoulist.com/ja/dashboard",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
            print(f"[STATUS] Live URL returned HTTP {res.status}")
    except Exception as e:
        print(f"[STATUS] Live check response: {e}")

if __name__ == '__main__':
    deploy()
