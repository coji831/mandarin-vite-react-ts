# ── Main Terraform Configuration ─────────────────────────────────────────────
# Single shared GCS bucket for all application data (TTS audio, examples, vocabulary CSVs).
# Service accounts are managed via service-accounts.tf + iam.tf, credentials passed via env vars.
# Redis is provisioned by Upstash, not via Terraform.
#
# ── Architecture (Option B: Best-of-Breed) ───────────────────────────────────
#   Frontend:  Vercel (SPA, CDN)       ← terraform/vercel.tf
#   Backend:   Railway (NestJS API)    ← NOT in Terraform (no official/production-grade provider; community wrapper exists, not adopted)
#   Database:  Neon (serverless PG)    ← terraform/neon.tf
#   Cache:     Upstash (Redis)         ← terraform/upstash.tf
#   Storage:   GCP (GCS bucket)        ← terraform/main.tf
#   Auth:      Custom JWT (backend)
#   AI:        Google TTS + Gemini     ← terraform/service-accounts.tf + iam.tf
#
# ── Exit Strategy (Railway → Render) ─────────────────────────────────────────
# Railway has no official/production-grade Terraform provider (a community
# wrapper, terraform-community-providers/railway, exists but is not adopted) and
# has experienced reliability issues.
# If migrating to Render, the following changes are needed:
#   1. Add render_web_service + render_static_site resources
#   2. Use render-oss/render provider (Terraform-native, stable)
#   3. Point VITE_API_URL at the new backend URL in terraform/vercel.tf — it is
#      ALREADY Terraform-managed there (Production scope; the "Railway → Vercel
#      integration" is NOT documented/verified by either vendor as of 2026-09),
#      so this is now just a value update, not wiring up a new mechanism
#   4. Optionally keep Neon for DB branching, or use Render Postgres
#   5. Replace Upstash with Render Key Value, or keep Upstash

terraform {
  required_version = ">= 1.5"

  # ── Remote State + Locking (adopted 2026-09-03) ───────────────────────────
  # State now lives in GCS (versioned) at gs://pinyin-pal-tfstate under
  # terraform/state/, with native state locking via the GCS backend. The old
  # local terraform/terraform.tfstate was migrated here (kept as a local safety
  # copy). CI plan/apply auto-reads this backend config via `terraform init`.
  backend "gcs" {
    bucket = "pinyin-pal-tfstate"
    prefix = "terraform/state"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 6.0, < 8.0"
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
  # versioning is intentionally NOT declared — provider default (disabled) matches live bucket.
  # Security best practices — NOTE: uniform_bucket_level_access=false matches LIVE reality
  # (bucket is non-uniform / has per-object ACLs from legacy writes). Do not flip to true
  # without a migration plan, or prod audio access breaks.
  uniform_bucket_level_access = false
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

# ── Preview Sandbox Bucket (Story 24-17 env isolation) ─────────────────────
# Sandbox bucket for PR-preview environments (TTS audio written by preview
# builds via the single preview SA). Additive-only — production resources are
# untouched.
#
# ACCESS CHOICE: mirrors the app_data bucket's public-read model (allUsers
# objectViewer) for consistency, so preview behaves like production. NOTE:
# app_data is NON-uniform (uniform_bucket_level_access = false — per-object ACLs
# from legacy writes), while this preview bucket keeps uniform access ON — so
# this mirrors app_data's public-read browser path, not its access-setting
# uniformity. The app serves audio via short-lived SIGNED URLs (see
# AudioService.getSignedUrl), so this bucket COULD be private — but public-read
# parity keeps the preview/prod browser path identical, and preview audio is
# non-sensitive generated content. Flagged: a private + signed-URL-only variant
# is a possible hardening follow-up but would diverge preview from prod behavior.

resource "google_storage_bucket" "preview_data" {
  name          = var.preview_bucket_name
  location      = var.region
  storage_class = "STANDARD"

  # No auto-delete — preview audio cache; cleaned up with the environment.
  versioning {
    enabled = false
  }

  uniform_bucket_level_access = true
  public_access_prevention    = "inherited"

  # CORS — allow browser to fetch TTS audio from any origin (same as app_data).
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type", "Content-Disposition", "Content-Length", "Content-Range"]
    max_age_seconds = 3600
  }
}

resource "google_storage_bucket_iam_member" "preview_public_read" {
  bucket = google_storage_bucket.preview_data.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# ── TTS Cost Alert ──────────────────────────────────────────────────────────
# NOTE: The previous alert used an invalid resource type (cloud_tts_api).
# GCP does not expose TTS API costs via Monitoring metrics directly.
# For cost alerts, use GCP Budgets instead (manual setup in Billing Console).
# Budget alert setup: Billing → Budgets & alerts → Create budget
# Filter by: Service = Cloud Text-to-Speech API, Threshold = $100
