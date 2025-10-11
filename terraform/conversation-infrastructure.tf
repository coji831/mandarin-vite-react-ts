# Terraform IaC for Conversation Generation Infrastructure
resource "google_storage_bucket" "conversation_cache" {
  name          = "${var.project_id}-conversation-cache"
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
}

resource "google_storage_bucket" "audio_cache" {
  name          = "${var.project_id}-audio-cache"
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
}

resource "google_service_account" "conversation_service" {
  account_id   = "conversation-generator"
  display_name = "Conversation Generation Service"
  description  = "Service account for conversation generation and TTS"
}

resource "google_storage_bucket_iam_member" "conversation_cache_access" {
  bucket = google_storage_bucket.conversation_cache.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.conversation_service.email}"
}

resource "google_project_iam_member" "tts_access" {
  project = var.project_id
  role    = "roles/cloudtts.user"
  member  = "serviceAccount:${google_service_account.conversation_service.email}"
}

resource "google_monitoring_alert_policy" "tts_cost_alert" {
  display_name = "TTS API Cost Alert"
  combiner     = "OR"

  conditions {
    display_name = "TTS API usage spike"

    condition_threshold {
      filter         = "resource.type=\"cloud_tts_api\""
      comparison     = "COMPARISON_GREATER_THAN"
      threshold_value = 100  # Alert if costs exceed $100/day
      duration       = "300s"

      aggregations {
        alignment_period   = "3600s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [var.alert_notification_channel]
}
