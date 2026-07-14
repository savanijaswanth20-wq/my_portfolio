import urllib.request
import json
import sys

def make_request(url, headers, method="GET", data=None):
    try:
        req = urllib.request.Request(
            url,
            headers=headers,
            method=method,
            data=json.dumps(data).encode("utf-8") if data else None
        )
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(error_body)
            print(f"Cloudflare API Error: {json.dumps(err_json, indent=2)}")
        except Exception:
            print(f"HTTP Error {e.code}: {error_body}")
        sys.exit(1)
    except Exception as e:
        print(f"Network error occurred: {e}")
        sys.exit(1)

def main():
    print("=== Cloudflare DNS Record Creator ===")
    
    print("\nTo create a DNS record, you need a Cloudflare API Token.")
    print("You can create one at: https://dash.cloudflare.com/profile/api-tokens")
    print("Use the 'Edit Zone DNS' template, which gives read/write access to DNS records.")
    
    token = input("Enter your Cloudflare API Token: ").strip()
    if not token:
        print("API Token cannot be empty.")
        return
        
    domain = input("Enter your root domain (e.g., example.com): ").strip().lower()
    if not domain:
        print("Domain cannot be empty.")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "Algonex-Cloudflare-DNS-Creator"
    }

    # Step 1: Find the Zone ID for the domain
    print(f"\nFetching Zone ID for domain '{domain}'...")
    zones_url = f"https://api.cloudflare.com/client/v4/zones?name={domain}"
    zones_res = make_request(zones_url, headers)
    
    if not zones_res.get("success") or not zones_res.get("result"):
        print(f"Error: Could not find domain '{domain}' in your Cloudflare account.")
        print("Please check your API Token permissions and make sure the domain is added to Cloudflare.")
        return
        
    zone_id = zones_res["result"][0]["id"]
    print(f"Found Zone ID: {zone_id}")

    # Step 2: Get record configuration
    print("\n--- Enter DNS Record Details ---")
    record_type = input("Record Type (e.g., A, CNAME, TXT, MX) [default: A]: ").strip().upper() or "A"
    
    record_name = input("Record Name (e.g., '@' for root, 'www', 'portfolio'): ").strip()
    if not record_name:
        print("Record Name cannot be empty.")
        return
        
    # If the user input '@', it maps to the root domain
    if record_name == "@":
        full_name = domain
    elif not record_name.endswith(domain):
        full_name = f"{record_name}.{domain}"
    else:
        full_name = record_name

    content = input(f"Enter the content/target (e.g., server IP address or CNAME target): ").strip()
    if not content:
        print("Record content cannot be empty.")
        return

    proxied_input = input("Proxy through Cloudflare? (y/n) [default: y]: ").strip().lower()
    proxied = proxied_input != 'n'

    # Step 3: Create the DNS record
    print(f"\nCreating {record_type} record for '{full_name}' pointing to '{content}'...")
    dns_url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records"
    dns_data = {
        "type": record_type,
        "name": full_name,
        "content": content,
        "ttl": 1 if proxied else 3600, # 1 means 'automatic' in Cloudflare
        "proxied": proxied
    }
    
    dns_res = make_request(dns_url, headers, method="POST", data=dns_data)
    
    if dns_res.get("success"):
        record = dns_res["result"]
        print(f"\nSuccess! Created DNS record:")
        print(f" - ID: {record['id']}")
        print(f" - Name: {record['name']}")
        print(f" - Type: {record['type']}")
        print(f" - Content: {record['content']}")
        print(f" - Proxied: {record['proxied']}")
    else:
        print("Failed to create DNS record.")

if __name__ == "__main__":
    main()
