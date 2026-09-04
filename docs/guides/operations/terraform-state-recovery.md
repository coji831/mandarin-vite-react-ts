---
purpose: Runbook for Terraform state-loss recovery now that state is remote (GCS gs://pinyin-pal-tfstate, versioned) — restore state from the bucket (Path A) or reconstruct by import (Path B), with the plan guard and post-apply GCP_PREVIEW_SA_KEY steps
status: active
last-verified: 2026-09-04
type: guide
audience: backend
tags: epic-24, terraform, iac, state, gcp, preview-environments
---

# Terraform State Recovery — State-Loss Hazard & Runbook (Remote State in GCS)

**Last Updated:** September 4, 2026
**Purpose:** Concise owner runbook for recovering Terraform state if it is ever lost/missing — now that state is **remote** in `gs://pinyin-pal-tfstate` (versioned; backend `gcs`, prefix `terraform/state`; adopted 2026-09-03) rather than a local-only file. Path A = restore from the bucket, Path B = reconstruct by import, Path C = stop. Includes the full 13-resource import table (the old `tts_role` project-IAM never existed live and is removed), the plan guard, and the post-apply `GCP_PREVIEW_SA_KEY` steps.

> **Bottom line:** never blind-`apply` on missing state. Restore it first (Path A — from `gs://pinyin-pal-tfstate` or a local backup), reconstruct it by importing (Path B), or **stop** (Path C). CI `terraform-apply.yml` now reads the shared GCS backend (not an empty local state) — see §1.

> **Status (2026-09-03):** the additive preview changes this runbook describes have been **applied** — `preview-service` SA, `pinyin-pal-preview-data` bucket + its IAM (`preview_public_read`, `preview_storage`, `preview_gemini_role`), and the `VITE_API_URL` env var are live and Terraform-managed; `GCP_PREVIEW_SA_KEY` is set. `google_project_iam_member.tts_role` was removed from `iam.tf` — it bound `roles/cloudtexttospeech.user`, a role that does not exist in GCP's catalog (Cloud TTS needs no IAM role). The import table in §4 is the **13 live prod resources** (not 14). **Remote state + locking ADOPTED (2026-09-03):** Terraform now uses the GCS backend (`gs://pinyin-pal-tfstate`, versioned, prefix `terraform/state`, declared in `main.tf`); the old “local / no backend / empty CI state” framing in §1 is **historical**. CI plan/apply reads the same GCS backend.

> **Status (2026-09-04, SIMPLIFIED):** `terraform/vercel.tf` now declares the **single Production
> `VITE_API_URL`** (`vercel_project_environment_variable.frontend_api_url`). The per-PR Vercel
> targeting was removed the same day: `preview.yml` no longer has a `vercel-preview` job or a
> Vercel cleanup step, and the project-wide **Preview-scope fallback** var
> `frontend_api_url_preview_fallback` was **deleted from config**. Config now targets **19
> resources** (13 prod + 5 preview + 1 env var). NOTE: the fallback var is still **live in
> state/Vercel** (applied earlier 2026-09-04) until the owner's next `terraform apply` destroys
> it — state then drops to 19. Previews remain **Vercel-native** (auto-built per branch;
> `ignore_command` stays removed). Preview-scope `VITE_API_URL` is owner-set manually in the
> Vercel dashboard when testing the FE preview against a manually-deployed Railway `pr-<n>`
> backend — see `deployment.md`.

---

## Table of Contents

1. [The Hazard — Local State, Empty Working Copy](#1-the-hazard--local-state-empty-working-copy)
2. [Preflight — Env & Credentials](#2-preflight--env--credentials)
3. [Path A — Recover the Real State (Recommended)](#3-path-a--recover-the-real-state-recommended)
4. [Path B — Reconstruct by Importing (Fallback)](#4-path-b--reconstruct-by-importing-fallback)
5. [Path C — Never Blind-Apply; the Plan Guard](#5-path-c--never-blind-apply-the-plan-guard)
6. [After Apply — Verify Preview + Mint `GCP_PREVIEW_SA_KEY`](#6-after-apply--verify-preview--mint-gcp_preview_sa_key)
7. [Cross-References](#7-cross-references)

---

## 1. The Hazard — State Loss (the local-only / empty-CI-state era is historical)

> **HISTORICAL — RESOLVED (2026-09-03):** the empty-local-state hazard below is
> what motivated this runbook and is **no longer the current state**. Since
> 2026-09-03 Terraform state is **remote** — `gs://pinyin-pal-tfstate`
> (versioned, prefix `terraform/state`, backend `gcs` in `main.tf`); the former
> local `terraform/terraform.tfstate` was migrated to the bucket and is kept
> only as a **local safety copy**. Treat the **bucket** as the single source of
> truth: **protect it** (versioning ON; never delete) and keep applying
> **plan-guarded only** (`terraform plan` review before any `terraform apply`).
> The Path A/B/C runbook guidance in §3–§5 now applies to **any future
> state-loss scenario** — Path A's first stop is the GCS bucket.

- **~~Terraform state is LOCAL~~ — HISTORICAL.** Before 2026-09-03, `terraform/` had **no `backend {}` block** and state lived at the local path `terraform/terraform.tfstate`. **Now (2026-09-03):** state is **remote** in `gs://pinyin-pal-tfstate` (versioned, prefix `terraform/state`) via the `gcs` backend declared in `main.tf`; the local `terraform.tfstate` remains only as a **safety copy**.
- **~~This working copy has NO state~~ — RESOLVED.** During the original hazard (pre-2026-09-03 apply) there was no `terraform/terraform.tfstate*` present (`terraform state list` → `No state file was found!`). **Now:** the state is **applied/live in GCS** — config targets **19 resources** (13 prod + 5 preview + 1 env var, the Production `VITE_API_URL`); the Preview-scope fallback var (applied earlier 2026-09-04) remains live until the owner's next apply destroys it (see the status callout). Must be **protected** (bucket versioning ON; never delete) + **plan-guarded**. If it is ever lost again, follow Path A/B/C below.
- **The danger of a blind `apply`** (if state is ever lost again): on missing state, Terraform tries to _create_ every live prod resource (3 service accounts, the app-data bucket + IAM, project IAM, 3 enabled APIs, Neon, Upstash, Vercel). The Google provider errors with `Service account already exists` / `Bucket already exists`; Neon/Vercel conflict similarly. It will **not delete anything**, but it fails loudly and can leave a half-written state.
- **~~CI hazard — empty local state~~ — HISTORICAL.** Both `.github/workflows/terraform-plan.yml` and `.github/workflows/terraform-apply.yml` used to run `terraform init` with **no backend/remote state** → every CI run started from an empty local state. **Now (2026-09-03):** with the `gcs` backend in `main.tf`, CI `terraform init` reads the **shared GCS backend** — subject to the CI SA being granted bucket access (owner action; see `terraform/README.md` §Plan/apply workflow).

### What the plan SHOULD have shown on the working tree (pre-2026-09-03 apply — now applied/live)

The working tree had real Terraform edits that appeared in `terraform plan` **before** the 2026-09-03 apply; all are now **applied and live**. A current `terraform plan` should show **no creates of prod/preview resources** — at most in-place/metadata-only drift (e.g. the preview SA `description` text corrected 2026-09-03):

| Change                                                 | Type                | Detail                                                                                                                                                                                                                                                |
| ------------------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vercel_project.frontend`                              | **In-place update** | **HISTORICAL (2026-09-03):** added `ignore_command` (previews disabled — only `main` builds) + `git_repository.production_branch = "main"`. **2026-09-04:** the reverse — `ignore_command` removed so previews are Vercel-native (see status callout) |
| `vercel_project_environment_variable.frontend_api_url` | **New resource**    | `VITE_API_URL`, Production target, value `https://mandarin-vite-react-ts-production.up.railway.app`, `sensitive = false`                                                                                                                              |
| `main.tf`                                              | Comment-only        | No resource change                                                                                                                                                                                                                                    |

> **Pre-check:** if a `VITE_API_URL` env var already exists on the Vercel project **with Production target** (e.g. auto-synced by the old "Railway → Vercel integration" described in the IaC runbook §5.2), the Terraform **create** will conflict. Before apply: Vercel Dashboard → `mandarin-vite-react-ts` → Settings → Environment Variables → if `VITE_API_URL` (Production) exists, **delete it** — the new Terraform-managed var recreates it. This is the **corrected reality**: the **Production `VITE_API_URL` only** is Terraform-managed in `vercel.tf` (the single TF-managed VITE_API_URL); previews are **Vercel-native** (auto-built per branch; no per-PR automation — removed 2026-09-04). The Railway→Vercel integration is real and connected (config `icfg_e97MW1YjJIhYvIDnMb6y4RkW`, 2026-07-04) and syncs **18 backend env rows** that the app does NOT read (the backend reads Railway) — **PENDING OWNER CLEANUP: disconnect the integration + delete those rows** (they are not Terraform-managed and do not conflict with `terraform apply`).

---

## 2. Preflight — Env & Credentials

> **HISTORICAL — RESOLVED (2026-09-03):** this preflight was written for the
> empty-state recovery run. The env/credential setup below is unchanged and
> remains valid for any future recovery or owner-run apply; the state itself now
> exists and is applied/live (§1).

`terraform.tfvars` is absent (only `.example`), so supply vars/credentials via env. `region`, `bucket_name`, `preview_bucket_name` all have defaults in `variables.tf` — no need to set them.

```powershell
# PowerShell
cd C:\CodeProjects\Personal\mandarin-vite-react-ts\terraform
$env:TF_VAR_project_id   = "pinyin-pal-831"
$env:NEON_API_KEY        = "<Neon console → Account → API Keys>"       # {OWNER: value}
$env:UPSTASH_API_KEY     = "<Upstash console → API Keys>"              # {OWNER: value}
$env:VERCEL_API_TOKEN    = "<vercel.com/account/tokens>"               # {OWNER: value}
# GCP creds — either:
gcloud auth application-default login
# ...or set the one-line SA key JSON:
$env:GOOGLE_CREDENTIALS  = "<one-line GCP SA key JSON>"                # {OWNER: value}
```

```bash
# Git Bash (equivalent)
cd /c/CodeProjects/Personal/mandarin-vite-react-ts/terraform
export TF_VAR_project_id=pinyin-pal-831
export NEON_API_KEY=... UPSTASH_API_KEY=... VERCEL_API_TOKEN=...
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/adc.json   # optional if gcloud ADC used
```

---

## 3. Path A — Recover the Real State (Recommended)

### A1. Where the real state most plausibly lives

State is **remote (2026-09-03+):** `gs://pinyin-pal-tfstate/terraform/state/default.tfstate` — bucket **versioning is ON**, so every apply is a recoverable prior version. Check, in order:

1. **The GCS bucket** (primary source of truth) — `gcloud storage ls gs://pinyin-pal-tfstate/terraform/state/`. If the live state object is missing/corrupt, restore a prior **version** from the bucket (see `terraform/README.md` for the `gcloud storage` restore command), then re-init.
2. **The local safety copy** — `terraform/terraform.tfstate` + `.backup` (kept after the 2026-09-03 migration; gitignored). May be **stale** vs. GCS — treat the bucket as authoritative.
3. **Another checkout of this repo** on this or another machine (state is gitignored — look for a second clone / `terraform/` folder) — only relevant for pre-remote-state (pre-2026-09-03) recovery.
4. **Another teammate's machine / an archive** of the original provisioning machine (this config was first applied ~2026-07-04 per the IaC runbook).

Recovery commands (owner):

```powershell
# Remote-state era — .terraform/terraform.tfstate is just a backend-pointer stub.
# If it's missing, re-init to re-read the gcs backend (needs GCP auth as in §2):
cd C:\CodeProjects\Personal\mandarin-vite-react-ts\terraform
terraform init          # re-reads the gcs backend
terraform state list    # confirms state is pulled from the bucket
```

`terraform state list` should show the live resources — the config target is **19** (13 prod + 5 preview + the single Production `VITE_API_URL` env var); the Preview-scope fallback var is present only until the next apply destroys it (see the §1 status callout). If the **bucket** state itself is lost, restore a prior bucket **version** (versioning ON) or fall back to **Path B** import (§4) — never blind-apply on missing state (Path C).

### A2. Single-command flow once state is recovered

```powershell
cd C:\CodeProjects\Personal\mandarin-vite-react-ts\terraform
terraform plan   # remote state — MUST be a no-op (0 add / 0 destroy; at most in-place metadata drift)
terraform apply -auto-approve
```

The plan must **not** list any resource as `+ create` or `- destroy`. If it does → **STOP** — the recovered state isn't the one that built prod (see Path C).

---

## 4. Path B — Reconstruct by Importing (Fallback)

**Only if Path A fails.** Run everything from `terraform/`, with env set as in §2. All `terraform import` commands are **idempotent per address** (skip ones already in state; on a fresh empty state run all 13 prod imports below). **Never `terraform destroy`.** Importing project-level/bucket IAM just binds existing bindings into state — safe, and the config declares them.

### B1. Full import table — address | import ID | source of ID

| #   | Resource address (from `.tf`)                  | Import ID (exact)                                                                                                     | Source of ID                                                                                                                                                                                                                                                                                                              |
| --- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `google_service_account.tts`                   | `projects/pinyin-pal-831/serviceAccounts/tts-service@pinyin-pal-831.iam.gserviceaccount.com`                          | `service-accounts.tf`                                                                                                                                                                                                                                                                                                     |
| 2   | `google_service_account.gemini`                | `projects/pinyin-pal-831/serviceAccounts/gemini-service@pinyin-pal-831.iam.gserviceaccount.com`                       | `service-accounts.tf`                                                                                                                                                                                                                                                                                                     |
| 3   | `google_service_account.gcs`                   | `projects/pinyin-pal-831/serviceAccounts/gcs-storage-service@pinyin-pal-831.iam.gserviceaccount.com`                  | `service-accounts.tf`                                                                                                                                                                                                                                                                                                     |
| 4   | `google_storage_bucket.app_data`               | `pinyin-pal-data`                                                                                                     | `main.tf` + `variables.tf`                                                                                                                                                                                                                                                                                                |
| 5   | `google_storage_bucket_iam_member.public_read` | `pinyin-pal-data roles/storage.objectViewer allUsers`                                                                 | `main.tf`                                                                                                                                                                                                                                                                                                                 |
| 6   | `google_storage_bucket_iam_member.gcs_storage` | `pinyin-pal-data roles/storage.objectAdmin serviceAccount:gcs-storage-service@pinyin-pal-831.iam.gserviceaccount.com` | `iam.tf`                                                                                                                                                                                                                                                                                                                  |
| 7   | `google_project_iam_member.gemini_role`        | `pinyin-pal-831 roles/aiplatform.user serviceAccount:gemini-service@pinyin-pal-831.iam.gserviceaccount.com`           | `iam.tf`                                                                                                                                                                                                                                                                                                                  |
| 8   | `google_project_service.tts_api`               | `pinyin-pal-831/texttospeech.googleapis.com`                                                                          | `apis.tf`                                                                                                                                                                                                                                                                                                                 |
| 9   | `google_project_service.gemini_api`            | `pinyin-pal-831/generativelanguage.googleapis.com`                                                                    | `apis.tf`                                                                                                                                                                                                                                                                                                                 |
| 10  | `google_project_service.storage_api`           | `pinyin-pal-831/storage.googleapis.com`                                                                               | `apis.tf`                                                                                                                                                                                                                                                                                                                 |
| 11  | `neon_project.main`                            | `withered-king-06089521`                                                                                              | `neon.tf`                                                                                                                                                                                                                                                                                                                 |
| 12  | `upstash_redis_database.cache`                 | `{OWNER: fetch}` — the **database UUID**, NOT the endpoint hostname                                                   | Upstash console → `pinyin-pal-cache` → the URL bar is `console.upstash.com/redis/<uuid>`; or `curl -H "Authorization: Bearer $UPSTASH_API_KEY" https://api.upstash.com/v2/redis/databases` → read `.database_id`. The repo only records the endpoint `artistic-cattle-95444.upstash.io` — the UUID is **not in the repo** |
| 13  | `vercel_project.frontend`                      | `prj_N3G3440X8BvbV86E5E29njYPEF1x`                                                                                    | `vercel.tf` header comment                                                                                                                                                                                                                                                                                                |

> `google_project_iam_member.tts_role` (old row 7) is **removed** — Cloud TTS needs no IAM role
> (`roles/cloudtexttospeech.user` does not exist in GCP's catalog), so there is no prod TTS
> project-IAM binding to import.

> **Preview + env-var resources:** the `vercel_project_environment_variable.frontend_api_url` and the preview resources (SA `preview`, bucket `preview_data`, their 3 IAM members — there is no preview TTS project-IAM) are **live since the 2026-09-03 apply**. If you are rebuilding state from scratch now, import them too (addresses in B3); on a pre-apply working copy they are the “to-create” set (B4).

### B2. Copy-paste import block

```powershell
cd C:\CodeProjects\Personal\mandarin-vite-react-ts\terraform

terraform import "google_service_account.tts"      "projects/pinyin-pal-831/serviceAccounts/tts-service@pinyin-pal-831.iam.gserviceaccount.com"
terraform import "google_service_account.gemini"   "projects/pinyin-pal-831/serviceAccounts/gemini-service@pinyin-pal-831.iam.gserviceaccount.com"
terraform import "google_service_account.gcs"      "projects/pinyin-pal-831/serviceAccounts/gcs-storage-service@pinyin-pal-831.iam.gserviceaccount.com"
terraform import "google_storage_bucket.app_data"  "pinyin-pal-data"
terraform import "google_storage_bucket_iam_member.public_read" "pinyin-pal-data roles/storage.objectViewer allUsers"
terraform import "google_storage_bucket_iam_member.gcs_storage" "pinyin-pal-data roles/storage.objectAdmin serviceAccount:gcs-storage-service@pinyin-pal-831.iam.gserviceaccount.com"
terraform import "google_project_iam_member.gemini_role" "pinyin-pal-831 roles/aiplatform.user serviceAccount:gemini-service@pinyin-pal-831.iam.gserviceaccount.com"
terraform import "google_project_service.tts_api"    "pinyin-pal-831/texttospeech.googleapis.com"
terraform import "google_project_service.gemini_api" "pinyin-pal-831/generativelanguage.googleapis.com"
terraform import "google_project_service.storage_api" "pinyin-pal-831/storage.googleapis.com"
terraform import "neon_project.main"                "withered-king-06089521"
terraform import "upstash_redis_database.cache"     "<OWNER: database UUID>"
terraform import "vercel_project.frontend"          "prj_N3G3440X8BvbV86E5E29njYPEF1x"
```

(Quotes are harmless in both PowerShell and Git Bash; keep them for the space-containing IDs.)

### B3. Pre-apply guard — check the preview SA/bucket aren't already live

```powershell
gcloud iam service-accounts list --project pinyin-pal-831
gcloud storage buckets list --project pinyin-pal-831
```

If `preview-service` or `pinyin-pal-preview-data` already exist, import them too (addresses below) so apply doesn't fail:

- `google_service_account.preview` → `projects/pinyin-pal-831/serviceAccounts/preview-service@pinyin-pal-831.iam.gserviceaccount.com`
- `google_storage_bucket.preview_data` → `pinyin-pal-preview-data`
- `google_storage_bucket_iam_member.preview_public_read` → `pinyin-pal-preview-data roles/storage.objectViewer allUsers`
- `google_storage_bucket_iam_member.preview_storage` → `pinyin-pal-preview-data roles/storage.objectAdmin serviceAccount:preview-service@pinyin-pal-831.iam.gserviceaccount.com`
- `google_project_iam_member.preview_gemini_role` → `pinyin-pal-831 roles/aiplatform.user serviceAccount:preview-service@pinyin-pal-831.iam.gserviceaccount.com`

> No `preview_tts_role` — Cloud TTS needs no IAM role, so the preview SA gets no project-level TTS binding.

### B4. Plan, then apply

```powershell
terraform plan
```

The **only** additions must be:

- **5 preview creates:** `google_service_account.preview`, `google_storage_bucket.preview_data`, `google_storage_bucket_iam_member.preview_public_read`, `google_storage_bucket_iam_member.preview_storage`, `google_project_iam_member.preview_gemini_role` (no TTS project-IAM — Cloud TTS needs no IAM role)
- `vercel_project_environment_variable.frontend_api_url` (create)
- `vercel_project.frontend` (in-place update — `ignore_command` + `production_branch`)

> **B4 is the 2026-09-03 apply recipe (already applied/live).** A later **2026-09-04 apply** created
> `vercel_project_environment_variable.frontend_api_url_preview_fallback` (Preview target, applied
> live — Vercel env-var id `bMSagB3QD7aeIYc1`) and removed `ignore_command` from `vercel_project.frontend`.
> **Simplified 2026-09-04:** `frontend_api_url_preview_fallback` was **removed from `vercel.tf`** — the
> owner's next `terraform apply` **destroys** the live fallback var (config back to the single
> Production `frontend_api_url`; 19 resources). The Production var is untouched.

If any **imported** address shows as `+ create`, the import failed — fix it before applying. If the plan shows an **update** on `neon_project.main` / `upstash_redis_database.cache` / SAs, that's config-vs-live drift (e.g. `history_retention_seconds`, `eviction = true`) — review and accept only intended diffs. Then:

```powershell
terraform apply -auto-approve
```

**Caution notes:** import requires the resource to exist in the cloud — each command fails cleanly if it doesn't (then check Path C). Resources created out-of-band and never TF-managed are correctly adopted by import. Adding `lifecycle { prevent_destroy }` to the buckets/SAs is a good follow-up hardening (not required for this apply). **Never `terraform destroy`.**

---

## 5. Path C — Never Blind-Apply; the Plan Guard

A **blind `apply` on empty state is the danger scenario** (§1). Mandatory rule:

1. **Run `terraform plan` FIRST on empty state.**
2. If the plan shows it wants to **create** live prod resources (not just the 5 preview + Vercel additions), **STOP** and go back to Path A or Path B.
3. The only safe way to adopt _everything_ on empty state is Path B's import (all 13 prod + any live preview/env-var resources) — there is no shortcut.
4. If you truly cannot import a specific resource and it is not Terraform-managed, that resource must be excluded from the config (or imported after a manual out-of-band review) — do not apply around it.

---

## 6. After Apply — Verify Preview + Mint `GCP_PREVIEW_SA_KEY`

### 6.1 Confirm the preview SA + sandbox bucket exist

```powershell
cd C:\CodeProjects\Personal\mandarin-vite-react-ts\terraform
terraform state list | Select-String "preview"
gcloud iam service-accounts list --project pinyin-pal-831 | Select-String "preview"
gcloud storage buckets list --project pinyin-pal-831 | Select-String "preview-data"
```

```bash
# Git Bash equivalents
cd /c/CodeProjects/Personal/mandarin-vite-react-ts/terraform
terraform state list | grep preview
gcloud iam service-accounts list --project pinyin-pal-831 | grep preview
gcloud storage buckets list --project pinyin-pal-831 | grep preview-data
```

Expected: `google_service_account.preview` / `google_storage_bucket.preview_data` + bucket-IAM in state; `preview-service@pinyin-pal-831...` SA in gcloud; `pinyin-pal-preview-data` bucket in gcloud.

### 6.2 Mint the key + set the GitHub secret

```powershell
cd C:\CodeProjects\Personal\mandarin-vite-react-ts
gcloud iam service-accounts keys create keys/preview-service-key.json `
  --iam-account=preview-service@pinyin-pal-831.iam.gserviceaccount.com

# Emit the ONE-LINE JSON (Windows-safe — prints a single line, no newlines):
jq -c . keys/preview-service-key.json
```

Copy that **entire one-line JSON** (it is long — capture it all) into:
**GitHub → repo `coji831/mandarin-vite-react-ts` → Settings → Secrets and variables → Actions → New repository secret**

- **Name:** `GCP_PREVIEW_SA_KEY`
- **Value:** paste the one-line JSON → **Add secret**

`keys/` is gitignored (root `.gitignore`: `keys/`, `*.tfstate`, `*.tfstate.backup`) — the key is never committed.

### 6.3 Re-verify the `preview.yml` secrets/vars checklist

`preview.yml` consumes (`secrets.*` / `vars.*`):

| Name                         | Type     | Required by workflow                                 | Status to confirm                                                       |
| ---------------------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `NEON_API_TOKEN`             | Secret   | yes (`create-branch-action` + cleanup `neonctl`)     | set                                                                     |
| `RAILWAY_API_TOKEN`          | Secret   | yes (GraphQL upserts + smoke)                        | set                                                                     |
| `NEON_PROJECT_ID`            | Variable | yes                                                  | set — `withered-king-06089521`                                          |
| `RAILWAY_PROJECT_ID`         | Variable | yes                                                  | set — `83025af1-4232-4ce1-97b9-ae25bf2d8ae2`                            |
| `RAILWAY_BACKEND_SERVICE_ID` | Variable | yes                                                  | set (`{OWNER: fetch}` — Railway → Service → Settings)                   |
| `GCP_PREVIEW_SA_KEY`         | Secret   | yes (mapped to all three `*_CREDENTIALS_RAW` per-PR) | **now set (this runbook)**                                              |
| `GCP_PREVIEW_BUCKET_NAME`    | Variable | **optional**                                         | defaults to `pinyin-pal-preview-data` — only set for a non-default name |

After the secret is set, open a PR and confirm the `Preview Environment` job provisions a Neon `preview/<branch>` branch and upserts Railway PR env vars without auth/GCS errors.

---

## 7. Cross-References

- **Secret/key rotation (the T+0 follow-up):** [`secret-rotation.md`](./secret-rotation.md) (GitHub master table, T+0 rotation decisions, fixed identifiers)
- **Env isolation / risk table:** [`env-isolation.md`](./env-isolation.md) (R1–R6 + the 7 owner verification items)
- **Deployment:** [`deployment.md`](./deployment.md) (deploy, health/smoke verification, §Rollback)
- **IaC onboarding:** [`../iac-onboarding.html`](../iac-onboarding.html) (full infra walkthrough; §4 secret rotation `#secret-rotation`; documents the 2026-09-04 simplification — Vercel = single TF Production `VITE_API_URL`, previews Vercel-native, per-PR Vercel automation removed)
- **IaC Phase-1 runbook:** [`../../knowledge-base/infrastructure/iac-phase1-migration-runbook.md`](../../knowledge-base/infrastructure/iac-phase1-migration-runbook.md) (inventory §2, GitHub table §4.3, disaster recovery §8 — note its §5.2 "Railway → Vercel auto-syncs `VITE_API_URL`" narrative is **superseded** — the integration is real but does not sync `VITE_API_URL`, which is Terraform-managed in `vercel.tf` as a **single Production var**; Vercel previews are **Vercel-native** auto-builds, 2026-09-04)
- **Terraform:** [`../../../terraform/README.md`](../../../terraform/README.md) (file layout, additive preview SA + sandbox bucket, **remote-state + locking adopted 2026-09-03** — GCS bucket `gs://pinyin-pal-tfstate`, versioned)
- **Workflow truth source:** [`../../../.github/workflows/preview.yml`](../../../.github/workflows/preview.yml) (per-PR env upserts that consume `GCP_PREVIEW_SA_KEY`)
