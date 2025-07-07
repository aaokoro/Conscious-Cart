import { useState, useEffect } from 'react'
import './App.css'

// Components
import Header from './components/Header'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import ProductRecommendations from './components/ProductRecommendations'
import ProductDetail from './components/ProductDetail'
import Profile from './components/Profile'

function App() {
  const [currentView, setCurrentView] = useState('login')
  const [user, setUser] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {

      try {
        if (token.trim().length > 0) {
          setCurrentView('dashboard')
        } else {
          localStorage.removeItem('authToken')
          setCurrentView('login')
        }
      } catch (error) {
        localStorage.removeItem('authToken')
        setCurrentView('login')
      }
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentView('dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('authToken')
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
