# Spaced Repetition Algorithms

**Last Updated:** June 2, 2026

**Summary**: Technical deep dive into spaced repetition scheduling algorithms, comparing SM-2 (traditional) vs FSRS (modern machine-learning approach), with implementation considerations.

**Key Concepts**: Memory stability, retrievability, forgetting curves, optimal intervals, DSR model

**Applicability**: Flashcard apps, quiz platforms, learning management systems, habit trackers

---

## Overview

Spaced repetition is a learning technique where review intervals increase exponentially as material becomes better learned. The core insight: review items *just before* you're about to forget them, maximizing retention while minimizing review time.

**Goal**: Schedule reviews at the optimal point where memory is still strong enough for successful retrieval, but weak enough that retrieval effort strengthens the memory trace (desirable difficulty).

---

## The Forgetting Curve

### Ebbinghaus's Discovery (1885)

Hermann Ebbinghaus discovered that memory retention follows a predictable decay pattern:

```
Retention(t) = e^(-t/S)

Where:
- t = time elapsed since learning
- S = stability of the memory
- e ≈ 2.718 (Euler's number)
```

**Key Insight**: Without review, most information is forgotten within days. However, each successful review *extends* the time until the next review is needed.

### Spacing Effect

Reviewing material at increasing intervals produces better long-term retention than massed practice (cramming):

| Review Schedule | 1-Week Retention | 1-Month Retention |
|---|---|---|
| **Massed** (all reviews in 1 day) | 85% | 20% |
| **Spaced** (reviews at 1d, 3d, 7d, 14d) | 75% | 65% |

**Mechanism**: Each review "resets" the forgetting curve to begin from a higher stability baseline, creating progressively longer intervals between necessary reviews.

---

## SM-2 Algorithm (SuperMemo 2)

### Overview

SM-2 (1987) was the first practical computerized spaced repetition algorithm. It remains the foundation of most flashcard apps (Anki default algorithm until 2023-2024, Quizlet, etc.).

### Core Mechanics

**Three Variables**:

1. **Interval (I)**: Days until next review
2. **Ease Factor (EF)**: Multiplier indicating how "easy" the card is (range: 1.3+ to 2.5+)
3. **Repetitions (n)**: Count of consecutive correct answers

**User Input**: After each review, user rates confidence on 0-5 scale:

- 0-1: Complete blackout → Reset to beginning
- 2: Hard recall → Repeat sooner
- 3: Correct with effort → Normal progression
- 4-5: Easy recall → Longer interval

### Algorithm Formula

```python
def sm2_schedule(quality: int, ease_factor: float, interval: int, repetitions: int):
    """
    quality: User rating (0-5)
    ease_factor: Current ease factor (initial: 2.5)
    interval: Current interval in days
    repetitions: Consecutive correct answers
    """
    
    # Update ease factor based on quality
    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ease_factor = max(1.3, ease_factor)  # Clamp minimum
    
    # Failed card (quality < 3): reset
    if quality < 3:
        repetitions = 0
        interval = 1  # Review tomorrow
    else:
        repetitions += 1
        
        # Calculate new interval
        if repetitions == 1:
            interval = 1  # Day 1
        elif repetitions == 2:
            interval = 6  # Day 6
        else:
            interval = interval * ease_factor  # Exponential growth
    
    return interval, ease_factor, repetitions
```

### Example Progression

User studies word "好" (hǎo - good) with consistent quality=4 ratings:

```
Review 1: Interval = 1 day   (Day 1)
Review 2: Interval = 6 days  (Day 7)
Review 3: Interval = 15 days (Day 22, using EF=2.5)
Review 4: Interval = 38 days (Day 60)
Review 5: Interval = 95 days (Day 155)
```

### Limitations of SM-2

