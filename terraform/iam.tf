# ── IAM: Cloud TTS ─────────────────────────────────────────────────────────
# Cloud TTS (texttospeech.googleapis.com) needs NO IAM role — authenticated
# credentials (tts-service SA key/ADC) + the enabled API
# (google_project_service.tts_api in apis.tf) + billing only. No
# google_project_iam_member binds roles/cloudtexttospeech.user — that role is
# absent from GCP's predefined catalog and synthesize requires no IAM role.

# ── IAM: Gemini ────────────────────────────────────────────────────────────
# Least-privilege: only aiplatform.user for Gemini API access.

resource "google_project_iam_member" "gemini_role" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.gemini.email}"
}

# ── IAM: GCS (bucket-level only, NOT project-level) ───────────────────────
# objectAdmin on the app-data bucket only — not project-wide storage.admin.

resource "google_storage_bucket_iam_member" "gcs_storage" {
  bucket = google_storage_bucket.app_data.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.gcs.email}"
}

# ── IAM: Preview (PR environments) ─────────────────────────────────────────
# Least-privilege (Story 24-17): objectAdmin on the SANDBOX preview bucket ONLY
# (never project-level storage), plus project-level Gemini access so preview
# builds exercise the same external services as prod. Cloud TTS needs no IAM
# role (auth + enabled API only). All via the one `preview-service` SA key
# stored as the `GCP_PREVIEW_SA_KEY` GitHub secret.

resource "google_storage_bucket_iam_member" "preview_storage" {
  bucket = google_storage_bucket.preview_data.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.preview.email}"
}

resource "google_project_iam_member" "preview_gemini_role" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.preview.email}"
}
