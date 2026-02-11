# Implementation 15-9: Gamification & AI Integration

## Technical Scope

Connect gamification UI (Story 15.7) and AI feedback display to backend APIs (Stories 15.3-15.4). Complete full engagement loop.

**Files Modified:**

- `apps/frontend/src/features/dashboard/components/Dashboard.tsx` - Add StreakCounter, leech widget
- `apps/frontend/src/features/quiz/containers/DailyReviewTest.tsx` - Integrate AI feedback, mystery box modal
- `apps/frontend/src/features/gamification/hooks/useGamificationAPI.ts` - API client for streaks/badges
- `apps/frontend/src/features/quiz/hooks/useAIFeedback.ts` - API client for AI explanations

**API Integration:**

- `GET /api/progress/streak` - Fetch streak data
- `POST /api/progress/streak/freeze` - Spend freeze
- `GET /api/gamification/badges` - Fetch badges
- `POST /api/quiz/feedback` - Generate AI explanation

## Implementation Details

### Gamification API Hook

```typescript
// apps/frontend/src/features/gamification/hooks/useGamificationAPI.ts

import { useCallback, useState } from "react";
import { apiClient } from "../../../utils/apiClient";

export function useGamificationAPI() {
  const [loading, setLoading] = useState(false);

  const fetchStreak = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/progress/streak");
      return response.data;
    } catch (error) {
      console.error("Error fetching streak:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const spendFreeze = useCallback(async () => {
    try {
      const response = await apiClient.post("/api/progress/streak/freeze");
      return response.data;
    } catch (error) {
      console.error("Error spending freeze:", error);
      throw error;
    }
  }, []);

  const fetchBadges = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/gamification/badges");
      return response.data;
    } catch (error) {
      console.error("Error fetching badges:", error);
      throw error;
    }
  }, []);

  return { fetchStreak, spendFreeze, fetchBadges, loading };
}
```

### AI Feedback Hook

```typescript
// apps/frontend/src/features/quiz/hooks/useAIFeedback.ts

import { useCallback, useState } from "react";
import { apiClient } from "../../../utils/apiClient";

export function useAIFeedback() {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ explanation: string; errorType: string } | null>(null);

  const generateFeedback = useCallback(
    async (data: {
      wordId: string;
      userAnswer: string;
      correctAnswer: string;
      questionType: string;
    }) => {
      setLoading(true);

      try {
        const response = await apiClient.post("/api/quiz/feedback", data);
        setFeedback(response.data);
        return response.data;
      } catch (error) {
        console.error("AI feedback error:", error);
        // Fallback to generic message
        setFeedback({
          explanation: "Review this word again to reinforce your memory.",
          errorType: "generic",
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { generateFeedback, feedback, loading };
}
```

### Updated Dashboard with Gamification

```typescript
// apps/frontend/src/features/dashboard/components/Dashboard.tsx (updated)

import React, { useEffect, useState } from 'react';
import { useGamificationAPI } from '../../gamification/hooks/useGamificationAPI';
import { StreakCounter } from '../../gamification/components/StreakCounter';
import { BadgeDisplay } from '../../gamification/components/BadgeDisplay';
import { XPProgressBar } from '../../gamification/components/XPProgressBar';

export const Dashboard: React.FC = () => {
  const [streakData, setStreakData] = useState<any>(null);
  const [badges, setBadges] = useState<any>({ earned: [], available: [] });
  const [xp, setXP] = useState(0);
  const { fetchStreak, fetchBadges, spendFreeze } = useGamificationAPI();

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      const [streakResponse, badgeResponse] = await Promise.all([
        fetchStreak(),
        fetchBadges()
      ]);
      setStreakData(streakResponse);
      setBadges(badgeResponse);
      // XP calculated from badges or separate endpoint
      setXP(280); // TODO: fetch from backend
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  };

  const handleSpendFreeze = async () => {
    if (!confirm('Spend 1 freeze to protect your streak?')) return;

    try {
      const result = await spendFreeze();
      setStreakData(result);
      alert('Freeze spent! Your streak is protected for 24 more hours.');
    } catch (error: any) {
      alert(error.message || 'Failed to spend freeze');
    }
  };

  return (
    <div className="dashboard">
      <h1>Welcome back!</h1>

      {streakData && (
        <StreakCounter
          currentStreak={streakData.currentStreak}
          longestStreak={streakData.longestStreak}
          freezeCount={streakData.freezeCount}
          lastActivityDate={new Date(streakData.lastActivityDate)}
        />
      )}

      <button onClick={handleSpendFreeze} disabled={!streakData || streakData.freezeCount < 1}>
        ❄️ Spend Freeze
      </button>

      <XPProgressBar currentXP={xp} />

      <BadgeDisplay earned={badges.earned} available={badges.available} />

      {/* Start Daily Review button from Story 15.8 */}
    </div>
  );
};
```

### Updated DailyReviewTest with AI Feedback & Mystery Box

