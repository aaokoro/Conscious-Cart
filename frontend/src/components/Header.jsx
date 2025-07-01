import './Header.css'

function Header({ user, onLogout, onNavigate }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>SkinCare App</h1>
        </div>

        <nav className="nav">
          <button
            className="nav-button"
            onClick={() => onNavigate('dashboard')}
          >
            Dashboard
          </button>
          <button
            className="nav-button"
            onClick={() => onNavigate('recommendations')}
          >
            Recommendations
          </button>
          <button
            className="nav-button"
            onClick={() => onNavigate('profile')}
          >
            Profile
          </button>
        </nav>

        <div className="user-section">
          <span className="user-name">
            Welcome, {user?.name || 'User'}
          </span>
          <button
            className="logout-button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
