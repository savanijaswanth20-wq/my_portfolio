import json
import urllib.request
import urllib.error
import subprocess
import sys

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, text=True, capture_output=True)
    if result.returncode != 0:
        return False, result.stderr
    return True, result.stdout

def main():
    print("==================================================")
    print("   GitHub Repository Creator & Code Pusher        ")
    print("==================================================")
    
    # 1. Gather Repository Info
    token = input("Enter your GitHub Personal Access Token (PAT): ").strip()
    if not token:
        print("Error: GitHub PAT is required.")
        sys.exit(1)
        
    repo_name = input("Enter the name for the new repository: ").strip()
    if not repo_name:
        print("Error: Repository name is required.")
        sys.exit(1)
        
    is_private_input = input("Make the repository private? (y/n, default: n): ").strip().lower()
    is_private = is_private_input == 'y'
    
    # 2. Create the repository via GitHub API
    print(f"\nCreating repository '{repo_name}' on GitHub...")
    url = "https://api.github.com/user/repos"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }
    payload = json.dumps({
        "name": repo_name,
        "private": is_private,
        "auto_init": False
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            clone_url = res_data.get("clone_url")
            html_url = res_data.get("html_url")
            print(f"✓ Success! Repository created: {html_url}")
    except urllib.error.HTTPError as e:
        print(f"\n✗ Failed to create repository: HTTP {e.code} - {e.reason}")
        try:
            err_msg = json.loads(e.read().decode("utf-8")).get("message", "")
            print(f"  Details: {err_msg}")
        except Exception:
            pass
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error connecting to GitHub API: {e}")
        sys.exit(1)
        
    # 3. Setup git and push files
    print("\nConfiguring local Git repository...")
    
    # Verify if Git is initialized
    success, _ = run_cmd("git rev-parse --is-inside-work-tree")
    if not success:
        print("Initializing Git...")
        run_cmd("git init")
        run_cmd("git branch -M main")
        
    # Remove existing 'origin' remote if it exists
    success, remotes = run_cmd("git remote")
    if "origin" in remotes:
        print("Replacing existing remote 'origin'...")
        run_cmd("git remote remove origin")
        
    # Authenticate clone url with token for automatic push
    auth_clone_url = clone_url.replace("https://", f"https://{token}@")
    
    # Add new remote
    success, err = run_cmd(f"git remote add origin {auth_clone_url}")
    if not success:
        print(f"✗ Failed to add remote origin: {err}")
        sys.exit(1)
        
    # Stage, commit and push
    print("Staging files...")
    run_cmd("git add .")
    
    print("Committing files...")
    run_cmd('git commit -m "Initial commit with Vercel deployment support"')
    
    print("Pushing to GitHub (main branch)...")
    success, out = run_cmd("git push -u origin main")
    if success:
        print("\n🎉 Success! Your codebase has been pushed to GitHub.")
        print(f"Repository Link: {html_url}")
    else:
        print("\n✗ Failed to push code automatically.")
        print(f"Error Details: {out}")
        print("\nYou can try pushing manually with:")
        print(f"  git push -u origin main")

if __name__ == "__main__":
    main()
