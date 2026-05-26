with open("scripts/run_enrichment_loop.py", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()
with open("scratch/temp_view.txt", "w", encoding="utf-8") as f_out:
    for idx, line in enumerate(lines[900:1060]):
        if idx+901 <= len(lines):
            f_out.write(f"{idx+901}: {line}\n")

print("File decoded with UTF-8 successfully! Lines written to temp_view.txt")
