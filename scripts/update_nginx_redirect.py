#!/usr/bin/env python3
import paramiko
import sys

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"

NGINX_DEFAULT_CONF = """# 1. Permanent 301 Redirect www -> non-www
server {
    listen 80;
    listen 443 ssl;
    server_name www.kigyoulist.com;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    return 301 https://kigyoulist.com$request_uri;
}

# 2. Main Production App
server {
    listen 80;
    listen 443 ssl;
    server_name kigyoulist.com;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
"""

def main():
    print("Connecting to VPS to update Nginx configuration...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)

    # 1. Backup existing config
    client.exec_command("cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak_seo")

    # 2. Write new config
    sftp = client.open_sftp()
    with sftp.file("/etc/nginx/sites-available/default", "w") as f:
        f.write(NGINX_DEFAULT_CONF)
    sftp.close()

    # 3. Test config
    _, stdout, stderr = client.exec_command("nginx -t")
    res = stdout.read().decode() + stderr.read().decode()
    print("Nginx Test Output:\n" + res)

    if "successful" in res:
        _, stdout_r, _ = client.exec_command("systemctl reload nginx")
        print("✅ Nginx reloaded successfully with 301 Permanent Redirect for www.kigyoulist.com -> https://kigyoulist.com!")
    else:
        print("❌ Nginx test failed! Restoring backup...")
        client.exec_command("cp /etc/nginx/sites-available/default.bak_seo /etc/nginx/sites-available/default && systemctl reload nginx")
        sys.exit(1)

    client.close()

if __name__ == "__main__":
    main()
