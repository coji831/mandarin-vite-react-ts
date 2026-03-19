# Review Checklist

**Audience:** Developers before committing, code reviewers  
**Last Updated:** January 2026

## Documentation Review

- [ ] All docs use the correct template from `docs/templates`
- [ ] Cross-links between epics, stories, and implementation are present and valid
- [ ] Status fields are up to date
- [ ] All required sections are filled out
- [ ] References to guides and conventions are included

## Code Review

- [ ] Code follows conventions in `conventions.md`
- [ ] Linting and formatting pass
- [ ] Tests are present and passing
- [ ] PR description references correct epic/story
- [ ] Small, focused PRs

## SOLAR-Ralph Review Checks

- [ ] `.ai_ledger.md` reflects the current work package, blockers, and verification state
- [ ] The change has a relevant frontend or backend review pass when the SOLAR overlay is active
- [ ] Security-sensitive flows were reviewed when auth, cookies, JWT, CORS, validation, or secrets were touched
- [ ] A non-pending completion promise exists before a bounded loop closes
- [ ] Memory updates are concise and do not replace required documentation updates
