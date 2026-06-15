import os

def main():
    concurrency = 50
    base_port = 41000
    
    yaml_lines = [
        "version: '3.8'",
        "",
        "services:"
    ]
    
    for i in range(1, concurrency + 1):
        port = base_port + (i - 1)
        name = f"warp-website-{i}"
        yaml_lines.extend([
            f"  {name}:",
            f"    image: caomingjun/warp",
            f"    container_name: {name}",
            f"    ports:",
            f"      - \"{port}:1080\"",
            f"    environment:",
            f"      - WARP_SLEEP=2",
            f"    privileged: true",
            f"    restart: always",
            ""
        ])
        
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "docker-compose.yml")
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(yaml_lines))
    print(f"Successfully generated {output_path} with {concurrency} containers.")

if __name__ == "__main__":
    main()
