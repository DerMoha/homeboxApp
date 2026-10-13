"""Native Android regression: settings/login, create/photo, edit, process restart.
Only use a dedicated emulator: this clears com.homeboxapp's local test data.
Uses Python stdlib + adb; runs a loopback fixture matching Homebox v0.26 entities.
"""

import argparse
import email.parser
import http.server
import json
import pathlib
import struct
import subprocess
import threading
import time
import urllib.parse
import zlib

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "artifacts"
OUT.mkdir(exist_ok=True)
STATE = {"items": [], "requests": [], "logins": 0}
PHOTO = b""
LOCATION = {
    "id": "garage",
    "name": "E2E Garage",
    "description": "Test room",
    "quantity": 1,
    "entityType": {"id": "location-type", "isLocation": True},
}


class Fixture(http.server.BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def handle_request(self):
        path = urllib.parse.urlsplit(self.path).path
        query = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
        body = self.rfile.read(int(self.headers.get("content-length", "0")))
        STATE["requests"].append([self.command, self.path])
        data = (
            json.loads(body)
            if body and "application/json" in self.headers.get("content-type", "")
            else {}
        )
        result = {}
        if path.endswith("/users/login"):
            assert data["username"] == "test" and data["password"] == "test-password"
            STATE["logins"] += 1
            result = {"token": "fixture-token"}
        elif path.endswith("/users/logout"):
            pass
        elif path.endswith(("/tags", "/entities/tree", "/entity-types")):
            result = []
        elif path == "/api/v1/entities" and self.command == "GET":
            items = (
                [LOCATION] if query.get("isLocation") == ["true"] else STATE["items"]
            )
            q = query.get("q", [""])[0].lower()
            items = [i for i in items if q in i["name"].lower()]
            page, size = (
                int(query.get("page", ["1"])[0]),
                int(query.get("pageSize", ["50"])[0]),
            )
            result = {
                "items": items if size < 0 else items[(page - 1) * size : page * size],
                "page": page,
                "pageSize": size,
                "total": len(items),
            }
        elif path == "/api/v1/entities" and self.command == "POST":
            result = dict(
                data,
                id=str(len(STATE["items"]) + 1),
                assetId=str(1000 + len(STATE["items"])),
                createdAt="2026-10-12T12:00:00Z",
                updatedAt="2026-10-12T12:00:00Z",
                attachments=[],
                tags=[],
                insured=False,
                purchasePrice=0,
                parent=LOCATION if data.get("parentId") == "garage" else None,
            )
            STATE["items"].append(result)
        elif "/attachments/" in path and self.command == "GET":
            self.send_response(200)
            self.send_header("Content-Type", "image/png")
            self.end_headers()
            self.wfile.write(PHOTO)
            return
        elif path.endswith("/attachments") and self.command == "POST":
            item = next(i for i in STATE["items"] if i["id"] == path.split("/")[-2])
            msg = email.parser.BytesParser().parsebytes(
                (
                    "Content-Type: "
                    + self.headers["content-type"]
                    + "\r\nMIME-Version: 1.0\r\n\r\n"
                ).encode()
                + body
            )
            parts = {
                p.get_param("name", header="content-disposition"): p
                for p in msg.walk()
                if p.get_param("name", header="content-disposition")
            }
            assert parts["file"].get_payload(decode=True), "Empty photo upload"
            title = (
                parts["name"].get_payload(decode=True).decode()
                if "name" in parts
                else parts["file"].get_filename()
            )
            item["attachments"].append(
                {
                    "id": "photo-1",
                    "title": title,
                    "type": "photo",
                    "primary": True,
                    "mimeType": "image/png",
                }
            )
            item["imageId"] = "photo-1"
            item["thumbnailId"] = "photo-1"
            result = item
        elif path.startswith("/api/v1/entities/"):
            item = next(i for i in STATE["items"] if i["id"] == path.split("/")[4])
            if self.command == "PUT":
                item.update(data)
            result = item
        else:
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    do_GET = do_POST = do_PUT = do_DELETE = handle_request


def adb(*args):
    return subprocess.check_output(["adb", *args], text=True).strip()


def launch():
    adb("shell", "am", "start", "-n", "com.homeboxapp/.MainActivity")
    time.sleep(2)


def screenshot(name):
    (OUT / name).write_bytes(
        subprocess.check_output(["adb", "exec-out", "screencap", "-p"])
    )


def wait_state(predicate):
    for _ in range(60):
        if predicate():
            return
        time.sleep(0.2)
    raise AssertionError("Server assertion timed out: " + json.dumps(STATE))


def main():
    global PHOTO
    parser = argparse.ArgumentParser()
    parser.add_argument("--apk", required=True)
    parser.add_argument("--font-scale", default="1.0")
    parser.add_argument("--theme", choices=["light", "dark"], default="light")
    args = parser.parse_args()
    assert "emulator-" in adb("devices"), "Run on a dedicated emulator"

    # A deterministic PNG fixture; no external service or personal data.
    def chunk(t, data):
        return (
            struct.pack("!I", len(data))
            + t
            + data
            + struct.pack("!I", zlib.crc32(t + data) & 0xFFFFFFFF)
        )

    PHOTO = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack("!2I5B", 128, 128, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress((b"\0" + b"\x20\xa0\xe0" * 128) * 128))
        + chunk(b"IEND", b"")
    )
    photo = OUT / "fixture.png"
    photo.write_bytes(PHOTO)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 18080), Fixture)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    adb("reverse", "tcp:18080", "tcp:18080")
    adb("install", "-r", args.apk)
    adb("shell", "pm", "clear", "com.homeboxapp")
    adb("shell", "settings", "put", "system", "font_scale", args.font_scale)
    original_night = adb("shell", "cmd", "uimode", "night").rsplit(":", 1)[-1].strip()
    adb("shell", "cmd", "uimode", "night", "yes" if args.theme == "dark" else "no")
    try:
        adb("push", str(photo), "/sdcard/Pictures/homebox-fixture.png")
        adb(
            "shell",
            "am",
            "broadcast",
            "-a",
            "android.intent.action.MEDIA_SCANNER_SCAN_FILE",
            "-d",
            "file:///sdcard/Pictures/homebox-fixture.png",
        )
        test_apk = str(
            pathlib.Path(args.apk).parents[1]
            / "androidTest/fieldTest/app-fieldTest-androidTest.apk"
        )
        adb("install", "-r", test_apk)
        output = adb(
            "shell",
            "am",
            "instrument",
            "-w",
            "com.homeboxapp.test/com.homeboxapp.e2e.NativeFlow",
        )
        (OUT / "native-output.txt").write_text(output)
        assert "PASS: login/create/photo/edit" in output, output
        (OUT / "quick-entry-keyboard.png").write_bytes(
            subprocess.check_output(
                [
                    "adb",
                    "exec-out",
                    "cat",
                    "/sdcard/Android/data/com.homeboxapp/files/quick-entry-keyboard.png",
                ]
            )
        )
        wait_state(
            lambda: (
                len(STATE["items"]) == 1
                and len(STATE["items"][0]["attachments"]) == 1
                and STATE["items"][0]["name"] == "E2E Camera edited"
            )
        )
        adb("shell", "am", "force-stop", "com.homeboxapp")
        launch()
        # A second native instrumentation pass verifies restored login and data.
        output = adb(
            "shell",
            "am",
            "instrument",
            "-w",
            "-e",
            "reload",
            "true",
            "com.homeboxapp.test/com.homeboxapp.e2e.NativeFlow",
        )
        assert "PASS: reload" in output, output
        assert len(STATE["items"]) == 1 and len(STATE["items"][0]["attachments"]) == 1
        (OUT / "completed.png").write_bytes(
            subprocess.check_output(
                [
                    "adb",
                    "exec-out",
                    "cat",
                    "/sdcard/Android/data/com.homeboxapp/files/flow-final.png",
                ]
            )
        )
        (OUT / "result.json").write_text(
            json.dumps(
                {
                    "passed": True,
                    "fontScale": args.font_scale,
                    "theme": args.theme,
                    **STATE,
                },
                indent=2,
            )
        )
        print("PASS: native login → create → photo → edit → reload")
    except BaseException:
        screenshot("failure.png")
        (OUT / "state.json").write_text(json.dumps(STATE, indent=2))
        raise
    finally:
        adb("shell", "settings", "put", "system", "font_scale", "1.0")
        adb("shell", "cmd", "uimode", "night", original_night)
        server.shutdown()


if __name__ == "__main__":
    main()
