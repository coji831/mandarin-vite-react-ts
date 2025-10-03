# Epic 6: Multi-User Progress Architecture

**Epic Goal:** To architect a scalable progress tracking system that separates vocabulary content from learning progress, enabling multi-user support and setting the foundation for cross-device synchronization.
**Status:** Planned
**Last Update:** October 1, 2025

## Background

The current system tightly couples vocabulary content with user progress tracking, which limits scalability and makes multi-user support difficult. As users progress in their language learning journey, they need the ability to synchronize progress across devices and potentially compare progress with other users.

This epic addresses the architectural foundation needed for these capabilities by refactoring the progress tracking system to use WordId references instead of embedding progress data within vocabulary objects. This separation will enable user-specific progress tracking while maintaining a consistent vocabulary dataset, creating opportunities for future features like progress synchronization, learning analytics, and social learning features.

## User Stories

This epic consists of the following user stories:

1. #TBD / **Progress Store Design and Implementation**

   - As a developer, I want to create a dedicated ProgressStore with WordId references, so that user progress can be managed independently from vocabulary content.

2. #TBD / **Provider Separation and Context Refactoring**

   - As a developer, I want to separate VocabularyProvider from ProgressProvider, so that they can operate independently while still working together.

3. #TBD / **Component Adaptation to New Architecture**

   - As a developer, I want to refactor existing components to use the new providers, so that they maintain functionality while leveraging the new architecture.

4. #TBD / **User/Device Identification Infrastructure**

   - As a user, I want my progress to be associated with my device/account, so that my learning history is preserved.

5. #TBD / **Progress Synchronization Foundation**

   - As a user, I want the capability for my progress to synchronize across devices, so that I can continue learning seamlessly on any device.

6. #TBD / **Migrate Progress Logic to Per-User ProgressStore**

   - As a developer, I want to refactor the main progress hook and related logic to use the new per-user ProgressStore, so that all progress is reliably associated with the correct user/device and persists as designed.

## Story Breakdown Logic

This epic is divided into stories based on the following approach:

- Stories 6.1-6.2 focus on core architectural changes to data and state management (Planned)
- Stories 6.3-6.4 focus on component adaptation and user identification (Planned)
- Story 6.5 focuses on synchronization capabilities for future expansion (Planned)
- Story 6.6 covers the migration of all progress logic to the new per-user ProgressStore (Planned)

The breakdown follows a logical progression from foundational architectural changes to user-facing features. The first two stories establish the core data architecture, the next two adapt the application to use this architecture, and the final story creates the foundation for future synchronization features.

## Acceptance Criteria

For this epic to be considered complete, it must satisfy the following criteria:

- Progress data is stored separately from vocabulary content
- All progress references use WordId as the primary key
- User/device identification is implemented for progress association
- Existing components maintain full functionality with the new architecture
- Progress data is structured to support future multi-user capabilities
- Performance is maintained or improved compared to the current implementation
- Local storage mechanism supports the new data structure
- API for future synchronization capabilities is defined

## Architecture Decisions

1. **Separation of Concerns**: Fully separate vocabulary content from progress tracking to enable multi-user support and independent scaling.

2. **WordId as Universal Reference**: Implement WordId-based references for all progress tracking to maintain data integrity when vocabulary content changes.

3. **Device-First Identity Approach**: Start with device identification before implementing full user authentication to enable incremental development.

4. **Timestamp-Based Change Tracking**: Implement change records with timestamps to support future synchronization capabilities.

5. **Local-First Data Strategy**: Focus on robust local storage with synchronization preparation rather than immediate cloud implementation.

## Implementation Plan

The implementation approach for this epic includes:

1. **Architecture Design Phase**

   - Define the ProgressStore data structure
   - Design the separation between vocabulary and progress providers
   - Create interfaces for WordId-based progress referencing

2. **Core Data Structure Implementation**

   - Implement the ProgressStore with WordId references
   - Create separate VocabularyProvider and ProgressProvider
   - Develop the linking mechanism between providers

3. **Component Adaptation**

   - Refactor existing components to use the new providers
   - Update the vocabulary list and flashcard components
   - Ensure backward compatibility with existing features

4. **User/Device Infrastructure**

   - Implement device/user identification
   - Create progress association mechanism
   - Develop local storage persistence with the new structure

5. **Synchronization Foundation**
   - Design API for future progress synchronization
   - Implement offline capability preparation
   - Create timestamp-based change tracking

## Technical Context

This refactoring builds upon the progress tracking implemented in Epic 3 (State Management Refactor) but fundamentally changes how progress is stored and referenced. It will:

- Preserve the CSV-based vocabulary system
- Maintain the React Context API pattern for state management
- Require updates to local storage mechanisms
- Prepare for future API integration for synchronization

## Stakeholders

- **Primary:** Application developers and architects
- **Secondary:** Language learners (application users)
- **Tertiary:** Future administrators of multi-user systems

## Business Metrics

Success of this epic will be measured by:

- Maintenance or improvement of application performance
- Developer velocity for future multi-user features
- Successful refactoring without disruption to existing functionality
- Foundation established for future metrics on cross-device usage

## Dependencies

- Epic 3: State Management Refactor (must be completed)
- Epic 4: Routing Improvements (should be completed)

## Related Issues

- #TBD (Progress tracking refactoring)
- #TBD (Multi-user architecture foundation)

## Notes

- This epic involves significant architectural changes but should maintain backward compatibility
- A migration utility will be needed to convert existing progress data to the new format
- All components that currently access progress data will need modification
- This work establishes the foundation for future multi-user and synchronization features
