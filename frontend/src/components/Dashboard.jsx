import React from 'react'

function Dashboard({ user, onNavigate }) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome to Conscious Cart</h1>
        {user && <p>Hello, {user.name || user.email}!</p>}
      </div>

      <div className="dashboard-content">
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Get Recommendations</h3>
            <p>Discover personalized skincare products based on your skin type and concerns.</p>
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('recommendations')}
            >
              View Recommendations
            </button>
          </div>

          <div className="dashboard-card">
            <h3>Your Profile</h3>
            <p>Manage your skin profile and preferences.</p>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('profile')}
            >
              View Profile
            </button>
          </div>

          <div className="dashboard-card">
            <h3>Skin Analysis</h3>
            <p>Take our comprehensive skin analysis quiz.</p>
            <button className="btn btn-secondary">
              Start Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
