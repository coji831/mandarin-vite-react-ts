# ── Vercel (Frontend) ───────────────────────────────────────────────────────
# Static SPA deployment for the React frontend.
# Provider: vercel/vercel (official partner) — declared in main.tf
#
# Terraform manages EVERYTHING: Git integration (auto-deploy on push),
# build/install/output commands, and environment variables.
#
# IMPORTANT: Import existing project — do NOT terraform apply a new one.
#
# Import command:
#   terraform import vercel_project.frontend prj_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
#
# Get project ID from Vercel Dashboard → Project → Settings → General → Project ID

# ── Project ────────────────────────────────────────────────────────────────

resource "vercel_project" "frontend" {
  name      = "mandarin-vite-react-ts"
  framework = null # static SPA

  build_command    = "npm run build:frontend"
  output_directory = "apps/frontend/dist"
  install_command  = "npm install"

  # Git integration — triggers auto-deploy on every push to main
  git_repository = {
    type = "github"
    repo = "coji831/mandarin-vite-react-ts"
  }

  # ── Environment Variables ──────────────────────────────────────────────
  # NOTE: VITE_API_URL is NOT managed here. It is auto-synced by the
  # Railway → Vercel integration (Settings → Integrations → Vercel).
  # Railway pushes RAILWAY_PUBLIC_DOMAIN to Vercel on every deploy.
  # Keeping it out of Terraform avoids ENV_CONFLICT and keeps the URL
  # dynamic — no hardcoded Railway domain needed.
  #
  # PORTABILITY: If migrating away from Railway, add VITE_API_URL back
  # here pointing to the new backend URL (e.g., Render service URL).
}

# ── Outputs ───────────────────────────────────────────────────────────────

output "vercel_project_id" {
  value     = vercel_project.frontend.id
  sensitive = false
  description = "Vercel project ID (used by GitHub Actions for env var management)."
}

output "vercel_preview_url_pattern" {
  value     = "https://${vercel_project.frontend.name}-git-*.coji831.vercel.app"
  sensitive = false
  description = "Pattern for Vercel preview deployment URLs."
}