```typescript
// apps/frontend/src/features/quiz/containers/DailyReviewTest.tsx (updated)

import React, { useState } from 'react';
import { useAIFeedback } from '../hooks/useAIFeedback';
import { AIFeedbackPanel } from '../components/AIFeedbackPanel';
import { MysteryBoxModal } from '../../gamification/components/MysteryBoxModal';

export const DailyReviewTest: React.FC = () => {
  // ... existing state from Story 15.8
  const { generateFeedback, feedback, loading: feedbackLoading } = useAIFeedback();
  const [mysteryBoxReward, setMysteryBoxReward] = useState<any>(null);

  const handleAnswer = async (userAnswer: string) => {
    const currentQuestion = state.questions[state.currentIndex];
    const correct = validateAnswer(userAnswer, currentQuestion);

    // Optimistic UI feedback
    dispatch({ type: 'SUBMIT_ANSWER', answer: { /* ... */ } });

    // Save to backend
    try {
      const result = await saveTestResult({ /* ... */ });

      // Check for gamification rewards
      if (result.mysteryBox) {
        setMysteryBoxReward(result.mysteryBox);
      }

      // If incorrect, fetch AI feedback asynchronously
      if (!correct) {
        generateFeedback({
          wordId: currentQuestion.wordId,
          userAnswer,
          correctAnswer: getCorrectAnswer(currentQuestion),
          questionType: currentQuestion.mode
        });
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    }

    // Auto-advance (feedback loads in background)
    setTimeout(() => {
      dispatch({ type: 'NEXT_QUESTION' });
    }, 1500);
  };

  return (
    <div>
      {/* Quiz UI from Story 15.8 */}

      {state.phase === 'ANSWER_FEEDBACK' && !state.answers[state.answers.length - 1].correct && (
        <AIFeedbackPanel
          explanation={feedback?.explanation || ''}
          errorType={feedback?.errorType || 'generic'}
          loading={feedbackLoading}
        />
      )}

      {mysteryBoxReward && (
        <MysteryBoxModal
          reward={mysteryBoxReward}
          onClose={() => setMysteryBoxReward(null)}
        />
      )}
    </div>
  );
};
```

### Mystery Box Modal Component

```typescript
// apps/frontend/src/features/gamification/components/MysteryBoxModal.tsx

import React, { useEffect, useState } from 'react';
import styles from './MysteryBoxModal.module.css';

interface MysteryBoxModalProps {
  reward: { type: 'xp' | 'freeze' | 'badge'; amount?: number; id?: string };
  onClose: () => void;
}

export const MysteryBoxModal: React.FC<MysteryBoxModalProps> = ({ reward, onClose }) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Reveal after 1-second animation
    const timer = setTimeout(() => setRevealed(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const rewardDisplay = {
    xp: `+${reward.amount} XP`,
    freeze: '❄️ 1 Streak Freeze',
    badge: '🏆 Golden Flame Badge'
  }[reward.type];

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>🎁 Mystery Box!</h2>

        <div className={`${styles.box} ${revealed ? styles.open : ''}`}>
          {!revealed ? '🎁' : '✨'}
        </div>

        {revealed && (
          <div className={styles.reward}>
            <h3>{rewardDisplay}</h3>
            <p>Keep up the great work!</p>
          </div>
        )}

        <button onClick={onClose}>Claim Reward</button>
      </div>
    </div>
  );
};
```

## Architecture Integration

```
Dashboard loads on mount:
    ↓
Promise.all([fetchStreak(), fetchBadges()])
    ↓
Render StreakCounter + BadgeDisplay + XPProgressBar with live data
    ↓
User spends freeze → POST /api/progress/streak/freeze → update StreakCounter

---

Quiz flow (DailyReviewTest):
    ↓
User answers incorrectly
    ↓
saveTestResult() → backend returns { nextReviewDate, lapseCount, xpEarned, mysteryBox? }
    ↓
If mysteryBox → show MysteryBoxModal with reward animation
    ↓
Async: generateFeedback() → POST /api/quiz/feedback → AIFeedbackPanel displays explanation
    ↓
User advances to next question (feedback loads in background)
```

## Technical Challenges & Solutions

### Challenge: AI Feedback Latency Blocks Quiz Flow

**Problem:** Waiting for 3-second Gemini API response delays next question transition (poor UX).

**Solution:** Async pattern — show feedback immediately ("Incorrect"), advance to next question, load AI explanation in background, show notification when ready ("💡 Explanation available").

---

**Related Documentation:**

- [Story 15.9 BR](../../business-requirements/epic-15-learning-retention/story-15-9-gamification-ai-integration.md)
- [Story 15.7 Implementation](./story-15-7-gamification-feedback-display-ui.md) (UI components)
- [Story 15.3 Implementation](./story-15-3-streak-gamification-backend.md) (backend APIs)
- [Story 15.4 Implementation](./story-15-4-ai-feedback-backend.md) (AI backend)
- [Epic 15 Implementation](./README.md)
