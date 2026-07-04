# ── Enable GCP APIs ────────────────────────────────────────────────────────
# These APIs must be enabled before the corresponding service accounts can be used.
# disable_on_destroy = false prevents accidental API disablement if Terraform
# destroys the resource (APIs have a 30-day re-enablement cooldown).

# NOTE: cloudtexttospeech.googleapis.com failed with 403.
# This may need manual enablement via GCP Console or quota increase.
# The API name might differ — check: gcloud services list --available | findstr tts
# resource "google_project_service" "tts_api" {
#   project            = var.project_id
#   service            = "cloudtexttospeech.googleapis.com"
#   disable_on_destroy = false
# }

resource "google_project_service" "gemini_api" {
  project            = var.project_id
  service            = "generativelanguage.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "storage_api" {
  project            = var.project_id
  service            = "storage.googleapis.com"
  disable_on_destroy = false
}
