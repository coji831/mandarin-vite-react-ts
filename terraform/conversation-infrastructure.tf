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
