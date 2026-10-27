import paramiko
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.251.203.84', username='root', password='')

commands = [
    ("Audit PM2 Service", "pm2 status kigyoulist-api-daemon"),
    ("Audit Crontab", "crontab -l | grep -E 'indexnow|google'"),
    ("Audit PM2 Logs (Last 20 lines)", "pm2 logs kigyoulist-api-daemon --lines 20 --nostream"),
    ("Audit PostgreSQL VIP Tables", "sudo -u postgres psql -d kigyou_list -c \"SELECT 'google_indexing_submissions' as tbl, count(*) FROM google_indexing_submissions UNION ALL SELECT 'indexnow_submissions', count(*) FROM indexnow_submissions UNION ALL SELECT 'google_vip_queue', count(*) FROM google_vip_queue UNION ALL SELECT 'companies_delta_48h', count(*) FROM companies WHERE updated_at >= NOW() - INTERVAL '48 hours';\""),
    ("Audit Sitemap Delta File", "ls -la /var/www/kigyou-list/frontend/public/sitemap_recent_updates.xml 2>/dev/null || echo 'Sitemap delta not created yet (will create on next cycle)'")
]

print("=" * 80)
print("AUDIT & TESTING REPORT: KIGYOU-LIST CLOUD VPS INDEXING ARCHITECTURE")
print("=" * 80)

for title, cmd in commands:
    print(f"\n[+] {title}:")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8').strip()
    err = stderr.read().decode('utf-8').strip()
    if out:
        print(out)
    if err and "TAILING" not in err:
        print(f"[-] Stderr: {err}")

ssh.close()
