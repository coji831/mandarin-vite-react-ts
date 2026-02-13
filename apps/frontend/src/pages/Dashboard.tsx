/**
 * Dashboard page
 *
 * Main landing page for authenticated users.
 * Shows quick stats, action cards, and navigation shortcuts.
 * Phase 2: Basic version with placeholders for gamification stats.
 */
import { Link } from "react-router-dom";
import "./Dashboard.css";

export { Dashboard };

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome Back! 👋</h1>
        <p>Continue your Mandarin learning journey</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <StatCard icon="🔥" label="Current Streak" value="Coming Soon" />
        <StatCard icon="⭐" label="Total XP" value="Coming Soon" />
        <StatCard icon="📚" label="Words Learned" value="Coming Soon" />
      </div>

      {/* Quick Actions */}
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
