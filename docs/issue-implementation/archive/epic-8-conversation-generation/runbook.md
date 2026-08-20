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

### Clear Cache in Emergency

```bash
# Use gsutil to clear cache buckets
gsutil -m rm -r gs://project-conversation-cache/**
gsutil -m rm -r gs://project-audio-cache/**
```
