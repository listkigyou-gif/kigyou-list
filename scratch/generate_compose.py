import os

def generate():
    content = []
    content.append("version: '3.8'\n")
    content.append("services:")
    
    # Generate 47 warp services
    for i in range(1, 48):
        port = 40000 + i
        content.append(f"""  warp-{i}:
    image: caomingjun/warp
    container_name: warp-proxy-{i}
    restart: always
    ports:
      - "{port}:1080"
    cap_add:
      - NET_ADMIN
    devices:
      - /dev/net/tun
    environment:
      - WARP_SLEEP=2
""")
        
    # Also keep the warp-harvester service on port 40008, but since warp-8 is already on 40008, 
    # we can just map warp-8 as the harvester or keep it.
    # In Japan, prefecture 8 is Ibaraki. So warp-8 is on port 40008, which is the same port as warp-harvester was!
    # That's perfectly fine. We don't need a separate warp-harvester container if we run everything by prefecture, 
    # but to be safe, let's also keep warp-harvester as a service or just let warp-8 handle it.
    # Let's keep a dedicated warp-harvester on port 40048 just in case they want a separate one.
    content.append("""  warp-harvester:
    image: caomingjun/warp
    container_name: warp-harvester
    restart: always
    ports:
      - "40048:1080"
    cap_add:
      - NET_ADMIN
    devices:
      - /dev/net/tun
    environment:
      - WARP_SLEEP=2
""")
    
    target_path = os.path.join("crawlers", "hellowork", "docker-compose.yml")
    with open(target_path, "w", encoding="utf-8") as f:
        f.write("\n".join(content))
    print(f"Generated {target_path} successfully!")

if __name__ == "__main__":
    generate()
