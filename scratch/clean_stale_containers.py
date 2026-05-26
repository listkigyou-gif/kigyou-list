import subprocess

def clean_stale():
    print("=== CLEANING STALE WARP CONTAINERS ===")
    try:
        out = subprocess.run(["docker", "ps", "-a", "--format", "{{.ID}} {{.Names}}"], capture_output=True, text=True, encoding="utf-8")
        if out.returncode != 0:
            print("Failed to run docker ps:", out.stderr)
            return
            
        for line in out.stdout.strip().splitlines():
            if not line.strip():
                continue
            parts = line.split(" ", 1)
            if len(parts) < 2:
                continue
            cid, name = parts[0], parts[1]
            if "_" in name and "warp" in name:
                print(f"Removing stale container {name} (ID: {cid})...")
                res = subprocess.run(["docker", "rm", "-f", cid], capture_output=True, text=True)
                if res.returncode == 0:
                    print(f"Successfully removed {name}.")
                else:
                    print(f"Failed to remove {name}: {res.stderr or ''}")
    except Exception as e:
        print("Error cleaning stale containers:", e)

if __name__ == "__main__":
    clean_stale()
