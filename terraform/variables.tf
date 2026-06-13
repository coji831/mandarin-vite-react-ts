# ── Variables ────────────────────────────────────────────────────────────────
# Minimal configuration: only project_id and region are needed.
# Service accounts and Redis are managed outside terraform (env vars / Railway).

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for resources"
  type        = string
  default     = "us-central1"
}
