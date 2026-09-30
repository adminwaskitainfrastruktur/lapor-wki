"""SMTP penampung untuk uji lokal: menyimpan setiap email yang diterima ke folder tujuan sebagai .eml.
Pakai: python scripts/smtp_sink.py 2525 ./tmp-mail
"""
import os
import socketserver
import sys
import time

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 2525
OUT = sys.argv[2] if len(sys.argv) > 2 else "tmp-mail"
os.makedirs(OUT, exist_ok=True)


class H(socketserver.StreamRequestHandler):
    def send(self, s):
        self.wfile.write((s + "\r\n").encode())

    def handle(self):
        self.send("220 sink ready")
        rcpts, sender, data_mode, buf = [], "", False, []
        while True:
            line = self.rfile.readline()
            if not line:
                return
            text = line.decode("utf-8", "replace").rstrip("\r\n")
            if data_mode:
                if text == ".":
                    name = os.path.join(OUT, "%d-%d.eml" % (int(time.time() * 1000), len(os.listdir(OUT))))
                    with open(name, "w", encoding="utf-8", newline="") as f:
                        f.write("X-Envelope-From: %s\nX-Envelope-To: %s\n" % (sender, ",".join(rcpts)))
                        f.write("\n".join(buf))
                    data_mode, buf = False, []
                    self.send("250 queued")
                else:
                    buf.append(text[1:] if text.startswith("..") else text)
                continue
            u = text.upper()
            if u.startswith("EHLO") or u.startswith("HELO"):
                self.send("250 sink")
            elif u.startswith("MAIL FROM"):
                sender = text[10:]
                self.send("250 ok")
            elif u.startswith("RCPT TO"):
                rcpts.append(text[8:])
                self.send("250 ok")
            elif u == "DATA":
                data_mode = True
                self.send("354 go")
            elif u == "QUIT":
                self.send("221 bye")
                return
            else:
                self.send("250 ok")


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


with S(("127.0.0.1", PORT), H) as srv:
    print("SMTP sink on", PORT, "->", OUT, flush=True)
    srv.serve_forever()
