import subprocess
import time
import sys

def main():
    try:
        # Check if Docker is already running
        subprocess.run(["docker", "ps"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("Docker is already running!")
        return True
    except Exception:
        pass

    print("Starting Docker Desktop...")
    try:
        subprocess.Popen(["C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"])
    except Exception as e:
        print(f"Failed to launch Docker Desktop: {e}")
        return False

    # Wait for docker ps to succeed (up to 90 seconds)
    for i in range(1, 31):
        time.sleep(3)
        try:
            subprocess.run(["docker", "ps"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print("Docker is ready!")
            return True
        except Exception:
            print(f"Waiting for Docker... ({i * 3}s / 90s)")

    print("Docker failed to start in 90 seconds.")
    return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
