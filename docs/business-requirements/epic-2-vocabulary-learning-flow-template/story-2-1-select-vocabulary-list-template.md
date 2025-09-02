# User Story: Select Vocabulary List from Mandarin Page

## Business Description

As a language learner, I want to select from multiple vocabulary lists (such as HSK 3.0 lists) on the Mandarin page, so that I can focus on the specific vocabulary set I want to learn.

## User Value

Learners have different needs and proficiency levels. Providing multiple vocabulary lists allows users to:

- Choose content appropriate for their skill level
- Focus on specific categories of words
- Set a clear scope for their learning journey

## User Journey

1. User navigates to the Mandarin page
2. User sees a selection of vocabulary lists with descriptions
3. User reviews options based on their learning goals
4. User selects a list that matches their needs
5. System confirms selection and prepares for next step

## Acceptance Criteria

- User can see a list of available vocabulary lists on the Mandarin page
- Each list shows its name and approximate word count
- User can view a sample of words from each list to assess difficulty
- User can select a list, and the selection is visually indicated
- Selected list's data is loaded and available for the next steps in the flow
- Selection is remembered if user navigates away and returns

## Business Rules

- At least one vocabulary list must always be available
- Lists should show their difficulty level and word count
- Users should be able to switch lists at any point in their learning journey
- Changing lists should not lose progress on previously studied lists

## UX/UI Considerations

- List selection should be visually prominent
- Each list should have a preview to help users make informed decisions
- Selection should require minimal clicks
- Provide clear visual indication of which list is currently selected
- Mobile-friendly layout with appropriate touch targets

## Stakeholder Needs

- Product manager wants analytics on which lists are most popular
- Curriculum team needs ability to add new lists easily
- Marketing team wants to highlight newest vocabulary content

## Related Issues

- Depends on #2 (Epic 1: Google Cloud TTS Integration) for audio playback functionality
- Will be extended by #10 (Future Epic: Custom Vocabulary Lists) in the next quarter
- Resolves user feedback ticket FB-127 (Request for more vocabulary options)
