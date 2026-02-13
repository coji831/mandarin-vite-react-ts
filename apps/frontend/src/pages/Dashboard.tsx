/**
 * Dashboard page
 *
 * Main landing page for authenticated users.
 * Shows quick stats, action cards, and navigation shortcuts.
 * Phase 3: Integrated with gamification components (Story 15.7).
 */
import { Link } from "react-router-dom";
import { StreakCounter, XPProgressBar, BadgeDisplay } from "../features/gamification/components";
import type { StreakData, Badge } from "../features/gamification/types/GamificationTypes";
import "./Dashboard.css";

export { Dashboard };

// Mock data - Story 15.9 will replace with API calls
const mockStreakData: StreakData = {
  currentStreak: 7,
  longestStreak: 12,
  freezeCount: 3,
  lastActivityDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
};

const mockBadges: Badge[] = [
  {
    id: "badge-1",
    name: "Quick Learner",
    description: "Complete 10 quizzes",
    icon: "⚡",
    earnedDate: new Date("2024-01-15"),
  },
  {
    id: "badge-2",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    earnedDate: new Date(),
  },
  {
    id: "badge-3",
    name: "Perfectionist",
    description: "Get 100% on a quiz",
    icon: "💯",
    earnedDate: undefined,
  },
];

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome Back! 👋</h1>
        <p>Continue your Mandarin learning journey</p>
      </div>

      <div className="dashboard-layout">
        {/* Left Column: Stats & Badges */}
        <div className="dashboard-left">
          {/* Quick Stats - Gamification Components */}
          <div className="stats-grid">
            <StreakCounter streakData={mockStreakData} />
            <XPProgressBar currentXP={280} />
            <StatCard icon="📚" label="Words Learned" value="Coming Soon" />
          </div>

          {/* Badges Section */}
          <div className="badges-section">
            <h3>Your Badges</h3>
            <BadgeDisplay badges={mockBadges} />
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
