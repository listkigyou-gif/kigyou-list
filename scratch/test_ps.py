import subprocess

def test():
    out = subprocess.check_output('docker ps --filter name=warp- --filter status=running --format "{{.Names}}"', shell=True).decode('utf-8')
    names = out.strip().splitlines()
    print("Running names:")
    for n in names:
        if '40032' in n:
            print(f"  FOUND: {n}")
    print(f"Total returned by docker ps: {len(names)}")

if __name__ == "__main__":
    test()
