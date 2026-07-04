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
