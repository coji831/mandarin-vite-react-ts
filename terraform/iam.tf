# ── IAM: TTS ────────────────────────────────────────────────────────────────
# Least-privilege: only cloudtexttospeech.user — no storage or other roles.

resource "google_project_iam_member" "tts_role" {
  project = var.project_id
  role    = "roles/cloudtexttospeech.user"
  member  = "serviceAccount:${google_service_account.tts.email}"
}

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
# (never project-level storage), plus project-level TTS + Gemini users so
# preview builds exercise the same external services as prod — all via the one
# `preview-service` SA key stored as the `GCP_PREVIEW_SA_KEY` GitHub secret.

resource "google_storage_bucket_iam_member" "preview_storage" {
  bucket = google_storage_bucket.preview_data.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.preview.email}"
}

resource "google_project_iam_member" "preview_tts_role" {
  project = var.project_id
  role    = "roles/cloudtexttospeech.user"
  member  = "serviceAccount:${google_service_account.preview.email}"
}

resource "google_project_iam_member" "preview_gemini_role" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.preview.email}"
}
