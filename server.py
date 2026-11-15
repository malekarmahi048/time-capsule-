from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import smtplib
import sqlite3
import threading
import time
import uuid
from datetime import datetime
from email.message import EmailMessage


DB_FILE = "timevault.db"

# Email settings (set these as environment variables, never hard-code them)
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")


# ---------------------------------------------------------------- database
def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS capsules (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            message TEXT,
            unlock_date TEXT,
            unlock_time TEXT,
            condition TEXT,
            status TEXT,
            created_at TEXT
        )
    """)

    # Add new columns to an existing table (CREATE TABLE IF NOT EXISTS won't do this)
    existing = {row[1] for row in conn.execute("PRAGMA table_info(capsules)")}
    for column, definition in [
        ("recipient", "TEXT"),
        ("sender_name", "TEXT"),
        ("sent", "INTEGER DEFAULT 0"),
    ]:
        if column not in existing:
            conn.execute(f"ALTER TABLE capsules ADD COLUMN {column} {definition}")

    conn.commit()
    conn.close()


# ------------------------------------------------------------------- email
def send_email(to, subject, body):
    if not SMTP_USER or not SMTP_PASS:
        raise RuntimeError("SMTP_USER / SMTP_PASS environment variables are not set")

    msg = EmailMessage()
    msg["From"] = SMTP_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)


def deliver_capsule(capsule):
    """Email the secret message to the recipient and mark the capsule as unlocked."""
    send_email(
        capsule["recipient"],
        f"TimeVault: \"{capsule['title']}\" has unlocked",
        f"{capsule['sender_name'] or 'Someone'} left you a capsule.\n\n"
        f"{capsule['message']}",
    )
    conn = sqlite3.connect(DB_FILE)
    conn.execute(
        "UPDATE capsules SET status = 'UNLOCKED', sent = 1 WHERE id = ?",
        (capsule["id"],),
    )
    conn.commit()
    conn.close()


def unlock_checker():
    """Background loop: every 30 seconds, deliver capsules whose time has arrived."""
    while True:
        try:
            now = datetime.now().strftime("%Y-%m-%dT%H:%M")
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            due = conn.execute(
                """SELECT * FROM capsules
                   WHERE sent = 0
                     AND condition = 'date'
                     AND recipient IS NOT NULL
                     AND (unlock_date || 'T' || unlock_time) <= ?""",
                (now,),
            ).fetchall()
            conn.close()

            for capsule in due:
                try:
                    deliver_capsule(dict(capsule))
                    print(f"Delivered capsule: {capsule['title']}")
                except Exception as e:
                    print("Delivery failed:", e)
        except Exception as e:
            print("Checker error:", e)

        time.sleep(30)


# ------------------------------------------------------------------ server
class TimeVaultServer(BaseHTTPRequestHandler):

    def send_json(self, status, data):
        response = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(response)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_POST(self):
        # ---- create a capsule
        if self.path == "/api/capsules":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)

            try:
                data = json.loads(body.decode("utf-8"))
            except json.JSONDecodeError:
                self.send_json(400, {"message": "Invalid JSON"})
                return

            required = ["title", "message", "unlock_date", "unlock_time", "recipient"]
            if not all(data.get(k) for k in required):
                self.send_json(400, {"message": "Missing required fields."})
                return

            capsule = {
                "id": str(uuid.uuid4()),
                "title": data.get("title"),
                "description": data.get("description"),
                "message": data.get("message"),
                "unlock_date": data.get("unlock_date"),
                "unlock_time": data.get("unlock_time"),
                "condition": data.get("condition") or "date",
                "status": "LOCKED",
                "created_at": datetime.now().isoformat(),
                "recipient": data.get("recipient"),
                "sender_name": data.get("sender_name") or "Someone",
                "sent": 0,
            }

            conn = sqlite3.connect(DB_FILE)
            conn.execute(
                """INSERT INTO capsules
                   (id, title, description, message, unlock_date, unlock_time,
                    condition, status, created_at, recipient, sender_name, sent)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    capsule["id"], capsule["title"], capsule["description"],
                    capsule["message"], capsule["unlock_date"], capsule["unlock_time"],
                    capsule["condition"], capsule["status"], capsule["created_at"],
                    capsule["recipient"], capsule["sender_name"], capsule["sent"],
                ),
            )
            conn.commit()
            conn.close()

            # Confirmation email (does NOT include the secret message)
            email_sent = True
            try:
                send_email(
                    capsule["recipient"],
                    "A TimeVault capsule is waiting for you",
                    f"{capsule['sender_name']} created a capsule titled "
                    f"\"{capsule['title']}\" for you.\n"
                    f"It will unlock on {capsule['unlock_date']} at {capsule['unlock_time']}.",
                )
            except Exception as e:
                email_sent = False
                print("Confirmation email failed:", e)

            # Don't echo the secret message back in the response
            safe_capsule = {k: v for k, v in capsule.items() if k != "message"}
            self.send_json(201, {
                "message": "Capsule created successfully",
                "email_sent": email_sent,
                "capsule": safe_capsule,
            })
            return

        # ---- manual unlock: POST /api/capsules/<id>/unlock
        parts = self.path.strip("/").split("/")
        if len(parts) == 4 and parts[:2] == ["api", "capsules"] and parts[3] == "unlock":
            capsule_id = parts[2]
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                "SELECT * FROM capsules WHERE id = ? AND sent = 0", (capsule_id,)
            ).fetchone()
            conn.close()

            if not row:
                self.send_json(404, {"message": "Capsule not found or already sent"})
                return

            try:
                deliver_capsule(dict(row))
            except Exception as e:
                self.send_json(500, {"message": f"Email failed: {e}"})
                return

            self.send_json(200, {"message": "Capsule unlocked and emailed"})
            return

        self.send_json(404, {"message": "API endpoint not found"})

    def do_GET(self):
        if self.path == "/api/capsules":
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM capsules").fetchall()
            conn.close()

            result = [dict(row) for row in rows]
            self.send_json(200, {"capsules": result})
            return

        self.send_json(404, {"message": "API endpoint not found"})


init_db()

if not SMTP_USER or not SMTP_PASS:
    print("WARNING: SMTP_USER / SMTP_PASS not set. Emails will NOT be sent.")

threading.Thread(target=unlock_checker, daemon=True).start()

server = HTTPServer(("127.0.0.1", 8000), TimeVaultServer)

print("TimeVault Python backend running at http://127.0.0.1:8000")

server.serve_forever()