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
