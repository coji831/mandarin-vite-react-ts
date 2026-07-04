# ── Upstash Redis ───────────────────────────────────────────────────────────
# Serverless Redis for caching (TTS audio, rate limiting, locks).
# Provider: upstash/upstash (official) — declared in main.tf
# Docs: https://registry.terraform.io/providers/upstash/upstash/latest/docs

# ── Redis Database ──────────────────────────────────────────────────────────

resource "upstash_redis_database" "cache" {
  database_name = "pinyin-pal-cache"
  region        = "global"
  primary_region = "ap-southeast-1"
  tls           = true
  eviction      = true
}

# ── Outputs ───────────────────────────────────────────────────────────────

output "upstash_redis_url" {
  value     = "rediss://default:${upstash_redis_database.cache.password}@${upstash_redis_database.cache.endpoint}:6379"
  sensitive = true
  description = "Full Redis connection URL with TLS (rediss://). Set as REDIS_URL in Railway."
}

output "upstash_redis_endpoint" {
  value     = upstash_redis_database.cache.endpoint
  sensitive = false
  description = "Upstash Redis endpoint hostname."
}