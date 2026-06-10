import subprocess

def test():
    out = subprocess.check_output("docker ps --filter name=warp- --filter status=running --format \"{{.Names}}\"", shell=True).decode('utf-8')
    names = sorted(out.strip().splitlines())
    print("Running warp container names:")
    for name in names:
        print(f"  {name}")
    print(f"Total running warp containers: {len(names)}")

if __name__ == "__main__":
    test()
