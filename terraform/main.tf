# ── Main Terraform Configuration ─────────────────────────────────────────────
# Single shared GCS bucket for all application data (TTS audio, examples, vocabulary CSVs).
# Service accounts are managed manually in GCP Console, credentials passed via env vars.
# Redis is provisioned by Railway plugin, not via terraform.

terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0, < 7.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ── Shared App Data Bucket ──────────────────────────────────────────────────
# Used by all modules: TTS audio cache, examples cache, vocabulary CSV data.
# All modules access the same bucket via GCS_BUCKET_NAME env var.

resource "google_storage_bucket" "app_data" {
  name          = "${var.project_id}-app-data"
  location      = var.region
  storage_class = "STANDARD"

  # No auto-delete — contains vocabulary data (source of truth) + cached assets
  versioning {
    enabled = false
  }
}

# ── TTS Cost Alert ──────────────────────────────────────────────────────────
# Monitors TTS API usage costs and alerts if daily spend exceeds $100.

resource "google_monitoring_alert_policy" "tts_cost_alert" {
  display_name = "TTS API Cost Alert"
  combiner     = "OR"

  conditions {
    display_name = "TTS API daily cost > $100"

    condition_threshold {
      filter          = "resource.type=\"cloud_tts_api\""
      comparison      = "COMPARISON_GT"
      threshold_value = 100
      duration        = "300s"

      aggregations {
        alignment_period   = "86400s"
        per_series_aligner = "ALIGN_SUM"
      }
    }
  }

  alert_strategy {
    auto_close = "604800s"
  }
}
