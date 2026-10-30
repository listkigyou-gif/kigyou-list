#!/usr/bin/env python3
"""
Update Nginx on VPS with X-Purge-Cache header support
"""
import paramiko
import sys

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"

NGINX_CONF = """# 1. High Performance Proxy Cache Definition
proxy_cache_path /var/cache/nginx/kigyou levels=1:2 keys_zone=KIGYOU_CACHE:64m max_size=10g inactive=48h use_temp_path=off;

# 2. Permanent 301 Redirect www -> non-www
server {
    listen 80;
    listen 443 ssl;
    server_name www.kigyoulist.com;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    return 301 https://kigyoulist.com$request_uri;
}

# 3. Main Production App with Smart Edge Caching
server {
    listen 80;
    listen 443 ssl;
    server_name kigyoulist.com;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Dynamic Cache Bypass Conditions (Dashboard, Admin, Auth, API mutations, Secret Purge Header)
    set $skip_cache 0;
    if ($request_method !~ ^(GET|HEAD)$) {
        set $skip_cache 1;
    }
    if ($request_uri ~* "/(api|dashboard|admin|login|_next/webpack-hmr)") {
        set $skip_cache 1;
    }
    if ($http_x_purge_cache = "kigyou_cache_bypass_secret_2026") {
        set $skip_cache 1;
    }

    # Static assets cache directly
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache KIGYOU_CACHE;
        proxy_cache_valid 200 365d;
        proxy_ignore_headers Cache-Control;
        add_header X-Cache-Status $upstream_cache_status;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # 301 Canonical Redirects for Hub Roots (Zero 404s for Bots)
    location = /ja/changes { return 301 https://$host/ja/changes/relocation; }
    location = /ja/jobs { return 301 https://$host/ja/jobs/latest; }
    location = /ja/status { return 301 https://$host/ja/status/bankruptcies; }

    # Public Directory & Company Profiles: Blazing Fast Cache for Bots & Users
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        # Caching directives
        proxy_cache KIGYOU_CACHE;
        proxy_cache_bypass $skip_cache $http_upgrade;
        proxy_no_cache $skip_cache;
        proxy_cache_valid 200 301 302 24h;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;

        add_header X-Cache-Status $upstream_cache_status;
        add_header X-Powered-By "Kigyoulist-EdgeEngine";
    }
}
"""

def main():
    print("Connecting to VPS to update Nginx configuration with Purge support...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)

    # 1. Backup existing config
    client.exec_command("cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak_purge")

    # 2. Write new config
    sftp = client.open_sftp()
    with sftp.file("/etc/nginx/sites-available/default", "w") as f:
        f.write(NGINX_CONF)
    sftp.close()

    # 3. Test config
    _, stdout, stderr = client.exec_command("nginx -t")
    res = stdout.read().decode() + stderr.read().decode()
    print("Nginx Test Output:\n" + res)

    if "successful" in res:
        _, stdout_r, _ = client.exec_command("systemctl reload nginx")
        print("✅ Nginx reloaded successfully with X-Purge-Cache support!")
    else:
        print("❌ Nginx test failed! Restoring backup...")
        client.exec_command("cp /etc/nginx/sites-available/default.bak_purge /etc/nginx/sites-available/default && systemctl reload nginx")
        sys.exit(1)

    client.close()

if __name__ == "__main__":
    main()
