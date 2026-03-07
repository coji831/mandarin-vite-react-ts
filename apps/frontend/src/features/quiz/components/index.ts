/**
 * Quiz Components Index
 * Component Reorganization: Systematic organization by UI concern
 * Story 15.5: Core Quiz UI Components
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Core Quiz Backend Integration
 * Story 15.10: Quiz UX Polish - Comprehensive component reorganization
 * Epic 19: State Refactor - Context-based architecture with consolidated layouts
 * Refactoring: Extracted input components (PinyinToneInput, ChineseCharacterInput)
 * Refactoring: Removed AIFeedbackPanel (unused component)
 * Refactoring: Organized into logical folders (states, layouts, inputs, overlays, progress, results, exams)
 * Refactoring: Consolidated QuestionLayout + FeedbackLayout → ExamLayout
 * Refactoring: Renamed CompletionLayout → ResultsLayout for parallel naming
 * Refactoring: Extracted inline components to exams folder (QuestionSection, AnswerSection, FeedbackSection)
 * Refactoring: Merged FeedbackDisplay into FeedbackSection for consolidation
 */

// Exam sub-components (extracted from layouts)
export { QuestionSection, AnswerSection, FeedbackSection } from "./exams";

// State screens (simple full-screen states)
export { LoadingScreen, ErrorScreen, EmptyStateScreen } from "./states";

// Layout orchestrators (complex phase coordinators)
export { ExamLayout, ResultsLayout } from "./layouts";

// Input components
export { PinyinToneInput, ChineseCharacterInput, MultipleChoiceInput } from "./inputs";

// Overlays (modal/popup)
export { HintOverlay } from "./overlays";

// Progress indicators
export { ProgressBar } from "./progress";

// Result subcomponents (used by ResultsLayout)
export { StatsGrid, BadgesDisplay, LeechWarning, ResultsTable } from "./results";
