import re

log_path = "yahoo_daemon.log"
ports_state = {}

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        # Check for spawning
        m_spawn = re.search(r"Spawned worker for port (\d+)|Dynamically spawned Yahoo worker on port (\d+)|Successfully respawned Yahoo worker on port (\d+)", line)
        if m_spawn:
            port = int(next(g for g in m_spawn.groups() if g is not None))
            ports_state[port] = "RUNNING"
            
        # Check for exits
        m_exit = re.search(r"worker on port (\d+) exited|Port (\d+) exited", line)
        if m_exit:
            port = int(next(g for g in m_exit.groups() if g is not None))
            ports_state[port] = "EXITED"
            
        # Check for clean finish
        m_finish = re.search(r"Yahoo worker on port (\d+) finished cleanly", line)
        if m_finish:
            port = int(m_finish.group(1))
            ports_state[port] = "FINISHED"

print("Port States according to logs:")
running_count = 0
for port in sorted(ports_state.keys()):
    state = ports_state[port]
    print(f"Port {port}: {state}")
    if state == "RUNNING":
        running_count += 1

print(f"Total Running according to logs: {running_count}")
