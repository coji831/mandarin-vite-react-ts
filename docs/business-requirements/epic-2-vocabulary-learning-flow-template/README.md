# Epic 2: Vocabulary Learning User Flow

## Epic Summary

**Goal:** Extend the current application to include a new user flow between the Mandarin root page and the flashcard page, enabling users to select a vocabulary list, commit to a daily word goal, divide the list into sections, study a chosen section via flashcards, and track progress between sessions.

**Status:** Completed

**Last Update:** August 10, 2025

## Background

The current Mandarin learning application has a flashcard page and a root page, but lacks a structured flow between them. Users need a way to manage their vocabulary learning more effectively, especially when dealing with large vocabulary lists.

Language learners have expressed frustration with:

- Being overwhelmed by large vocabulary lists
- Difficulty maintaining consistent study habits
- Lack of progress tracking across study sessions
- No way to organize vocabulary by difficulty or priority

This epic will address these pain points by providing:

- A guided learning flow with clear steps
- Ability to break down large lists into manageable sections
- Daily commitment setting to encourage regular practice
- Progress tracking to motivate continued learning

The implementation will enable users to:

- Select from multiple large vocabulary lists (~500 words each)
- Set a daily word commitment
- Divide the selected list into manageable sections
- Choose a section to study on the flashcard page
- Track learning progress efficiently
- Back up and restore their learning progress

## Business Metrics

- **User Engagement**: Increase daily active users by 30%
- **Learning Efficiency**: Users complete 50% more words per session compared to the previous system
- **Session Duration**: Increase average session duration from 5 to 8 minutes
- **Retention**: Improve 7-day retention rate by 25%
- **Completion Rate**: 40% of users who start a vocabulary list should complete at least one section

## Implementation Timeline

- **Phase 1 (Sprint 1-2)**: Vocabulary list selection and daily commitment setting
- **Phase 2 (Sprint 3-4)**: List sectioning and section selection functionality
- **Phase 3 (Sprint 5-6)**: Flashcard page integration and progress tracking
- **Phase 4 (Sprint 7)**: Import/export functionality and final testing

## Acceptance Criteria

- [ ] Users can select from at least 3 different vocabulary lists
- [ ] Users can set a daily word commitment between 5-50 words
- [ ] Lists can be divided into at least 3 different section sizes
- [ ] Progress is correctly tracked and persists between sessions
- [ ] User progress data is correctly associated with the appropriate vocabulary words
- [ ] Import/export functionality allows users to back up their progress data

## Implementation Plan

1. Create vocabulary list selection screen with preview capability
2. Build commitment setting interface with recommendations based on list size
3. Develop a system for dividing lists into sections based on user preferences
4. Update flashcard page to work with specific sections rather than entire lists
5. Implement user progress tracking that persists between sessions
6. Create import/export functionality for progress data

### Components

The user flow will include:

1. **Vocabulary List Selection**: Browse and select from multiple vocabulary lists
2. **Daily Commitment Setting**: Set daily learning goals with completion timeline estimation
3. **List Division Tool**: Divide lists into manageable sections based on preferences
4. **Section Selection**: Choose which section to study and track progress
5. **Enhanced Flashcard Page**: Study selected sections with progress tracking

### Risk Considerations

- User testing may reveal usability issues with the multi-step flow
- Large vocabulary lists may cause accessibility issues for some users
- Data storage constraints may limit the number of lists a user can track
- Users may find the section division approach confusing initially

## Stakeholders

- **Product Owner**: Jessica Chen - Responsible for feature prioritization and acceptance
- **UX Designer**: Michael Rodriguez - Designed the user flow and interaction patterns
- **Lead Developer**: Sarah Johnson - Technical oversight and architecture decisions
- **QA Lead**: David Thompson - Test planning and quality assurance
- **Language Education Consultant**: Dr. Li Wei - Subject matter expert for learning methodology

## User Stories

This epic consists of the following user stories:

1. #3 / [**Select Vocabulary List from Mandarin Page**](./story-2-1-select-vocabulary-list-template.md)

   - As a language learner, I want to select from different vocabulary lists, so that I can focus on words relevant to my learning goals.

2. #4 / [**Set Daily Commitment**](./story-2-2-set-daily-commitment-template.md)

   - As a language learner, I want to set a daily word commitment, so that I can pace my learning and maintain consistent study habits.

3. #5 / [**Divide List into Sections**](./story-2-3-divide-list-into-sections-template.md)

   - As a language learner, I want to divide large vocabulary lists into smaller sections, so that I can study in manageable chunks.

4. #6 / [**Select Section for Learning**](./story-2-4-select-section-for-learning-template.md)

   - As a language learner, I want to choose which section to study, so that I can prioritize certain words or review specific sections.

5. #7 / [**Update Flashcard Page**](./story-2-5-update-flashcard-page-template.md)

   - As a language learner, I want the flashcard page to show only the selected section, so that I can focus on my current learning goals.

6. #8 / [**Manage Tracking Data**](./story-2-6-manage-tracking-data-template.md)

   - As a language learner, I want my progress to be saved automatically, so that I can continue where I left off in future sessions.

7. #9 / [**Export/Import Tracking Data**](./story-2-7-export-import-tracking-data-template.md)

   - As a language learner, I want to export and import my progress data, so that I can back up my learning history or transfer it between devices.

## Story Breakdown Logic

This epic has been divided into 7 distinct stories to facilitate iterative development and allow for logical feature delivery:

1. **List Selection** - Foundational feature needed first to establish the vocabulary source
2. **Daily Commitment** - Enhances user motivation and sets up the learning pace
3. **Sectioning Logic** - Core feature that enables manageable learning chunks
4. **Section Selection** - Builds on sectioning to enable focused learning
5. **Flashcard Integration** - Connects the new flow to the existing flashcard system
6. **Progress Tracking** - Adds persistence layer to maintain user progress
7. **Data Import/Export** - Final enhancement for data portability

This breakdown allows for incremental delivery with each story building on previous ones.

## Technical Context

This epic is connected to Epic 1: Google Cloud TTS Integration which provides audio pronunciation for the vocabulary words.

## Business Value

The implementation of this vocabulary learning flow will:

- **Increase user engagement** by providing a more structured learning experience
- **Improve learning outcomes** by breaking down large vocabulary lists into manageable chunks
- **Boost user retention** by creating a sense of progress and achievement
- **Reduce cognitive load** for learners by focusing on smaller sets of words
- **Support different learning styles** through customizable learning pace and section sizes

### Competitive Advantages

Key differentiators from competing apps:

- More granular control over learning pace
- Better progress visualization
- More flexible organization of vocabulary
- Simpler user interface with fewer distractions

## Technical Implementation Reference

See the detailed technical documentation at:  
[Epic 2: Vocabulary Learning Flow](../../issue-implementation/epic-2-vocabulary-learning-flow/README.md)

## Future Considerations

- Explore subscription model for premium vocabulary lists
- Consider adding gamification elements to increase engagement
- Develop user onboarding tutorials to improve initial user experience
- Gather user feedback after implementation to identify future enhancements
- Consider adding multi-language support beyond Mandarin
