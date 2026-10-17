import paramiko
import sys
import os

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

    sftp = ssh.open_sftp()
    
    # 1. Upload auto_indexnow_submitter_pg.js
    local_script = r"c:\kigyou-list\scripts\auto_indexnow_submitter_pg.js"
    remote_script = "/var/www/kigyou-list/scripts/auto_indexnow_submitter_pg.js"
    print(f"Uploading {local_script} -> {remote_script}...")
    sftp.put(local_script, remote_script)

    # 2. Upload verification key 7c742571ab6a4103aa339488f8220031.txt
    local_key = r"c:\kigyou-list\frontend\public\7c742571ab6a4103aa339488f8220031.txt"
    remote_key = "/var/www/kigyou-list/frontend/public/7c742571ab6a4103aa339488f8220031.txt"
    print(f"Uploading {local_key} -> {remote_key}...")
    sftp.put(local_key, remote_key)
    
    sftp.close()

    # 3. Make executable
    ssh.exec_command("chmod +x /var/www/kigyou-list/scripts/auto_indexnow_submitter_pg.js")

    # 4. Run test on VPS: --stats
    print("\n--- Testing node script on VPS (--stats) ---")
    stdin, stdout, stderr = ssh.exec_command("node /var/www/kigyou-list/scripts/auto_indexnow_submitter_pg.js --stats")
    print(stdout.read().decode('utf-8', errors='replace'))
    err = stderr.read().decode('utf-8', errors='replace')
    if err:
        print("STDERR:", err)

    # 5. Run real batch of 1000 on VPS
    print("\n--- Running real submission on VPS (--batch-size 1000) ---")
    stdin, stdout, stderr = ssh.exec_command("node /var/www/kigyou-list/scripts/auto_indexnow_submitter_pg.js --batch-size 1000")
    print(stdout.read().decode('utf-8', errors='replace'))
    err = stderr.read().decode('utf-8', errors='replace')
    if err:
        print("STDERR:", err)

    # 6. Install Cron Job on VPS (Run at 02:00 AM every day)
    print("\n--- Setting up Linux Crontab (02:00 AM daily) ---")
    cron_cmd = (
        "(crontab -l 2>/dev/null | grep -v 'auto_indexnow_submitter_pg.js'; "
        "echo '0 2 * * * /usr/bin/node /var/www/kigyou-list/scripts/auto_indexnow_submitter_pg.js --batch-size 1000 >> /var/log/indexnow.log 2>&1') | crontab -"
    )
    stdin, stdout, stderr = ssh.exec_command(cron_cmd)
    stdout.channel.recv_exit_status()

    # 7. Verify Crontab
    print("\n--- Verifying active Crontab on VPS ---")
    stdin, stdout, stderr = ssh.exec_command("crontab -l")
    print(stdout.read().decode('utf-8', errors='replace'))

    ssh.close()
    print("\n[SUCCESS] VPS deployment and Cron Job setup completed!")

if __name__ == "__main__":
    main()
