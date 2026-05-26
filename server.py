import http.server
import socketserver
import os
import argparse

DEFAULT_PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
PORT_SCAN_LIMIT = 20

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and Disable caching for easier live testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

class ReusableTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


def parse_args():
    parser = argparse.ArgumentParser(description="Serve the EvoPlanet app locally.")
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("PORT", DEFAULT_PORT)),
        help=f"Preferred port to bind. Defaults to PORT or {DEFAULT_PORT}.",
    )
    return parser.parse_args()


def create_server(preferred_port):
    last_error = None

    for port in range(preferred_port, preferred_port + PORT_SCAN_LIMIT + 1):
        try:
            return port, ReusableTCPServer(("0.0.0.0", port), Handler)
        except OSError as err:
            last_error = err
            if err.errno != 98:
                raise

    raise OSError(
        f"No available port found in range {preferred_port}-{preferred_port + PORT_SCAN_LIMIT}"
    ) from last_error


if __name__ == "__main__":
    args = parse_args()
    PORT, httpd = create_server(args.port)

    print(f"\n==================================================")
    print(f" EvoPlanet Test Server Active")
    print(f" Serving Directory: {DIRECTORY}")
    if PORT != args.port:
        print(f" Preferred port {args.port} was busy; using {PORT}.")
    print(f"--------------------------------------------------")
    print(f" Access from your browser at:")
    print(f"    http://localhost:{PORT}")
    print(f"==================================================\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
