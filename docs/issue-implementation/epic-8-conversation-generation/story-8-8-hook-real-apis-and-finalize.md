# Implementation 8-8: Hook to Real APIs, Deploy, and Finalize

## Technical Scope

- Terraform infrastructure-as-code for GCS buckets and IAM
- Production deployment configuration and monitoring
- Cost monitoring and alerting for TTS usage
- Security configuration and secrets management
- Operational runbooks and troubleshooting guides

## Implementation Details

```hcl
# terraform/conversation-infrastructure.tf
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

# Cost monitoring alert
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
```

**Production Environment Configuration:**

```yaml
# docker-compose.prod.yml
version: "3.8"
services:
  conversation-backend:
    build: .
    environment:
      - NODE_ENV=production
      - USE_CONVERSATION=true
      - GOOGLE_CLOUD_PROJECT_ID=${GOOGLE_CLOUD_PROJECT_ID}
      - CONVERSATION_CACHE_BUCKET=${CONVERSATION_CACHE_BUCKET}
      - AUDIO_CACHE_BUCKET=${AUDIO_CACHE_BUCKET}
  - GEMINI_API_CREDENTIALS_RAW=<base64-encoded-service-account-json>
  - GOOGLE_TTS_CREDENTIALS_RAW=<base64-encoded-service-account-json>
    volumes:
      - /var/secrets/gcp-key.json:/app/credentials/gcp-key.json:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
```

**Monitoring and Logging Setup:**

```typescript
// src/utils/monitoring.ts
import { createLogger, transports, format } from "winston";

export const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: "logs/conversation-service.log",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Cost tracking middleware
export function trackTTSUsage(conversationId: string, durationSeconds: number) {
  logger.info("TTS generation completed", {
    conversationId,
    durationSeconds,
    estimatedCost: durationSeconds * 0.000016, // Google TTS pricing
    timestamp: new Date().toISOString(),
  });
}
```

**Operational Runbook:**

````markdown
# Conversation Generation Troubleshooting Guide

## Common Issues

### High TTS Costs

1. Check cost monitoring dashboard
2. Review recent TTS requests in logs
3. Verify cache hit rates are >70%
4. Check for cache key collisions

### Cache Performance Issues

1. Monitor GCS bucket metrics
2. Check cache hit/miss ratios
3. Verify lifecycle policies are active
4. Review cache key distribution

### AI Generation Failures

1. Check API key validity and quotas
2. Review recent error logs
3. Verify prompt formatting
4. Check rate limiting status

## Emergency Procedures

### Disable TTS to Control Costs

```bash
# Set environment variable to disable TTS
export DISABLE_TTS=true
# Restart service
kubectl rollout restart deployment/conversation-backend
```
````

### Clear Cache in Emergency

```bash
# Use gsutil to clear cache buckets
gsutil -m rm -r gs://project-conversation-cache/**
gsutil -m rm -r gs://project-audio-cache/**
```

```

## Architecture Integration

```

Terraform IaC → GCP Resources → Service Accounts → Application Deployment
↓ ↓ ↓ ↓
Monitoring Setup → Cost Alerts → Security Config → Production Ready

````

## Technical Challenges & Solutions

**Challenge:** Secure secrets management in production
```yaml
# Solution: Kubernetes secrets with rotation
apiVersion: v1
kind: Secret
metadata:
  name: conversation-secrets
type: Opaque
data:
  gemini-credentials: <base64-encoded-service-account-json>
  gcp-service-account: <base64-encoded-json>
````

**Challenge:** Cost monitoring for variable TTS usage

```typescript
// Solution: Real-time cost tracking with alerting
class CostMonitor {
  private dailyCost = 0;
  private readonly MAX_DAILY_COST = 50; // $50 limit

  async trackTTSCall(durationSeconds: number): Promise<void> {
    const cost = durationSeconds * 0.000016;
    this.dailyCost += cost;

    if (this.dailyCost > this.MAX_DAILY_COST) {
      await this.triggerCostAlert();
      throw new Error("Daily TTS cost limit exceeded");
    }
  }
}
```

**Challenge:** Zero-downtime deployment with cache consistency

```bash
# Solution: Blue-green deployment with cache warming
# Deploy new version
kubectl apply -f deployment-v2.yaml
# Wait for health checks
kubectl wait --for=condition=ready pod -l version=v2
# Warm cache with common words
curl -X POST /api/cache/warm -d '{"words":["hello","goodbye","thanks"]}'
# Switch traffic
kubectl patch service conversation-service -p '{"spec":{"selector":{"version":"v2"}}}'
```

## Testing Implementation

- Infrastructure validation with Terraform plan/apply tests
- Production deployment smoke tests
- Cost monitoring simulation and alerting tests
- Security configuration validation
- Disaster recovery procedure testing
