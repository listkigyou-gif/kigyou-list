#!/usr/bin/env python3
import sys
import paramiko

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.251.203.84', port=22, username='root', password='Hrptlcct6789@')

print("[*] Checking /ja/opt-out on VPS localhost:3000...")
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:3000/ja/opt-out | grep -o '自社情報の確認' | head -n 1")
res1 = stdout.read().decode('utf-8', errors='ignore').strip()
print(f"    Result: '{res1}'")

print("[*] Checking /ja/search on VPS localhost:3000...")
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:3000/ja/search | grep -o '無料会員特典' | head -n 1")
res2 = stdout.read().decode('utf-8', errors='ignore').strip()
print(f"    Result: '{res2}'")

print("[*] Checking /ja/company/1010001000179 on VPS localhost:3000...")
stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:3000/ja/company/1010001000179 | grep -o 'B2B営業・アプローチ支援' | head -n 1")
res3 = stdout.read().decode('utf-8', errors='ignore').strip()
print(f"    Result: '{res3}'")

ssh.close()