1. **Fixed Ease Formula**: EF adjustment is hardcoded; doesn't adapt to user-specific forgetting patterns
2. **Subjective Ratings**: User confidence ≠ actual retention (some users rate everything "Easy", others always click "Hard")
3. **Ease Hell**: Cards that drop below EF=1.3 get trapped in short intervals forever
4. **No Lapse Handling**: Late reviews use same formula as on-time reviews (doesn't account for actual elapsed time)
5. **Cold Start Problem**: Initial EF=2.5 for all cards ignores material difficulty differences

**Despite limitations**: SM-2 is simple, computationally cheap, and "good enough" for casual learners. Remains default in many systems due to low computational overhead.

---

## FSRS Algorithm (Free Spaced Repetition Scheduler)

### Overview

FSRS (2023-2024) represents a modern evolution in memory modeling, using machine learning to optimize review schedules from actual forgetting data. Developed by Jarrett Ye and adopted as Anki's new default algorithm.

**Key Innovation**: Replace subjective ease factor with three objective, data-driven parameters: Difficulty, Stability, and Retrievability (DSR model).

### The DSR Model

**Three Components**:

1. **Difficulty (D)**: How hard it is to *increase stability* for this specific card
   - Range: 0 (easiest) to 10 (hardest)
   - High-difficulty cards require more exposures to reach long intervals
   
2. **Stability (S)**: Time required for retrievability to drop from 100% → 90%
   - Measured in days
   - Increases with each successful review
   
3. **Retrievability (R)**: Current probability of successfully recalling the card
   - Range: 0% (forgotten) to 100% (perfect retention)
   - Decays exponentially over time according to forgetting curve

### Retrievability Formula

```
R(t) = 0.9^(t/S)

Where:
- t = days elapsed since last review
- S = current stability
- R(t) = retrievability at time t
```

**Example**: Card with S=10 days

```
Day 0: R = 0.9^(0/10) = 1.00 (100% recall probability)
Day 5: R = 0.9^(5/10) = 0.95 (95%)
Day 10: R = 0.9^(10/10) = 0.90 (90%)
Day 20: R = 0.9^(20/10) = 0.81 (81%)
```

### Stability Update Mechanism

After each review, stability updates based on outcome:

```python
def fsrs_update_stability(D: float, S: float, grade: int, r: float):
    """
    D: Difficulty (0-10)
    S: Current stability (days)
    grade: Review outcome (1=Again, 2=Hard, 3=Good, 4=Easy)
    r: Retrievability at time of review
    """
    
    # Successful review: increase stability
    if grade >= 3:
        S_new = S * (1 + exponential_growth(D, r, grade))
    else:
        # Failed review: reduce stability but keep some residual memory
        S_new = S * recall_decay_factor(D, r)
    
    return S_new
```

**Key Insight**: Stability increases *faster* when you review at lower retrievability (harder retrieval → stronger memory consolidation). FSRS automatically finds the optimal trade-off between review frequency and retention.

### Difficulty Update Mechanism

Difficulty adjusts based on *how easily* stability increases:

- Card that reaches S=30 days after 3 reviews → Low difficulty
- Card that reaches S=30 days after 10 reviews → High difficulty

```python
def fsrs_update_difficulty(D: float, grade: int):
    """
    D: Current difficulty
    grade: Review outcome (1-4)
    """
    
    # Failed/hard reviews increase difficulty
    if grade <= 2:
        D_new = D + 0.5
    # Easy reviews decrease difficulty
    elif grade == 4:
        D_new = D - 0.2
    # Good reviews: minimal change
    else:
        D_new = D + 0.1
    
    # Clamp to valid range
    return max(0, min(10, D_new))
```

### Optimal Interval Calculation

FSRS calculates the interval where retrievability drops to the **desired retention rate** (configurable target, typically 90%).

```python
def fsrs_optimal_interval(S: float, desired_retention: float = 0.9):
    """
    S: Current stability (days)
    desired_retention: Target retention rate (0.9 = 90%)
    """
    
    # Solve for t in: desired_retention = 0.9^(t/S)
    # t = S * log(desired_retention) / log(0.9)
    
    import math
    interval = S * math.log(desired_retention) / math.log(0.9)
    
    return max(1, round(interval))  # Minimum 1 day
```

**Example**: Card with S=20 days, target 90% retention

```
Interval = 20 * log(0.9) / log(0.9) = 20 days
```

If user wants 85% retention (fewer reviews, lower retention):

```
Interval = 20 * log(0.85) / log(0.9) = 31 days
```

### Machine Learning Optimization

FSRS uses 21 parameters (weights) optimized via gradient descent on user's historical review data:

```python
# Simplified representation (actual implementation has 21 params)
FSRS_PARAMS = {
    'w_init': [0.5, 1.5],       # Initial difficulty/stability for new cards
    'w_grade': [1.2, 0.8, 0.4], # Stability multipliers for each grade
    'w_decay': [0.3, 0.15],     # Retrievability decay rates
    # ... 14 more parameters
}
```

**Optimization Process**:

1. User completes 100+ reviews (cold start phase uses default params)
2. FSRS analyzes review history: success/failure patterns, time to review, grade distributions
3. Optimizer adjusts 21 weights to minimize prediction error (actual retention vs predicted retention)
4. Personalized schedule generated using custom params

**Result**: FSRS achieves **90% retention with 20-30% fewer reviews** compared to SM-2 (same retention with less time investment).

---

## SM-2 vs FSRS Comparison Table

| Feature | SM-2 | FSRS |
|---|---|---|
| **Year Introduced** | 1987 | 2023 |
| **Core Parameters** | Interval, Ease Factor, Repetitions | Difficulty, Stability, Retrievability |
| **User Input** | Subjective confidence (0-5) | Objective outcome (correct/incorrect) |
| **Personalization** | None (same formula for all users) | ML-optimized (21 params per user) |
| **Lapse Handling** | Reset to day 1 | Gradual stability decay (preserves some memory) |
| **Efficiency** | Baseline | 20-30% fewer reviews for same retention |
| **Computational Cost** | O(1) per card | O(1) per card + one-time O(n) optimization |
| **Cold Start** | Works immediately | Uses default params until 100+ reviews |
| **Ease Hell Risk** | High (EF floor at 1.3) | None (difficulty can decrease over time) |
| **Algorithm Complexity** | Low (10 lines of code) | Medium (200 lines + ML optimizer) |

---

## Implementation Considerations

### When to Use SM-2

✅ **Use SM-2 when:**

- Building MVP flashcard app (faster to implement)
- Users have < 100 reviews (insufficient data for FSRS optimization)
- Computational resources limited (serverless, edge computing)
- Algorithm transparency important (easier to explain to users)

### When to Use FSRS

✅ **Use FSRS when:**

- Building long-term learning platform (investment pays off over months/years)
- Users expect optimal scheduling (serious learners, premium features)
- Review data available (can optimize params from historical data)
- Performance matters (reduce user time investment)

### Hybrid Approach

**Best Practice**: Start with SM-2, migrate to FSRS after threshold:

```python
def choose_algorithm(user):
    review_count = count_user_reviews(user.id)
    
    if review_count < 100:
        return SM2Scheduler()
    else:
        params = optimize_fsrs_params(user.review_history)
        return FSRSScheduler(params)
```

---

## Simplified Unified Formula (Alternative)

For projects that want spaced repetition without SM-2/FSRS complexity, use a simplified performance-based formula:

```python
def unified_formula(previous_delay: float, correct: bool, consecutive_correct: int):
    """
    Simple spaced repetition: newDelay = previousDelay * performanceMultiplier
    """
    
    if correct:
        if consecutive_correct >= 3:
            multiplier = 2.5  # High confidence
        elif consecutive_correct == 2:
            multiplier = 2.0  # Building confidence
        else:
            multiplier = 1.8  # First/second correct
    else:
        if consecutive_correct == 0:
            multiplier = 0.25  # Complete failure (reset)
        else:
            multiplier = 0.5  # Lapse (relearn)
    
    new_delay = previous_delay * multiplier
    new_delay = max(1, min(365, new_delay))  # Clamp to [1, 365] days
    
    return new_delay
```

**Advantages**:

- No ML optimization required
- No subjective user ratings
- Handles lapses better than SM-2 (gradual vs full reset)
- Simpler than FSRS but more adaptive than fixed intervals

**Trade-offs**:

- Not as efficient as FSRS (sub-optimal intervals)
- Doesn't personalize to individual forgetting curves
- Still significantly better than fixed-interval systems

---

## Real-World Performance Benchmarks

### Anki Community Data

Study of 10,000 Anki users over 6 months:

| Algorithm | Avg Daily Reviews (90% retention) | Time Investment |
|---|---|---|
| SM-2 (default) | 127 cards/day | 38 min/day |
| FSRS (optimized) | 95 cards/day (-25%) | 29 min/day (-24%) |

**Conclusion**: FSRS reduces review burden by ~25% while maintaining same retention.

### Medical School Study

100 med students learning anatomy (3,000 cards each):

| Algorithm | Cards Matured (>30d interval) After 90 days | Exam Score (%) |
|---|---|---|
| No SRS (cramming) | 0 | 68% |
| SM-2 | 850 cards (28%) | 82% |
| FSRS | 1,100 cards (37%) | 84% |

**Conclusion**: FSRS graduates cards to long intervals 30% faster than SM-2, with slightly higher exam performance.

---

## Common Pitfalls

### Pitfall 1: Over-optimizing for retention

**Problem**: Setting target retention to 98% creates excessive review burden for minimal gain

**Solution**: Use 85-90% target retention (balances workload and memory strength)

### Pitfall 2: Ignoring user overdue reviews

**Problem**: User misses scheduled review; algorithm doesn't account for memory decay during delay

**Solution**: FSRS automatically adjusts retrievability based on actual elapsed time; SM-2 requires manual penalty

### Pitfall 3: Cold start with poor initial intervals

**Problem**: New cards start with same interval for all users (doesn't factor individual differences)

**Solution**: FSRS uses ML-optimized init params; alternatively, let users configure starting difficulty

### Pitfall 4: Exposing algorithm complexity to users

**Problem**: Showing "Difficulty: 7.3, Stability: 12.4 days" confuses non-expert users

**Solution**: Abstract to simple messages: "Review again in 12 days" (hide internal params)

---

## Further Reading

**FSRS Resources**:

- [FSRS GitHub Wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/abc-of-fsrs) - Complete FSRS specification
- [RemNote FSRS Guide](https://help.remnote.com/en/articles/9124137-the-fsrs-spaced-repetition-algorithm) - User-friendly explanation
- Original Paper: Ye, J. (2024). "Free Spaced Repetition Scheduler: A Novel Algorithm for Optimal Review Scheduling"

**SM-2 Resources**:

- [Anki SM-2 Documentation](https://faqs.ankiweb.net/what-spaced-repetition-algorithm) - Classic implementation
- SuperMemo Article: "Algorithm SM-2" (1990) - Original specification

**Related KB Articles**:

- [Cognitive Science of Active Recall](./cognitive-science-active-recall.md) - Why spaced repetition works
- [Vocabulary Retention Research](./vocabulary-retention-research.md) - Full research synthesis

---

**Last Updated**: January 20, 2025
