import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.251.203.84', port=22, username='root', password='Hrptlcct6789@', timeout=30)
stdin, stdout, stderr = ssh.exec_command("which pip3 || which pip")
print("pip path:", stdout.read().decode().strip())

stdin, stdout, stderr = ssh.exec_command("pip3 install psycopg2-binary --break-system-packages")
print("pip install out:", stdout.read().decode().strip())
print("pip install err:", stderr.read().decode().strip())

ssh.close()
