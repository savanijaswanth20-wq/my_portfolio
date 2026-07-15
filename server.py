import http.server
import json
import os
import base64
import sys

PORT = 3000
DATA_FILE = os.path.join(os.getcwd(), "portfolio-data.json")
CONTACTS_FILE = os.path.join(os.getcwd(), "contacts.json")

class PortfolioAPIHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow CORS for development ease
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Handle API routes
        if self.path == "/api/portfolio":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            data_to_send = b"{}"
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, "rb") as f:
                    data_to_send = f.read()
            self.wfile.write(data_to_send)
            return

        elif self.path == "/api/contacts":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            data_to_send = b"[]"
            if os.path.exists(CONTACTS_FILE):
                with open(CONTACTS_FILE, "rb") as f:
                    data_to_send = f.read()
            self.wfile.write(data_to_send)
            return

        # Serve static files from the 'dist' directory
        # Redirect root to index.html
        if self.path == "/" or self.path == "":
            self.path = "/index.html"
            
        # Serve static assets from dist
        original_dir = os.getcwd()
        try:
            os.chdir(os.path.join(original_dir, "dist"))
            # SimpleHTTPRequestHandler handles path resolution
            super().do_GET()
        finally:
            os.chdir(original_dir)

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        # 1. Update Portfolio Data
        if self.path == "/api/portfolio":
            try:
                # Validate JSON
                parsed_data = json.loads(post_data.decode("utf-8"))
                with open(DATA_FILE, "w", encoding="utf-8") as f:
                    json.dump(parsed_data, f, indent=2)
                
                # Also save to dist/portfolio-data.json
                dist_dir = os.path.join(os.getcwd(), "dist")
                if os.path.exists(dist_dir):
                    with open(os.path.join(dist_dir, "portfolio-data.json"), "w", encoding="utf-8") as f:
                        json.dump(parsed_data, f, indent=2)
                        
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Portfolio successfully updated!"}).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "message": str(e)}).encode("utf-8"))
            return

        # 2. Contact Message Submission
        elif self.path == "/api/contact":
            try:
                parsed_msg = json.loads(post_data.decode("utf-8"))
                new_contact = {
                    "id": f"contact-{int(sys.float_info.max)}",  # placeholder, or timestamp
                    "name": parsed_msg.get("name"),
                    "email": parsed_msg.get("email"),
                    "company": parsed_msg.get("company", "N/A"),
                    "message": parsed_msg.get("message"),
                    "timestamp": "2026-07-15T00:00:00Z"
                }
                
                contacts = []
                if os.path.exists(CONTACTS_FILE):
                    with open(CONTACTS_FILE, "r", encoding="utf-8") as f:
                        try:
                            contacts = json.load(f)
                        except:
                            contacts = []
                contacts.insert(0, new_contact)
                with open(CONTACTS_FILE, "w", encoding="utf-8") as f:
                    json.dump(contacts, f, indent=2)

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Message received!"}).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "message": str(e)}).encode("utf-8"))
            return

        # 3. File Uploads (avatar/resume)
        elif self.path == "/api/upload":
            try:
                req_body = json.loads(post_data.decode("utf-8"))
                file_name = req_body.get("fileName")
                file_data = req_body.get("fileData")
                
                if not file_name or not file_data:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "message": "Missing fileName or fileData"}).encode("utf-8"))
                    return
                
                # Base64 decode
                file_bytes = base64.b64decode(file_data)
                
                # Write to public/ and dist/ folders
                for folder in ["public", "dist"]:
                    folder_path = os.path.join(os.getcwd(), folder)
                    if not os.path.exists(folder_path):
                        os.makedirs(folder_path, exist_ok=True)
                    with open(os.path.join(folder_path, file_name), "wb") as f:
                        f.write(file_bytes)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "fileUrl": f"/{file_name}"}).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "message": str(e)}).encode("utf-8"))
            return

        # Default fallback
        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, PortfolioAPIHandler)
    print(f"Python Custom Portfolio API Server running on port {PORT}...")
    httpd.serve_forever()
