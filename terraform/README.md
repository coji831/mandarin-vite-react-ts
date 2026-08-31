---
purpose: "IaC for the mandarin platform — GCP (buckets, service accounts, IAM, APIs), Neon, Upstash, Vercel; incl. the additive preview SA + sandbox bucket (Story 24-17)"
status: active
last-verified: 2026-08-25
type: guide
audience: backend
tags: epic-24, terraform, iac, infrastructure, preview-environments
---

# Terraform — Infrastructure as Code

Manages the GCP + SaaS infrastructure for the mandarin-vite-react-ts platform.

- **GCP** (buckets, service accounts, IAM, APIs) — `main.tf`, `service-accounts.tf`, `iam.tf`, `apis.tf`
- **Neon** (Postgres) — `neon.tf`
- **Upstash** (Redis) — `upstash.tf`
- **Vercel** (frontend SPA/CDN) — `vercel.tf`

> Backend (Railway) has no official/production-grade Terraform provider (a
> community wrapper, `terraform-community-providers/railway`, exists but is not
> adopted) and is not in this directory — see `docs/architecture.md` for the
> full topology (Option B: Best-of-Breed).
>
> Terraform state is local today; a GCS remote-state + locking migration is
> planned post-Epic-24.

---

## File layout

| File                       | Purpose                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.tf`                  | Providers, GCS app-data bucket + preview sandbox bucket, public-read IAM, CORS.                                                                                 |
| `service-accounts.tf`      | Dedicated least-privilege service accounts: `tts-service`, `gemini-service`, `gcs-storage-service`, and `preview-service` (Story 24-17).                        |
| `iam.tf`                   | Role bindings: TTS/Gemini project-level users; GCS objectAdmin on the app-data bucket **and** on the preview sandbox bucket only (never project-level storage). |
| `apis.tf`                  | Enabled GCP APIs (`disable_on_destroy = false` to avoid the 30-day re-enable cooldown).                                                                         |
| `neon.tf`                  | Neon Postgres project.                                                                                                                                          |
| `upstash.tf`               | Upstash Redis.                                                                                                                                                  |
| `vercel.tf`                | Vercel project + preview/deployment config.                                                                                                                     |
| `variables.tf`             | Inputs: `project_id`, `region`, `bucket_name`, `preview_bucket_name`.                                                                                           |
| `terraform.tfvars.example` | Copy to `terraform.tfvars` for local values (never commit real values).                                                                                         |
| `cors.json`                | Legacy CORS reference (GCS buckets now declare CORS inline in `main.tf`).                                                                                       |

## Story 24-17 additions — PR preview environments

Deployment + env-isolation hardening (see `apps/backend/railway.toml`,
`.github/workflows/preview.yml`, and the backend `JwtService` env claim):

- **`preview-service` service account** (`service-accounts.tf`) — ONE SA for all
  PR-preview environments. Least-privilege: `roles/storage.objectAdmin` on the
  sandbox bucket **only**, plus `roles/cloudtexttospeech.user` +
  `roles/aiplatform.user` at project level (`iam.tf`).
- **`pinyin-pal-preview-data` sandbox bucket** (`main.tf` + `variables.tf`) —
  TTS audio written by preview builds via the preview SA.
  **Access choice (flagged):** it mirrors the `app_data` bucket config
  (uniform bucket-level access + public-read `allUsers objectViewer`) for
  byte-for-byte preview/prod parity. The app serves audio via short-lived
  signed URLs (`AudioService.getSignedUrl`), so the bucket _could_ be private —
  a private + signed-URL-only variant is a possible hardening follow-up but
  would diverge preview behavior from production.

## Service-account keys

Keys are managed **outside Terraform** (Terraform only creates the SAs, not
their keys). Generate each key manually with `gcloud` and store the JSON as the
matching GitHub secret / env var:

```sh
gcloud iam service-accounts keys create keys/<name>.json \
  --iam-account=<name>@<project>.iam.gserviceaccount.com
```

- `keys/*.json` is gitignored (see root `.gitignore`) — never commit SA keys.
- Production: `tts-service` → `GOOGLE_TTS_CREDENTIALS_RAW`, `gemini-service` →
  `GEMINI_API_CREDENTIALS_RAW`, `gcs-storage-service` → `GCS_CREDENTIALS_RAW`
  (env vars on Railway).
- Preview: `preview-service` → **one** GitHub secret `GCP_PREVIEW_SA_KEY`,
  consumed by `.github/workflows/preview.yml` and mapped to all three
  `*_CREDENTIALS_RAW` vars on the Railway PR environment.

## Plan / apply workflow

Changes are gated by two GitHub Actions workflows in `.github/workflows/`:

- `terraform-plan.yml` — runs `terraform plan` on **PRs** that touch
  `terraform/**` (preview of expected infra changes, no apply).
- `terraform-apply.yml` — runs `terraform apply -auto-approve` on **push to
  `main`** when `terraform/**` changed.

Both use the same secrets: `GCP_SA_KEY` (GOOGLE_CREDENTIALS), `NEON_API_KEY`,
`UPSTASH_API_KEY`, `VERCEL_TOKEN`.

Local workflow:

```sh
cd terraform
terraform init
terraform plan   # review the diff
terraform apply  # owner-run, pre-merge for the 24-17 additions
```

> Story 24-17 note: the preview SA + sandbox bucket are additive-only and are
> applied by the owner manually before merge (the `GCP_PREVIEW_SA_KEY` secret is
> then stored in GitHub). Do not run `terraform apply` from a PR.
