"""Serve the charades game to everyone on the LAN / tailnet.

Run:  python serve.py [port]
"""
import functools
import http.server
import socket
import subprocess
import sys
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = Path(__file__).resolve().parent


def addresses():
    ips = set()
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ips.add(info[4][0])
    except OSError:
        pass
    try:
        out = subprocess.run(["tailscale", "ip", "-4"], capture_output=True, text=True, timeout=3)
        ips.update(line.strip() for line in out.stdout.splitlines() if line.strip())
    except (OSError, subprocess.SubprocessError):
        pass
    ips.discard("127.0.0.1")
    return sorted(ips)


handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), handler)

print("Holiday Charades is running. Open on a phone:")
for ip in addresses():
    tag = "  (tailscale)" if ip.startswith("100.") else ""
    print(f"  http://{ip}:{PORT}{tag}")
print("Ctrl+C to stop.")
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
