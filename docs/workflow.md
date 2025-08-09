# 📊 Workflow: Epic/Story Lifecycle

```mermaid
flowchart TD
    A[Design Epic/Story] --> B[Plan (Templates)]
    B --> C[Implement (Code & Docs)]
    C --> D[Open Pull Request]
    D --> E[Review & Merge]
    E --> F[Close Issue/Epic]
    F --> G[Update Documentation]
    G --> H[Release/Deploy]
```

## Step-by-Step Actions

**1. Design Epic/Story**

- Define the feature, epic, or story requirements.
- Refer to: [architecture.md](architecture.md), `src/features/<feature>/docs/design.md`
- Update: `architecture.md` (if system-level), feature design docs.

**2. Plan (Templates)**

- Create or update planning docs using templates.
- Refer to: [/docs/issue-templates/README.md](../docs/issue-templates/README.md), [/docs/issue-templates/](../docs/issue-templates/)
- Update: Issue, epic, and story templates as needed.

**3. Implement (Code & Docs)**

- Write code and implementation documentation.
- Refer to: [/docs/issue-implementation/README.md](../docs/issue-implementation/README.md), [/docs/issue-implementation/epic-2-stories/](../docs/issue-implementation/epic-2-stories/), feature docs.
- Update: Implementation files, feature docs, codebase.

**4. Open Pull Request**

- Create a PR using the template.
- Refer to: [/docs/issue-templates/README.md](../docs/issue-templates/README.md) (PR template)
- Update: PR description, link related issues/stories.

**5. Review & Merge**

- Review code and documentation for completeness.
- Refer to: PR template, implementation docs, acceptance criteria in story/epic docs.
- Update: PR comments, implementation docs if needed.

**6. Close Issue/Epic**

- Mark issues/epics as closed/merged.
- Refer to: Implementation docs, status fields in epic/story docs.
- Update: Status fields, cross-links.

**7. Update Documentation**

- Ensure all docs reflect the latest changes.
- Refer to: All related docs (architecture, feature, implementation, templates).
- Update: Documentation checklists in PR, README files, cross-links.

**8. Release/Deploy**

- Deploy the feature and update release notes if needed.
- Refer to: Release documentation, deployment guides.
- Update: Release notes, deployment docs.

---

## Files to Refer, Update, and Use for Review

| Step             | Refer Files                                     | Update Files                                  | Review Files                                    |
| ---------------- | ----------------------------------------------- | --------------------------------------------- | ----------------------------------------------- |
| Design           | architecture.md, feature design.md              | architecture.md, feature design.md            | architecture.md, feature design.md              |
| Plan             | issue-templates/README.md, story templates      | issue-templates, story templates              | issue-templates/README.md, story templates      |
| Implement        | issue-implementation/README.md, story impl docs | issue-implementation, feature docs, code      | issue-implementation/README.md, story impl docs |
| Open PR          | issue-templates/README.md (PR template)         | PR description, related issues/stories        | PR template, PR description                     |
| Review & Merge   | PR template, implementation docs, acceptance    | PR comments, implementation docs              | PR template, implementation docs, acceptance    |
| Close Issue/Epic | implementation docs, status fields              | status fields, cross-links                    | implementation docs, status fields              |
| Update Docs      | all related docs, README files                  | documentation checklists, README, cross-links | all related docs, README files                  |
| Release/Deploy   | release docs, deployment guides                 | release notes, deployment docs                | release docs, deployment guides                 |

---

For more details, see the referenced documentation files above.
