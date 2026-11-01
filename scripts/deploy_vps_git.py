import paramiko
import sys
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"

def run_ssh_command(ssh, cmd):
    print(f"\n[EXEC] {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    for line in iter(stdout.readline, ""):
        # replace problematic characters if any
        clean_line = line.encode('ascii', errors='replace').decode('ascii')
        print(clean_line, end="")
    status = stdout.channel.recv_exit_status()
    print(f"[STATUS] Exit code: {status}")
    return status

def main():
    print("[*] Connecting to VPS...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)
    print("[+] Connected successfully.")

    # 1. Git pull
    status = run_ssh_command(ssh, "cd /var/www/kigyou-list && git fetch origin && git reset --hard origin/main")
    if status != 0:
        print("[!] Git pull failed.")
        return

    # 2. Next.js build
    print("[*] Building Next.js frontend...")
    status = run_ssh_command(ssh, "cd /var/www/kigyou-list/frontend && npm run build")
    if status != 0:
        print("[!] Next.js build failed.")
        return

    # 3. Reload PM2
    print("[*] Reloading PM2...")
    run_ssh_command(ssh, "pm2 reload kigyou-list")

    # 4. Check status
    run_ssh_command(ssh, "pm2 list")

    ssh.close()
    print("[+] VPS Deployment completed successfully!")

if __name__ == "__main__":
    main()
