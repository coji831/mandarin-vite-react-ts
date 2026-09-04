# ── Service Accounts ────────────────────────────────────────────────────────
# Dedicated service accounts for each GCP service (least-privilege).
# Keys are managed outside Terraform (generated via gcloud CLI, stored as env vars).

resource "google_service_account" "tts" {
  account_id   = "tts-service"
  display_name = "TTS Service Account"
  description  = "Google Cloud Text-to-Speech API access only"
}

resource "google_service_account" "gemini" {
  account_id   = "gemini-service"
  display_name = "Gemini API Service Account"
  description  = "Gemini API (generativelanguage) access only"
}

resource "google_service_account" "gcs" {
  account_id   = "gcs-storage-service"
  display_name = "GCS Storage Service Account"
  description  = "GCS bucket object admin (app-data bucket only)"
}

# ── Preview Service Account (Story 24-17 env isolation) ────────────────────
# Single SA for ALL PR-preview environments (deployment 24-17). Least-privilege:
# objectAdmin on the SANDBOX preview bucket only (never project storage) +
# project-level roles/aiplatform.user ONLY so preview builds can exercise the
# same external services as prod. Cloud TTS needs NO IAM role (auth + enabled
# API + billing only) — the old `tts_role` / `preview_tts_role` bindings are
# removed. ONE key = the single `GCP_PREVIEW_SA_KEY` GitHub secret consumed by
# .github/workflows/preview.yml.

resource "google_service_account" "preview" {
  account_id   = "preview-service"
  display_name = "Preview Service Account"
  description  = "PR preview access: sandbox bucket objectAdmin + project-level Gemini user (single GCP_PREVIEW_SA_KEY)"
}
