---
purpose: "IaC for the mandarin platform — GCP (buckets, service accounts, IAM, APIs), Neon, Upstash, Vercel; incl. the per-PR preview SA + sandbox bucket (added 2026-08/09)"
status: active
last-verified: 2026-09-04
type: guide
audience: backend
tags: terraform, iac, infrastructure, preview-environments
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
> **Remote state + locking ADOPTED (2026-09-03).** Terraform state lives in GCS
> at `gs://pinyin-pal-tfstate` (bucket **versioning ON**, region
> ASIA-SOUTHEAST1, uniform access) via the `gcs` backend with prefix
> `terraform/state` (declared in `main.tf`), with native state locking. The
> former local `terraform/terraform.tfstate` was migrated to the bucket and is
> kept as a **local safety copy** (may be stale — the bucket is authoritative).
> Owner-local/CI `terraform plan` and CI `terraform apply` read this same backend
> through `terraform init`; the CI SA behind `GCP_TF_SA_KEY` needs object access on
> the bucket (owner grant — see §Plan/apply workflow).
>
> **Versioning & restore:** bucket versioning is ON, so prior state versions are
> recoverable. List generations and restore one:
>
> ```sh
> gcloud storage ls -a gs://pinyin-pal-tfstate/terraform/state/
> gcloud storage cp "gs://pinyin-pal-tfstate/terraform/state/default.tfstate#<generation>" terraform.tfstate
> ```

---

## File layout

| File                       | Purpose                                                                                                                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.tf`                  | Providers, GCS app-data bucket + preview sandbox bucket, public-read IAM, CORS.                                                                                                                                                         |
| `service-accounts.tf`      | Dedicated least-privilege service accounts: `tts-service`, `gemini-service`, `gcs-storage-service`, and `preview-service`.                                                                                                              |
| `iam.tf`                   | Role bindings: Gemini project-level `aiplatform.user`; GCS objectAdmin on the app-data bucket **and** on the preview sandbox bucket only (never project-level storage). Cloud TTS needs **no** IAM role (auth + enabled API + billing). |
| `apis.tf`                  | Enabled GCP APIs (`disable_on_destroy = false` to avoid the 30-day re-enable cooldown).                                                                                                                                                 |
| `neon.tf`                  | Neon Postgres project.                                                                                                                                                                                                                  |
| `upstash.tf`               | Upstash Redis.                                                                                                                                                                                                                          |
| `vercel.tf`                | Vercel project + preview/deployment config.                                                                                                                                                                                             |
| `variables.tf`             | Inputs: `project_id`, `region`, `bucket_name`, `preview_bucket_name`.                                                                                                                                                                   |
| `terraform.tfvars.example` | Copy to `terraform.tfvars` for local values (never commit real values).                                                                                                                                                                 |
| `cors.json`                | Legacy CORS reference (GCS buckets now declare CORS inline in `main.tf`).                                                                                                                                                               |

## Per-PR preview additions — preview SA + sandbox bucket

Deployment + env-isolation hardening (see `apps/backend/railway.toml`,
`.github/workflows/preview.yml`, and the backend `JwtService` env claim):

- **`preview-service` service account** (`service-accounts.tf`) — ONE SA for all
  PR-preview environments. Least-privilege: `roles/storage.objectAdmin` on the
  sandbox bucket **only**, plus `roles/aiplatform.user` at project level
  (`iam.tf`). Cloud TTS needs **no** IAM role — authenticated SA credentials +
  enabled `texttospeech.googleapis.com` (`apis.tf`) + billing only (verified
  2026-09-03).
- **`pinyin-pal-preview-data` sandbox bucket** (`main.tf` + `variables.tf`) —
  TTS audio written by preview builds via the preview SA.
  **Access choice (flagged):** it mirrors the `app_data` bucket's **public-read
  model** (`allUsers objectViewer`) for preview/prod browser-path parity. Note
  `app_data` itself is NON-uniform (`uniform_bucket_level_access = false` from
  legacy per-object ACLs), while this preview bucket keeps uniform access `true`
  — so it mirrors app_data's public-read behavior, not its access-setting
  uniformity. The app serves audio via short-lived signed URLs
  (`AudioService.getSignedUrl`), so the bucket _could_ be private — a private +
  signed-URL-only variant is a possible hardening follow-up but would diverge
  preview behavior from production.

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

Changes are handled by two GitHub Actions workflows in `.github/workflows/`:

- `terraform-plan.yml` — **manual-only** (`workflow_dispatch`; no PR/push
  trigger, since 2026-09-04). Plan review for the release apply is
  **owner-local** — the owner runs `terraform plan` before the release
  `terraform apply`. The automated PR plan gate was removed (stale-GCS-lock +
  provider-refresh hangs added noise without blocking value, and a plan on
  `main` would race the apply for the shared state lock). Dispatch it manually
  whenever an on-CI plan is wanted (e.g. a post-release drift check).
- `terraform-apply.yml` — runs `terraform apply -auto-approve` on **push to
  `main`** when `terraform/**` changed.

Both use the same GitHub secrets: `GCP_TF_SA_KEY` (→ provider env
`GOOGLE_CREDENTIALS`), `NEON_API_TOKEN` (→ provider env `NEON_API_KEY`),
`UPSTASH_API_KEY`, `VERCEL_API_TOKEN`.

> **Remote state (2026-09-03):** `terraform init` in CI reads the shared GCS
> backend (`gs://pinyin-pal-tfstate`, prefix `terraform/state`) — plan/apply no
> longer start from an empty local state. **Owner action:** grant the CI SA
> (the one backing the `GCP_TF_SA_KEY` secret) `roles/storage.objectViewer` on the
> bucket for plan, and `roles/storage.objectAdmin` for apply.

Local workflow:

```sh
cd terraform
terraform init
terraform plan   # review the diff
terraform apply  # owner-run, pre-merge (additive-only)
```

> The preview SA + sandbox bucket additions are additive-only and are applied by
> the owner manually before merge (the `GCP_PREVIEW_SA_KEY` secret is then stored
> in GitHub). Do not run `terraform apply` from a PR.
