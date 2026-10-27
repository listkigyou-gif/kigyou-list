#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import os
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"

def run_command(cmd):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    client.close()
    return out, err

def upload_file(local_path, remote_path):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=30)
    sftp = client.open_sftp()
    sftp.put(local_path, remote_path)
    sftp.close()
    client.close()
    print(f"[+] Uploaded {local_path} -> {remote_path}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1] if len(sys.argv) == 2 else " ".join(sys.argv[1:])
        out, err = run_command(cmd)
        if out:
            print(out)
        if err:
            print("STDERR:", err)
