variable "audit_dataset" {
  description = "BigQuery dataset to receive audit logs (assumed to exist)."
  type        = string
  default     = "mandarin_example_audit"
}

resource "google_storage_bucket" "examples_bucket" {
  name          = "mandarin-vocab-example-data"
  location      = var.region
  storage_class = "STANDARD"

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  versioning {
    enabled = false
  }

  # Enforce uniform bucket-level access and block public ACLs
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
}

resource "google_service_account" "examples_service" {
  account_id   = "examples-service"
  display_name = "Examples Service Account"
  description  = "Service account for examples cache read/write operations"
}

resource "google_storage_bucket_iam_member" "examples_service_creator" {
  bucket = google_storage_bucket.examples_bucket.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.examples_service.email}"
}

resource "google_storage_bucket_iam_member" "examples_service_viewer" {
  bucket = google_storage_bucket.examples_bucket.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.examples_service.email}"
}

# Cloud Audit Logs sink for GCS bucket resource type -> BigQuery
resource "google_logging_project_sink" "gcs_audit_sink" {
  name                     = "gcs-audit-sink"
  destination              = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${var.audit_dataset}"
  filter                   = "resource.type=\"gcs_bucket\" AND logName~=\"cloudaudit\""
  include_children         = false
  unique_writer_identity   = true
}

output "examples_bucket_name" {
  value = google_storage_bucket.examples_bucket.name
}

output "examples_service_account_email" {
  value = google_service_account.examples_service.email
}
