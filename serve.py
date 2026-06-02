"""Tiny static dev server for the Carrot Corner Trainer.

Serves this folder with caching disabled, so edits always show on reload
(plain `python -m http.server` lets browsers cache JS/CSS, which hides changes).

Usage: python serve.py [port]   (default 47830)
"""
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 47830
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer(("", PORT), NoCacheHandler) as httpd:
        print(f"Carrot Corner Trainer on http://localhost:{PORT}  (no-cache, threaded)")
        httpd.serve_forever()
