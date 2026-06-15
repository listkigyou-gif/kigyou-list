#!/usr/bin/env python
# -*- coding: utf-8 -*-

import subprocess
import time
import sys
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("proxy_monitor.log", mode="a", encoding="utf-8")
    ]
)
logger = logging.getLogger("proxy_monitor")

def get_unhealthy_containers():
    try:
        result = subprocess.run(
            ["docker", "ps", "--filter", "health=unhealthy", "--format", "{{.Names}}"],
            capture_output=True,
            text=True,
            check=True,
            timeout=15,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        return [name.strip() for name in result.stdout.splitlines() if name.strip()]
    except Exception as e:
        logger.error(f"Error querying unhealthy containers: {e}")
        return []

def restart_container(name):
    logger.warning(f"[!] Container '{name}' is UNHEALTHY. Restarting...")
    try:
        subprocess.run(
            ["docker", "restart", name],
            check=True,
            capture_output=True,
            timeout=30,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        logger.info(f"[+] Successfully restarted '{name}'")
    except Exception as e:
        logger.error(f"[-] Failed to restart '{name}': {e}")

def main():
    logger.info("================================================================================")
    logger.info("   DOCKER CONTAINER HEALTH MONITOR DAEMON STARTED")
    logger.info("================================================================================")
    
    while True:
        unhealthy = get_unhealthy_containers()
        if unhealthy:
            logger.warning(f"Found {len(unhealthy)} unhealthy container(s): {unhealthy}")
            for container in unhealthy:
                restart_container(container)
        time.sleep(30)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Monitor daemon stopped by user.")
    except Exception as e:
        logger.error(f"Monitor daemon crashed: {e}")
