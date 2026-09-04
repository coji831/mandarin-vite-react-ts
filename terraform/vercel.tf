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

  # ── Preview deployments: Vercel-native (auto-built per branch) ─────────
  # ignore_command is NOT set, so non-`main` branches build Vercel previews
  # automatically (Vercel's default per-branch preview behavior). Preview
  # VITE_API_URL is deliberately NOT Terraform-managed: the owner points the
  # preview-scope VITE_API_URL at a manually-deployed Railway pr-<n> backend
  # via the Vercel dashboard when testing the UI against that PR backend.

  # Git integration — auto-deploy on every push/merge.
  # production_branch is explicit: merges to `main` produce Production
  # deployments (Vercel's default is the repo's default branch; being explicit
  # removes any ambiguity for Terraform-managed config).
  git_repository = {
    type              = "github"
    repo              = "coji831/mandarin-vite-react-ts"
    production_branch = "main"
  }

  # ── Environment Variables ──────────────────────────────────────────────
  # VITE_API_URL is Terraform-managed for the PRODUCTION scope only (resource
  # below — the single TF-managed VITE_API_URL). Preview-scope VITE_API_URL is
  # NOT Terraform-managed: previews are Vercel-native auto-builds, and the
  # owner sets the preview var manually (Vercel dashboard) when testing the FE
  # preview against a manually-deployed Railway pr-<n> backend. No per-PR
  # Vercel var automation exists (the old preview.yml `vercel-preview` wiring
  # was removed 2026-09-04).
  #
  # REALITY (2026-09): the "Railway → Vercel integration"
  # (Settings → Integrations → Vercel) is NOT documented/verified by either
  # vendor, so VITE_API_URL is NOT auto-injected per deployment. Without an
  # explicit var, production builds fall back to http://localhost:3001
  # (apps/frontend/src/shared/config/api.ts). We therefore pin the production
  # backend URL here as a Terraform-managed environment variable.
  #
  # PORTABILITY: If migrating away from Railway (e.g., to Render), just update
  # the value of the resource below — this var is the single source of truth.
}

# ── VITE_API_URL (Production scope — the single TF-managed var) ───────────
# The ONLY Terraform-managed VITE_API_URL (Production scope). Production
# Railway domain: https://mandarin-vite-react-ts-production.up.railway.app
# (verified in docs/guides/operations/deployment.md + apps/backend
# docs/openapi.yaml). Preview-scope VITE_API_URL is NOT TF-managed — previews
# are Vercel-native auto-builds and the owner sets the preview var manually
# (Vercel dashboard) when testing the FE preview against a manually-deployed
# Railway pr-<n> backend.
# OWNER: confirm this is still the live production Railway domain before
# `terraform apply`. `sensitive = false` — this is a public backend URL, not a
# secret.
resource "vercel_project_environment_variable" "frontend_api_url" {
  project_id = vercel_project.frontend.id
  key        = "VITE_API_URL"
  value      = "https://mandarin-vite-react-ts-production.up.railway.app"
  target     = ["production"]
  sensitive  = false
  comment    = "Production backend URL (Railway). Terraform-managed — the Railway→Vercel integration is NOT documented/verified by either vendor as of 2026-09."
}

# ── Outputs ───────────────────────────────────────────────────────────────

output "vercel_project_id" {
  value       = vercel_project.frontend.id
  sensitive   = false
  description = "Vercel project ID (reference only — no workflow consumes it since the per-PR Vercel automation was removed 2026-09-04)."
}

# Preview deployments are Vercel-native (auto-built per branch; ignore_command
# is not set). This output documents the branch-preview URL pattern only;
# nothing consumes it programmatically today (verified via grep, 2026-09-03).
output "vercel_preview_url_pattern" {
  value       = "https://${vercel_project.frontend.name}-git-*.coji831.vercel.app"
  sensitive   = false
  description = "Pattern for Vercel preview deployment URLs (Vercel-native per-branch previews)."
}
