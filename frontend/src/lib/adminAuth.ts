export function isAdmin(request: Request): boolean {
  const email = request.headers.get("x-admin-email") || "";
  const normalizedEmail = email.toLowerCase().trim();
  
  // Retrieve allowed admin emails from environment variables, fallback to owner email only
  const adminEmailsEnv = process.env.ADMIN_EMAILS || "trungkim8694@gmail.com";
  const allowedAdmins = adminEmailsEnv.split(",").map(e => e.trim().toLowerCase());
  
  const isEmailAdmin = allowedAdmins.includes(normalizedEmail);
  
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  if (adminSecret) {
    const requestSecret = request.headers.get("x-admin-secret") || "";
    return isEmailAdmin && requestSecret === adminSecret;
  }
  return isEmailAdmin;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  const adminEmailsEnv = process.env.ADMIN_EMAILS || "trungkim8694@gmail.com";
  const allowedAdmins = adminEmailsEnv.split(",").map(e => e.trim().toLowerCase());
  return allowedAdmins.includes(normalizedEmail);
}
