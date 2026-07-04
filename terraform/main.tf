# ── Main Terraform Configuration ─────────────────────────────────────────────
# Single shared GCS bucket for all application data (TTS audio, examples, vocabulary CSVs).
# Service accounts are managed via service-accounts.tf + iam.tf, credentials passed via env vars.
# Redis is provisioned by Upstash, not via Terraform.
#
# ── Architecture (Option B: Best-of-Breed) ───────────────────────────────────
#   Frontend:  Vercel (SPA, CDN)       ← terraform/vercel.tf
#   Backend:   Railway (Express API)   ← NOT in Terraform (no provider exists)
#   Database:  Neon (serverless PG)    ← terraform/neon.tf
#   Cache:     Upstash (Redis)         ← terraform/upstash.tf
#   Storage:   GCP (GCS bucket)        ← terraform/main.tf
#   Auth:      Custom JWT (backend)
#   AI:        Google TTS + Gemini     ← terraform/service-accounts.tf + iam.tf
#
# ── Exit Strategy (Railway → Render) ─────────────────────────────────────────
# Railway has no Terraform provider and has experienced reliability issues.
# If migrating to Render, the following changes are needed:
#   1. Add render_web_service + render_static_site resources
#   2. Use render-oss/render provider (Terraform-native, stable)
#   3. Replace Railway-Vercel integration with direct VITE_API_URL in vercel.tf
#   4. Optionally keep Neon for DB branching, or use Render Postgres
#   5. Replace Upstash with Render Key Value, or keep Upstash
#   See: verification-artifacts/migration/README.md for full plan

terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0, < 7.0"
    }
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.13"
    }
    upstash = {
      source  = "upstash/upstash"
      version = "~> 2.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 5.3"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "neon" {
  # API key read from NEON_API_KEY environment variable
}

provider "upstash" {
  # API key read from UPSTASH_API_KEY environment variable
}

provider "vercel" {
  # API token read from VERCEL_API_TOKEN environment variable
}

# ── Shared App Data Bucket ──────────────────────────────────────────────────
# Used by all modules: TTS audio cache, examples cache, vocabulary CSV data.
# All modules access the same bucket via GCS_BUCKET_NAME env var.
# Located in Singapore (ASIA-SOUTHEAST1) — same region as Neon, Upstash, Railway.

resource "google_storage_bucket" "app_data" {
  name          = var.bucket_name
  location      = var.region
  storage_class = "STANDARD"

  # No auto-delete — contains vocabulary data (source of truth) + cached assets
  versioning {
    enabled = false
  }

  # Security best practices
  uniform_bucket_level_access = true
  public_access_prevention    = "inherited"

  # CORS — allow browser to fetch TTS audio from any origin (public bucket).
  # GCS CORS only supports exact origins or "*"; wildcard subdomains (*.vercel.app) are NOT supported.
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type", "Content-Disposition", "Content-Length", "Content-Range"]
    max_age_seconds = 3600
  }
}

# ── Public Read Access (TTS audio) ─────────────────────────────────────────
# TTS audio files are served directly to browsers via public URLs.
# allUsers objectViewer allows unauthenticated GET/HEAD requests.

resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.app_data.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# ── TTS Cost Alert ──────────────────────────────────────────────────────────
# NOTE: The previous alert used an invalid resource type (cloud_tts_api).
# GCP does not expose TTS API costs via Monitoring metrics directly.
# For cost alerts, use GCP Budgets instead (manual setup in Billing Console).
# Budget alert setup: Billing → Budgets & alerts → Create budget
# Filter by: Service = Cloud Text-to-Speech API, Threshold = $100
