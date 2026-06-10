import subprocess
import time
import sys

def main():
    print("Launching Docker Desktop as a detached process escaping job object...")
    try:
        # DETACHED_PROCESS = 0x00000008
        # CREATE_BREAKAWAY_FROM_JOB = 0x01000000
        flags = 0x00000008 | 0x01000000
        subprocess.Popen(
            ["C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"],
            creationflags=flags
        )
        print("Spawned process successfully.")
    except Exception as e:
        print(f"Failed to launch: {e}")
        return False

    # Wait and check if docker ps works (up to 90 seconds)
    print("Waiting for Docker to initialize...")
    for i in range(1, 31):
        time.sleep(3)
        try:
            subprocess.run(["docker", "ps"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print("Docker is ready and running in the background!")
            return True
        except Exception:
            print(f"Waiting for Docker... ({i * 3}s / 90s)")

    print("Docker did not become ready in 90 seconds.")
    return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
