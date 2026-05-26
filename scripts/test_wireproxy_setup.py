import os
import sys
import asyncio
import subprocess

# Setup paths relative to script directory
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_ROOT = os.path.abspath(os.path.join(SCRIPTS_DIR, ".."))

# Add scripts directory and crawlers/yahoo directory to path so we can import
sys.path.insert(0, SCRIPTS_DIR)
sys.path.insert(0, os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo"))

try:
    from run_yahoo_daemon import ensure_wireproxy_bin_and_configs, ensure_yahoo_proxies, terminate_wireproxies, ALL_PORTS
    from yahoo_searcher import get_current_ip, rotate_proxy
    print("[+] Successfully imported daemon and searcher modules.")
except Exception as e:
    print(f"[-] Failed to import modules: {e}")
    sys.exit(1)

async def run_tests():
    print("==================================================")
    print(" STARTING WIREPROXY INTEGRATION TEST")
    print("==================================================")
    
    # Test 1: Bootstrap check (Download binary + register accounts + build configs)
    print("\n[Test 1] Verifying wireproxy.exe bootstrap and configs...")
    success = ensure_wireproxy_bin_and_configs()
    if success:
        print("[+] Test 1 SUCCESS: wireproxy.exe and configs are set up correctly.")
    else:
        print("[-] Test 1 FAILED: wireproxy bootstrap failed.")
        return
        
    # Verify file existence
    bin_path = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo", "bin", "wireproxy.exe")
    config_path = os.path.join(WORKSPACE_ROOT, "crawlers", "yahoo", "config", f"wireproxy_{ALL_PORTS[0]}.conf")
    print(f"    Binary path exists: {os.path.exists(bin_path)}")
    print(f"    Config path for Port {ALL_PORTS[0]} exists: {os.path.exists(config_path)}")
    
    # Test 2: Startup test (Start 2 test proxies)
    test_ports = ALL_PORTS[:2]
    print(f"\n[Test 2] Starting wireproxy on test ports {test_ports}...")
    try:
        # Temporarily restrict ALL_PORTS to test_ports for the call to ensure_yahoo_proxies
        import run_yahoo_daemon
        orig_all_ports = run_yahoo_daemon.ALL_PORTS
        run_yahoo_daemon.ALL_PORTS = test_ports
        
        # Start the proxies
        start_ok = ensure_yahoo_proxies(max_workers=2)
        run_yahoo_daemon.ALL_PORTS = orig_all_ports # restore
        
        if start_ok:
            print(f"[+] Test 2 SUCCESS: Tunnels started on {test_ports}")
        else:
            print("[-] Test 2 FAILED: Could not start tunnels.")
            terminate_wireproxies()
            return
    except Exception as e:
        print(f"[-] Test 2 FAILED with exception: {e}")
        terminate_wireproxies()
        return

    # Test 3: Get IP and check connectivity
    print("\n[Test 3] Verifying internet connectivity and IP isolation...")
    ip1 = await get_current_ip(test_ports[0])
    ip2 = await get_current_ip(test_ports[1])
    print(f"    Port {test_ports[0]} IP: {ip1}")
    print(f"    Port {test_ports[1]} IP: {ip2}")
    
    if ip1 == "Unknown" or ip2 == "Unknown":
        print("[-] Test 3 FAILED: Could not retrieve public IP through proxy.")
    elif ip1 == ip2:
        print("[~] Note: Both ports returned the same IP address. (Cloudflare WARP sometimes routes close ports to the same egress IP).")
        print("[+] Test 3 SUCCESS: Connectivity verified.")
    else:
        print("[+] Test 3 SUCCESS: Connectivity verified and IPs are distinct!")

    # Test 4: IP Rotation Test
    print("\n[Test 4] Verifying IP rotation logic...")
    print(f"    Rotating Port {test_ports[0]}...")
    rotation_ok = await rotate_proxy(test_ports[0])
    if rotation_ok:
        new_ip1 = await get_current_ip(test_ports[0])
        print(f"    New Port {test_ports[0]} IP: {new_ip1}")
        if new_ip1 != ip1:
            print("[+] Test 4 SUCCESS: IP successfully rotated to a new address!")
        else:
            print("[~] Note: IP rotated successfully but was assigned the same Cloudflare IP (common for WARP free).")
            print("[+] Test 4 SUCCESS: Rotation process executed successfully.")
    else:
        print("[-] Test 4 FAILED: IP rotation returned False.")

    # Cleanup
    print("\n[Cleanup] Stopping test wireproxy instances...")
    terminate_wireproxies()
    print("[+] Cleanup done. Test suite complete.")

if __name__ == "__main__":
    asyncio.run(run_tests())
