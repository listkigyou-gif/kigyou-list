import paramiko
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"

def main():
    print(f"Connecting to VPS {VPS_HOST} via SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)
    print("SSH Connected successfully!")

    # 1. Update Crontab to 50000 batch size
    cron_cmd = (
        "(crontab -l 2>/dev/null | grep -v 'auto_indexnow_submitter_pg.js'; "
        "echo '0 2 * * * /usr/bin/node /var/www/kigyou-list/scripts/auto_indexnow_submitter_pg.js --batch-size 50000 >> /var/log/indexnow.log 2>&1') | crontab -"
    )
    stdin, stdout, stderr = ssh.exec_command(cron_cmd)
    stdout.channel.recv_exit_status()

    # 2. Verify active Crontab on VPS
    print("\n--- Current Active Crontab on VPS ---")
    stdin, stdout, stderr = ssh.exec_command("crontab -l")
    print(stdout.read().decode('utf-8', errors='replace'))

    ssh.close()
    print("[SUCCESS] VPS Crontab updated to 50,000 URLs/day!")

if __name__ == "__main__":
    main()
