# ── Neon Database ──────────────────────────────────────────────────────────
# Serverless PostgreSQL with Copy-on-Write branching for preview environments.
# Provider: kislerdm/neon (community, 569k+ downloads) — declared in main.tf
# Docs: https://registry.terraform.io/providers/kislerdm/neon/latest/docs

# ── Main Project ──────────────────────────────────────────────────────────
# Production database project. Preview branches are created per PR via
# GitHub Actions (not managed by Terraform).

resource "neon_project" "main" {
  name                      = "pinyin-pal-db"
  region_id                 = "aws-ap-southeast-1"
  org_id                    = "org-empty-wildflower-68701288"
  history_retention_seconds = 21600

  # NOTE: suspend_timeout_seconds modification not allowed on this account tier.
  # Remove default_endpoint_settings entirely if the account doesn't support it:
  # default_endpoint_settings {
  #   autoscaling_limit_min_cu = 0.5
  #   autoscaling_limit_max_cu = 2
  #   suspend_timeout_seconds  = 300
  # }
}

# ── Outputs ───────────────────────────────────────────────────────────────
# Sensitive — use `terraform output -raw neon_database_url` to retrieve.

output "neon_database_url" {
  value     = neon_project.main.connection_uri
  sensitive = true
  description = "Direct connection URI (non-pooled). Use for Prisma migrations."
}

output "neon_database_url_pooler" {
  value     = neon_project.main.connection_uri_pooler
  sensitive = true
  description = "Pooled connection URI. Use for production app connections."
}

output "neon_project_id" {
  value     = neon_project.main.id
  sensitive = false
  description = "Neon project ID (used by GitHub Actions for preview branches)."
}

output "neon_database_host" {
  value     = neon_project.main.database_host
  sensitive = false
  description = "Direct database host."
}

output "neon_database_user" {
  value     = neon_project.main.database_user
  sensitive = false
  description = "Default database user."
}
