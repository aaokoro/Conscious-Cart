import React from 'react'
import './Dashboard.css'

function Dashboard({ user, onNavigate }) {
  function handleActionClick(actionType) {
    onNavigate(actionType)
  }

  return (
    <div className="dashboard">
      {/* Hero Section - The big welcome area at the top */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1>Your Skincare Journey</h1>

          {/* Show different welcome message if user is logged in */}
          <p className="hero-subtitle">
            {user ? `Welcome back, ${user.name || user.email}!` : 'Welcome to Skinfluence'}
          </p>

          <p className="hero-description">
            Discover personalized skincare recommendations tailored just for you
          </p>
        </div>

        {/* Statistics section showing user progress */}
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">12</span>
            <span className="stat-label">Previously Used</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">85%</span>
            <span className="stat-label">Skin Improvement</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">30</span>
            <span className="stat-label">Days Tracked</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Section - Main action buttons */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">

          {/* Get Recommendations Card - Most important action */}
          <div
            className="action-card primary"
            onClick={() => handleActionClick('recommendations')}
          >
            <div className="action-icon">🎯</div>
            <h3>Get Recommendations</h3>
            <p>Find products perfect for your skin type</p>
            <span className="action-arrow">→</span>
          </div>

          {/* Your Profile Card */}
          <div
            className="action-card"
            onClick={() => handleActionClick('profile')}
          >
            <div className="action-icon">👤</div>
            <h3>Your Profile</h3>
            <p>Update your skin profile & preferences</p>
            <span className="action-arrow">→</span>
          </div>

          {/* Skin Analysis Card - Coming soon feature */}
          <div className="action-card">
            <div className="action-icon">📊</div>
            <h3>Skin Analysis</h3>
            <p>Track your skin progress over time</p>
            <span className="action-arrow">→</span>
          </div>

          {/* Favorites Card */}
          <div
            className="action-card"
            onClick={() => handleActionClick('favorites')}
          >
            <div className="action-icon">❤️</div>
            <h3>Favorites</h3>
            <p>View your saved products</p>
            <span className="action-arrow">→</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Section - Shows what user has been doing */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">

          {/* Activity Item 1 */}
          <div className="activity-item">
            <div className="activity-icon">✨</div>
            <div className="activity-content">
              <h4>New recommendation available</h4>
              <p>Based on your recent skin analysis</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>

          {/* Activity Item 2 */}
          <div className="activity-item">
            <div className="activity-icon">📝</div>
            <div className="activity-content">
              <h4>Profile updated</h4>
              <p>You updated your skin concerns</p>
              <span className="activity-time">1 day ago</span>
            </div>
          </div>

          {/* Activity Item 3 */}
          <div className="activity-item">
            <div className="activity-icon">🛍️</div>
            <div className="activity-content">
              <h4>Product added to favorites</h4>
              <p>CeraVe Hydrating Cleanser</p>
              <span className="activity-time">3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Dashboard
