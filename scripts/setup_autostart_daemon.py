import os
import sys
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ROOT = r"c:\kigyou-list"
VBS_PATH = os.path.join(PROJECT_ROOT, "scripts", "start_daemon_silent.vbs")
BAT_PATH = os.path.join(PROJECT_ROOT, "scripts", "run_orchestrator_daemon.bat")
PYTHON_EXE = sys.executable

# 1. Create .bat launcher
bat_content = f"""@echo off
cd /d "{PROJECT_ROOT}"
"{PYTHON_EXE}" master_orchestrator.py --daemon --interval 30
"""
with open(BAT_PATH, "w", encoding="utf-8") as f:
    f.write(bat_content)
print(f"✅ Created: {BAT_PATH}")

# 2. Create silent .vbs launcher (Zero window popup)
vbs_content = f'''Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "{BAT_PATH}", 0, False
'''
with open(VBS_PATH, "w", encoding="utf-8") as f:
    f.write(vbs_content)
print(f"✅ Created: {VBS_PATH}")

# 3. Create Windows Scheduled Task on System Logon
task_name = "KigyouList_MasterOrchestrator_Daemon"
# Use schtasks to create a background task that triggers on user logon
cmd = [
    "schtasks", "/Create",
    "/TN", task_name,
    "/TR", f'wscript.exe "{VBS_PATH}"',
    "/SC", "ONLOGON",
    "/F",
    "/RL", "HIGHEST"
]

print(f"\n[*] Registering Windows Scheduled Task: '{task_name}'...")
res = subprocess.run(cmd, capture_output=True, text=True, errors='ignore')
print(res.stdout)
if res.returncode == 0:
    print(f"🎉 SUCCESS: Scheduled Task '{task_name}' is registered!")
    print("   -> Whenever the PC powers on or reboots, the Master Orchestrator daemon will automatically run in the background 24/7 without user intervention!")
else:
    print(f"[-] Note: {res.stderr}")
    # Fallback to Startup folder
    appdata = os.environ.get("APPDATA", "")
    startup_folder = os.path.join(appdata, "Microsoft", "Windows", "Start Menu", "Programs", "Startup")
    if os.path.exists(startup_folder):
        shortcut_vbs = os.path.join(startup_folder, "kigyoulist_orchestrator.vbs")
        with open(shortcut_vbs, "w", encoding="utf-8") as f:
            f.write(vbs_content)
        print(f"✅ Fallback to Windows Startup folder: {shortcut_vbs}")
