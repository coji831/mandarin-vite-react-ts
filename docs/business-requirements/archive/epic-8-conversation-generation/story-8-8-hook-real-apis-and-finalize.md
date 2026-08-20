# Story 8.8: Hook to Real APIs, Deploy, and Finalize

## Description

**As a** developer,
**I want to** have production-ready infrastructure and deployment for conversation features,
**So that** conversation generation can be safely deployed to users with proper monitoring, security, and operational controls.

## Business Value

This story completes the conversation generation epic by establishing production infrastructure, security controls, and operational monitoring. It ensures the system can scale reliably, maintain cost controls, and provide the operational visibility needed for a production service. This enables safe deployment and ongoing maintenance of the conversation features.

## Acceptance Criteria

- [ ] Terraform IaC provisions GCS buckets with 30-day lifecycle rules
- [ ] IAM roles and service accounts configured with least-privilege permissions
- [ ] Staging environment wiring validates end-to-end conversation generation flow
- [ ] Production deployment includes monitoring, logging, and alerting
- [ ] Cost monitoring and alerting prevents TTS cost overruns
- [ ] Security review confirms secrets management and access controls
- [ ] Operational runbooks document troubleshooting and maintenance procedures
- [ ] Performance testing validates system behavior under expected load

## Business Rules

1. All infrastructure must be managed as code through Terraform
2. Service accounts must have minimum required permissions only
3. Secrets must never be committed to version control
4. Cost monitoring must alert on usage anomalies before budget impact
5. Production deployment must include comprehensive observability

## Related Issues

- #8-5 / [**Generator — Text generation & cache (backend)**](./story-8-5-generator-text-cache.md) (Deploys this generator)
- #8-6 / [**Playback Integration — audio cache & on-demand TTS**](./story-8-6-playback-audio-cache-tts.md) (Deploys this audio system)
- #8-7 / [**Local Harness & Validation (CI-friendly)**](./story-8-7-unit-tests-and-harness.md) (Validation framework for deployment)

## Implementation Status

- **Status**: Planned
- **PR**: #[PR-NUMBER]
- **Merge Date**: [Date]
- **Key Commit**: [commit-hash] ([Brief commit description])

## User Journey

1. DevOps engineer reviews Terraform configuration for infrastructure requirements
2. Infrastructure is provisioned using IaC with proper security controls
3. Staging deployment validates conversation features work end-to-end
4. Security review confirms compliance with access control requirements
5. Production deployment includes monitoring and alerting setup
6. Operational team has runbooks for maintenance and troubleshooting
7. System monitors costs and performance in production environment
8. Learners can reliably access conversation features with confidence
