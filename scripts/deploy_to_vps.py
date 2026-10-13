import paramiko
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"

def run_ssh_command(ssh, cmd, stream_output=True, timeout=900):
    print(f"\n========================================================")
    print(f"[EXEC] {cmd}")
    print(f"========================================================")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    
    output = []
    while not stdout.channel.exit_status_ready() or stdout.channel.recv_ready():
        if stdout.channel.recv_ready():
            chunk = stdout.channel.recv(1024).decode('utf-8', errors='replace')
            if stream_output:
                sys.stdout.write(chunk)
                sys.stdout.flush()
            output.append(chunk)
        else:
            time.sleep(0.5)
            
    exit_code = stdout.channel.recv_exit_status()
    leftover = stdout.read().decode('utf-8', errors='replace')
    if leftover:
        if stream_output:
            sys.stdout.write(leftover)
            sys.stdout.flush()
        output.append(leftover)
        
    print(f"\n[DONE] Exit code: {exit_code}")
    return exit_code, "".join(output)

def main():
    print(f"Connecting to Production VPS {VPS_HOST}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("Connected successfully!")
    except Exception as e:
        print(f"Failed to connect: {e}")
        sys.exit(1)

    try:
        # Step 0: Check existing PM2 and git status
        print("\n--- STEP 0: Check System & PM2 ---")
        run_ssh_command(client, "pm2 list")

        # Step 1: Git pull
        print("\n--- STEP 1: Git Pull Latest Code on VPS ---")
        git_cmd = (
            "cd /var/www/kigyou-list && "
            "git status && "
            "git pull origin main"
        )
        exit_code, _ = run_ssh_command(client, git_cmd)
        if exit_code != 0:
            print("[WARN] Trying git stash / reset if needed...")
            run_ssh_command(client, "cd /var/www/kigyou-list && git stash && git pull origin main")

        # Step 2: Build Next.js
        print("\n--- STEP 2: Install dependencies & Build Next.js ---")
        build_cmd = (
            "cd /var/www/kigyou-list/frontend && "
            "npm install && "
            "npm run build"
        )
        exit_code, _ = run_ssh_command(client, build_cmd)
        if exit_code != 0:
            print("[ERROR] Build failed on production VPS!")
            sys.exit(1)

        # Step 3: Restart PM2
        print("\n--- STEP 3: Restart PM2 Application ---")
        restart_cmd = "pm2 reload kigyou-list || pm2 restart kigyou-list || pm2 restart all"
        run_ssh_command(client, restart_cmd)

        # Step 4: PM2 status
        print("\n--- STEP 4: Verify PM2 Status ---")
        run_ssh_command(client, "pm2 status")

        # Step 5: Verify Production Endpoints
        print("\n--- STEP 5: Verify Live Endpoints ---")
        verify_cmd = (
            "curl -s -o /dev/null -w 'Localhost 3000 -> HTTP Code: %{http_code}\\n' http://127.0.0.1:3000/ja && "
            "curl -s -o /dev/null -w 'Localhost Developer -> HTTP Code: %{http_code}\\n' http://127.0.0.1:3000/ja/developer && "
            "curl -s -o /dev/null -w 'Public https://kigyoulist.com/ja -> HTTP Code: %{http_code}\\n' https://kigyoulist.com/ja && "
            "curl -s -o /dev/null -w 'Public Developer -> HTTP Code: %{http_code}\\n' https://kigyoulist.com/ja/developer"
        )
        run_ssh_command(client, verify_cmd)

        print("\n========================================================")
        print("[SUCCESS] Production deployment completed successfully!")
        print("========================================================")

    finally:
        client.close()

if __name__ == "__main__":
    main()
