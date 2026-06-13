/**
 * DashboardPage
 * Story 15.9: Gamification & AI Integration
 *
 * Main landing page for authenticated users.
 * Shows quick stats, action cards, navigation shortcuts, and live gamification data.
 * Features:
 * - Live streak counter and badge display (API-driven)
 * - Leech widget for focus words (shows when 3+ leeches)
 * - Freeze spending with confirmation modal
 * - Badge celebration modal for newly earned badges
 *
 * Phase 3 restructure: Renamed from Dashboard to DashboardPage
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StreakCounter, XPProgressBar, BadgeDisplay } from "../features/gamification";
import { LeechWidget } from "../features/dashboard";
import { useFetchStreak, useFetchBadges, useSpendFreeze } from "../features/gamification";
import type { StreakData, Badge } from "../features/gamification";
import "./DashboardPage.css";

export { DashboardPage };

function DashboardPage() {
  const { fetchStreak, loading: streakLoading, error: streakError } = useFetchStreak();
  const { fetchBadges, loading: badgesLoading, error: badgesError } = useFetchBadges();
  const { spendFreeze, loading: spendingFreeze, error: freezeError } = useSpendFreeze();

  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Fetch streak data
        const streakResponse = await fetchStreak();
        setStreakData({
          currentStreak: streakResponse.currentStreak,
          longestStreak: streakResponse.longestStreak,
          freezeCount: streakResponse.freezeCount,
          lastActivityDate: new Date(streakResponse.lastActivityDate),
        });

        // Fetch badges
        const badgeResponse = await fetchBadges();
        const allBadges = [
          ...badgeResponse.earned.map((badge) => ({
            id: badge.id,
            name: badge.name,
            description: `Maintain a ${badge.streakRequired}-day streak`,
            icon: badge.icon,
            earnedDate: badge.earnedDate ? new Date(badge.earnedDate) : undefined,
          })),
          ...badgeResponse.available.map((badge) => ({
            id: badge.id,
            name: badge.name,
            description: `Maintain a ${badge.streakRequired}-day streak`,
            icon: badge.icon,
            earnedDate: undefined,
          })),
        ];
        setBadges(allBadges);

        // Check for new badges (Story 15.9 AC: Badge celebration modal)
        // Story 15.11 Flow 2.6: Use "last_celebrated_badges" to avoid double-celebration
        // Dashboard serves as fallback for users who missed quiz celebration
        const lastCelebratedBadges = localStorage.getItem("last_celebrated_badges");
        const lastCelebratedIds = lastCelebratedBadges ? JSON.parse(lastCelebratedBadges) : [];
        const currentEarnedIds = badgeResponse.earned.map((b) => b.id);

        const newlyEarned = badgeResponse.earned.find(
          (badge) => !lastCelebratedIds.includes(badge.id),
        );
        if (newlyEarned) {
          setNewBadge({
            id: newlyEarned.id,
            name: newlyEarned.name,
            description: `Maintain a ${newlyEarned.streakRequired}-day streak`,
            icon: newlyEarned.icon,
            earnedDate: newlyEarned.earnedDate ? new Date(newlyEarned.earnedDate) : undefined,
          });
          setShowBadgeCelebration(true);
          localStorage.setItem("last_celebrated_badges", JSON.stringify(currentEarnedIds));
        } else if (lastCelebratedIds.length === 0 && currentEarnedIds.length > 0) {
          // First load: set without showing modal
          localStorage.setItem("last_celebrated_badges", JSON.stringify(currentEarnedIds));
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    };

    loadDashboardData();
  }, [fetchStreak, fetchBadges]);

  const handleSpendFreeze = async () => {
    setShowFreezeConfirm(false);
    try {
      const response = await spendFreeze();
      // Update streak data with new freeze count
      if (streakData) {
        setStreakData({
          ...streakData,
          freezeCount: response.freezeCount,
          lastActivityDate: new Date(response.lastActivityDate),
        });
      }
      alert("✅ Streak freeze activated! Your streak is protected for today.");
    } catch {
      alert(`❌ ${freezeError || "Failed to activate streak freeze. Please try again."}`);
    }
  };

  const handleCloseBadgeCelebration = () => {
    setShowBadgeCelebration(false);
    setNewBadge(null);
  };
  if (streakLoading || badgesLoading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (streakError || badgesError) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>⚠️ Error Loading Dashboard</h1>
          <p>{streakError || badgesError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome Back! 👋</h1>
        <p>Continue your Mandarin learning journey</p>
      </div>

      {/* Leech Widget - Shows when 3+ leeches */}
      <LeechWidget />

      <div className="dashboard-layout">
        {/* Left Column: Stats & Badges */}
        <div className="dashboard-left">
          {/* Quick Stats - Gamification Components */}
          <div className="stats-grid">
            {streakData && <StreakCounter streakData={streakData} />}
            <XPProgressBar currentXP={280} />
            <StatCard icon="📚" label="Words Learned" value="Coming Soon" />
          </div>

          {/* Freeze Spend Button */}
          {streakData && streakData.freezeCount > 0 && (
            <div className="freeze-actions">
              <button
                onClick={() => setShowFreezeConfirm(true)}
                className="freeze-button"
                disabled={spendingFreeze}
              >
                ❄️ Use Streak Freeze ({streakData.freezeCount})
              </button>
            </div>
          )}

          {/* Badges Section */}
          <div className="badges-section">
            <h3>Your Badges</h3>
            <BadgeDisplay badges={badges} />
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="dashboard-right">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <ActionCard
              to="/learn/quiz"
              icon="📝"
              title="Daily Quiz"
              description="Test your knowledge"
              color="#3b82f6"
            />
            <ActionCard
              to="/learn/review"
              icon="🔄"
              title="Review"
              description="Practice due words"
              color="#8b5cf6"
            />
            <ActionCard
              to="/learn/vocabulary-list"
              icon="📚"
              title="Vocabulary"
              description="Browse word lists"
              color="#10b981"
            />
            <ActionCard
              to="/progress"
              icon="📊"
              title="Progress"
              description="View your stats"
              color="#f59e0b"
            />
          </div>
        </div>
      </div>

      {/* Freeze Confirmation Modal */}
      {showFreezeConfirm && (
        <div className="modal-overlay" onClick={() => setShowFreezeConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>❄️ Use Streak Freeze?</h3>
            <p>
              This will protect your streak for today. You have {streakData?.freezeCount} freezes
              remaining.
            </p>
            <div className="modal-actions">
              <button
                onClick={handleSpendFreeze}
                className="modal-button confirm"
                disabled={spendingFreeze}
              >
                {spendingFreeze ? "Activating..." : "Yes, Use It"}
              </button>
              <button onClick={() => setShowFreezeConfirm(false)} className="modal-button cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge Celebration Modal */}
      {showBadgeCelebration && newBadge && (
        <div className="modal-overlay badge-celebration" onClick={handleCloseBadgeCelebration}>
          <div className="modal-content celebration" onClick={(e) => e.stopPropagation()}>
            <div className="confetti-container">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="confetti-piece"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    backgroundColor: ["#ffd700", "#ff6b6b", "#4ecdc4", "#45b7d1", "#f7b801"][i % 5],
                  }}
                />
              ))}
            </div>
            <div className="badge-celebration-icon">{newBadge.icon}</div>
            <h2 className="badge-celebration-title">🎉 New Badge Earned!</h2>
            <h3 className="badge-celebration-name">{newBadge.name}</h3>
            <p className="badge-celebration-description">{newBadge.description}</p>
            <button onClick={handleCloseBadgeCelebration} className="modal-button celebrate">
              Awesome! 🎉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

function ActionCard({
  to,
  icon,
  title,
  description,
  color,
}: {
  to: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="action-card">
      <Link to={to} className="action-card-link" style={{ borderLeftColor: color }}>
        <div className="action-icon">{icon}</div>
        <div className="action-content">
          <h3 className="action-title">{title}</h3>
          <p className="action-description">{description}</p>
        </div>
        <div className="action-arrow" style={{ color }}>
          →
        </div>
      </Link>
    </div>
  );
}
