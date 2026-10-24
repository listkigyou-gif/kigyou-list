import paramiko
import sys
import time

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
        ("c:\\kigyou-list\\frontend\\src\\lib\\db.ts", "/var/www/kigyou-list/frontend/src/lib/db.ts"),
        ("c:\\kigyou-list\\frontend\\src\\lib\\searchCache.ts", "/var/www/kigyou-list/frontend/src/lib/searchCache.ts"),
        ("c:\\kigyou-list\\frontend\\src\\components\\SearchSidebar.tsx", "/var/www/kigyou-list/frontend/src/components/SearchSidebar.tsx"),
        ("c:\\kigyou-list\\frontend\\src\\components\\SearchClientContainer.tsx", "/var/www/kigyou-list/frontend/src/components/SearchClientContainer.tsx"),
        ("c:\\kigyou-list\\frontend\\src\\app\\[locale]\\search\\page.tsx", "/var/www/kigyou-list/frontend/src/app/[locale]/search/page.tsx")
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
    print(f"\n[DONE] Exit code: {exit_code}")
    ssh.close()

if __name__ == '__main__':
    deploy()
