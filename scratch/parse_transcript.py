import json
import os
import sys

# Force sys.stdout to write in utf-8
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def parse():
    log_path = r"C:\Users\admin\.gemini\antigravity-ide\brain\0b836ecf-636d-464f-a6e6-8c56d3ab1238\.system_generated\logs\transcript.jsonl"
    if not os.path.exists(log_path):
        print("Transcript file not found at", log_path)
        return
        
    with open(log_path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            try:
                data = json.loads(line)
                source = data.get("source")
                step_type = data.get("type")
                if step_type == "USER_INPUT" or source == "USER_EXPLICIT":
                    print(f"Line {i}, Step {data.get('step_index')}, Source {source}, Type {step_type}:")
                    content = data.get("content")
                    if content:
                        print(content.strip()[:300])
                    print("-" * 60)
            except Exception as e:
                print(f"Error parsing line {i}: {e}")

if __name__ == "__main__":
    parse()
