import paramiko
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "160.251.203.84"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Hrptlcct6789@"
REMOTE_BASE = "/var/www/kigyou-list"

ITEMS_TO_SYNC = [
    # Core Components & Pages
    "frontend/src/lib/domainUtils.ts",
    "frontend/src/lib/seoIndexingTrigger.ts",
    "frontend/src/lib/cloudflarePurge.ts",
    "frontend/src/components/CompanyOwnershipClaimForm.tsx",
    "frontend/src/components/CompanyManagementModal.tsx",
    "frontend/src/components/CompanyClaimModal.tsx",
    "frontend/src/components/CompanyLogo.tsx",
    "frontend/src/auth.ts",
    "frontend/src/middleware.ts",
    "frontend/src/app/api/auth/signout-direct/route.ts",
    "frontend/src/app/[locale]/company/[id]/page.tsx",
    "frontend/src/lib/ntaHistory.ts",
    "frontend/src/lib/db.ts",
    "frontend/src/lib/hubUtils.ts",
    "frontend/src/lib/currency.ts",
    "frontend/src/lib/searchCache.ts",
    "frontend/src/components/company/CompanyLegalHistoryTimeline.tsx",
    "frontend/src/components/company/CompanyWorkplaceMetrics.tsx",
    "frontend/src/components/CompanySignalsTimeline.tsx",
    "frontend/src/context/AuthContext.tsx",
    "frontend/src/components/dashboard/WatchlistTab.tsx",
    "frontend/src/components/dashboard/CompaniesTab.tsx",
    "frontend/src/components/dashboard/BatchInvoiceModal.tsx",
    "frontend/src/components/dashboard/DeveloperTab.tsx",
    "frontend/src/components/Header.tsx",
    "frontend/src/components/Footer.tsx",
    "frontend/src/components/ranking",
    "frontend/src/components/SearchClientContainer.tsx",
    "frontend/src/components/SearchSidebar.tsx",
    "frontend/src/components/CompanyActions.tsx",
    "frontend/src/components/CompanyConversionBar.tsx",
    "frontend/src/components/CompanyCorrectionBar.tsx",
    "frontend/src/components/CompanyFinancials.tsx",
    "frontend/src/components/CompanyPRSection.tsx",
    "frontend/src/components/company/CompanyLicensesSection.tsx",
    "frontend/src/components/company/CompanyQuickAuditModal.tsx",
    "frontend/src/components/company/CompanyHubBacklinks.tsx",
    
    # App Pages
    "frontend/src/app/[locale]/login/verify/page.tsx",
    "frontend/src/app/[locale]/page.tsx",
    "frontend/src/app/[locale]/layout.tsx",
    "frontend/src/app/[locale]/dashboard/page.tsx",
    "frontend/src/app/[locale]/compare/page.tsx",
    "frontend/src/app/[locale]/search/page.tsx",
    "frontend/src/app/[locale]/pricing/page.tsx",
    "frontend/src/app/[locale]/contact/page.tsx",
    "frontend/src/app/[locale]/form-marketing/page.tsx",
    "frontend/src/app/[locale]/developer/page.tsx",
    
    # Directories
    "frontend/src/app/[locale]/invoice",
    "frontend/src/app/[locale]/watchlist",
    "frontend/src/app/[locale]/changes",
    "frontend/src/app/[locale]/jobs",
    "frontend/src/app/[locale]/new-companies",
    "frontend/src/app/[locale]/status",
    "frontend/src/app/[locale]/building",
    "frontend/src/app/[locale]/ranking",
    
    # APIs
    "frontend/src/app/api/companies",
    "frontend/src/app/api/inquiry",
    "frontend/src/app/api/invoice",
    "frontend/src/app/api/user",
    "frontend/src/app/api/admin",
    "frontend/src/app/api/sys-check",
    "frontend/src/app/api/metadata",
    
    # Admin & Components
    "frontend/src/components/admin",
    "frontend/src/app/[locale]/admin",
    "frontend/src/lib/adminAuth.ts",
    
    # Locales & Styles
    "frontend/src/locales/ja.ts",
    "frontend/src/locales/en.ts",
    "frontend/src/locales/vi.ts",
    "frontend/src/app/globals.css",
    
    # Master Agents & Docs
    "FEATURES.md",
    ".agents/skills/b2b-data-engine/SKILL.md",
    ".agents/skills/b2b-feature-orchestrator/SKILL.md",
    ".agents/skills/b2b-ui-commander/SKILL.md",
    ".agents/skills/jp-b2b-design-system/SKILL.md",
]

def sftp_upload_item(sftp, ssh, local_path, remote_path):
    if not os.path.exists(local_path):
        print(f"Skipping non-existent local path: {local_path}")
        return
        
    if os.path.isfile(local_path):
        remote_dir = os.path.dirname(remote_path)
        ssh.exec_command(f"mkdir -p {remote_dir}")
        print(f"Uploading file: {local_path} -> {remote_path}...")
        sftp.put(local_path, remote_path)
    elif os.path.isdir(local_path):
        ssh.exec_command(f"mkdir -p {remote_path}")
        for root, dirs, files in os.walk(local_path):
            rel_root = os.path.relpath(root, local_path)
            target_dir = os.path.join(remote_path, rel_root).replace("\\", "/")
            ssh.exec_command(f"mkdir -p {target_dir}")
            for f in files:
                l_file = os.path.join(root, f)
                r_file = os.path.join(target_dir, f).replace("\\", "/")
                print(f"Uploading file: {l_file} -> {r_file}...")
                sftp.put(l_file, r_file)

def main():
    print(f"Connecting to Production VPS {VPS_HOST} via SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=35)
    print("SSH Connected successfully!")
    
    sftp = ssh.open_sftp()
    local_base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    print("\n--- Synchronizing Production Files via SFTP ---")
    for rel_path in ITEMS_TO_SYNC:
        local_path = os.path.join(local_base, rel_path.replace("/", os.sep))
        remote_path = f"{REMOTE_BASE}/{rel_path}"
        sftp_upload_item(sftp, ssh, local_path, remote_path)
        
    sftp.close()
    print("All production files & directories uploaded successfully!")
    
    print("\n--- Building Frontend & Reloading PM2 Service on Production VPS ---")
    build_cmd = (
        "cd /var/www/kigyou-list/frontend && "
        "npm run build && "
        "pm2 reload 0 && "
        "pm2 status"
    )
    stdin, stdout, stderr = ssh.exec_command(build_cmd, get_pty=True)
    for line in iter(stdout.readline, ""):
        print(line, end="")
        
    print("\n[SUCCESS] Deployed All Upgrades to Production VPS (kigyoulist.com)!")
    ssh.close()

if __name__ == "__main__":
    main()
