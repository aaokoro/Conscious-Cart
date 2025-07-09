import React, { useState, useEffect } from 'react'
import './Favorites.css'
import { AUTH_CONFIG, ERROR_MESSAGES } from '../config/constants.js'

function Favorites({ onBack, onProductSelect }) {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)

      if (!token) {
        setError(ERROR_MESSAGES.AUTHENTICATION_REQUIRED)
        setLoading(false)
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFavorites(data)
      } else {
        setError('Failed to load favorites')
      }
    } catch (err) {
      setError('Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (productId) => {
    try {
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/favorites/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setFavorites(favorites.filter(product => product.id !== productId))
      }
    } catch (err) {
      
    }
  }

  if (loading) {
    return (
      <div className="favorites">
        <div className="favorites-header">
          <button className="back-button" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h1>Your Favorites</h1>
        </div>
        <div className="loading">Loading your favorites...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="favorites">
        <div className="favorites-header">
          <button className="back-button" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h1>Your Favorites</h1>
        </div>
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div className="favorites">
      <div className="favorites-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1>Your Favorites</h1>
        <p className="favorites-subtitle">
          {favorites.length} saved product{favorites.length !== 1 ? 's' : ''}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <div className="empty-icon">❤️</div>
          <h2>No favorites yet</h2>
          <p>Start exploring products and add them to your favorites!</p>
          <button className="btn btn-primary" onClick={() => onBack()}>
            Discover Products
          </button>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((product) => (
            <div key={product.id} className="favorite-card">
              <div className="favorite-header">
                <h3 className="product-name">{product.name}</h3>
                <button
                  className="remove-favorite"
                  onClick={() => removeFavorite(product.id)}
                  title="Remove from favorites"
                >
                  ×
                </button>
              </div>

              <div className="product-brand">{product.brand}</div>

              <div className="product-price">${product.price}</div>

              <div className="product-rating">
                <span className="rating-stars">
                  {'★'.repeat(Math.floor(product.rating))}
                  {'☆'.repeat(5 - Math.floor(product.rating))}
                </span>
                <span className="rating-number">({product.rating})</span>
              </div>

              <p className="product-description">{product.description}</p>

              <div className="product-tags">
                {product.skinTypes?.map((type, index) => (
                  <span key={index} className="tag skin-type">{type}</span>
                ))}
                {product.isSustainable && (
                  <span className="tag sustainable">🌱 Sustainable</span>
                )}
              </div>

              <button
                className="btn btn-primary view-product"
                onClick={() => onProductSelect && onProductSelect(product)}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Favorites
