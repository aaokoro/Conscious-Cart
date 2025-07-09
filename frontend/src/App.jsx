import { useState, useEffect } from 'react'
import './App.css'
import { AUTH_CONFIG } from './config/constants.js'

// Components
import Header from './components/Header'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import ProductRecommendations from './components/ProductRecommendations'
import ProductDetail from './components/ProductDetail'
import Profile from './components/Profile'
import Favorites from './components/Favorites'

function App() {
  const [currentView, setCurrentView] = useState('login')
  const [user, setUser] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
    if (token) {
      try {
        if (token.trim().length > 0) {
          // Validate token with backend
          validateToken(token)
        } else {
          localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
          setCurrentView('login')
        }
      } catch (error) {
        localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
        setCurrentView('login')
      }
    }
  }, [])

  const validateToken = async (token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setCurrentView('dashboard')
      } else {
        // Token is invalid, remove it and show login
        localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
        setCurrentView('login')
      }
    } catch (error) {
      localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
      setCurrentView('login')
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentView('dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
    setCurrentView('login')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        )
      case 'register':
        return (
          <Register
            onRegister={handleLogin}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            onNavigate={setCurrentView}
          />
        )
      case 'recommendations':
        return (
          <ProductRecommendations
            onProductSelect={(product) => {
              setSelectedProduct(product)
              setCurrentView('product-detail')
            }}
            onBack={() => setCurrentView('dashboard')}
          />
        )
      case 'product-detail':
        return (
          <ProductDetail
            product={selectedProduct}
            onBack={() => setCurrentView('recommendations')}
          />
        )
      case 'profile':
        return (
          <Profile
            user={user}
            onBack={() => setCurrentView('dashboard')}
          />
        )
      case 'favorites':
        return (
          <Favorites
            onBack={() => setCurrentView('dashboard')}
            onProductSelect={(product) => {
              setSelectedProduct(product)
              setCurrentView('product-detail')
            }}
          />
        )
      default:
        return <div>Page not found</div>
    }
  }

  return (
    <div className="app">
      {user && (
        <Header
          user={user}
          onLogout={handleLogout}
          onNavigate={setCurrentView}
        />
      )}
      <main className="main-content">
        {renderCurrentView()}
      </main>
    </div>
  )
}

export default App
