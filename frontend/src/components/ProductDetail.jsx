import { useState, useEffect } from 'react'
import SkincareAPI from '../services/api'
import './ProductDetail.css'

function ProductDetail({ product, onBack }) {
  const [showAllIngredients, setShowAllIngredients] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)
  const [favoriteError, setFavoriteError] = useState(null)

  // Check favorite status when component loads
  useEffect(() => {
    if (product && product.id) {
      checkFavoriteStatus()
    }
  }, [product])

  async function checkFavoriteStatus() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return // User not logged in, skip favorite check

      const response = await SkincareAPI.checkFavoriteStatus(product.id)
      if (response && !response.error) {
        setIsFavorite(response.isFavorite)
      }
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }

  // If no product was passed to this component, show error
  if (!product) {
    return (
      <div className="product-detail">
        <button className="btn btn-back" onClick={onBack}>
          ← Back to Recommendations
        </button>
        <div className="error">Product not found</div>
      </div>
    )
  }

  function makeProductNameNice(name) {
    const words = name.split(' ')
    const capitalizedWords = []

    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const word = words[wordIndex]
      const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1)
      capitalizedWords.push(capitalizedWord)
    }

    return capitalizedWords.join(' ')
  }

  function makeBrandNameNice(brand) {
    return brand.charAt(0).toUpperCase() + brand.slice(1)
  }

  async function handleAddToFavorites() {
    const token = localStorage.getItem('token')
    if (!token) {
      setFavoriteError('Please log in to add favorites')
      return
    }

    setIsLoadingFavorite(true)
    setFavoriteError(null)

    try {
      let response
      if (isFavorite) {
        // Remove from favorites
        response = await SkincareAPI.removeFromFavorites(product.id)
      } else {
        // Add to favorites
        response = await SkincareAPI.addToFavorites(product.id)
      }

      if (response && !response.error) {
        setIsFavorite(!isFavorite)
      } else {
        setFavoriteError(response?.error || 'Failed to update favorites')
      }
    } catch (error) {
      console.error('Error updating favorites:', error)
      setFavoriteError('Failed to update favorites. Please try again.')
    } finally {
      setIsLoadingFavorite(false)
    }
  }

  function getKeyIngredients() {
    const firstFive = []
    for (let ingredientIndex = 0; ingredientIndex < 5 && ingredientIndex < product.ingredient_list.length; ingredientIndex++) {
      firstFive.push(product.ingredient_list[ingredientIndex])
    }
    return firstFive
  }

  function getProductCategory() {
    const productName = product.name.toLowerCase()

    if (productName.includes('cleanser') || productName.includes('wash')) {
      return 'Cleanser'
    }
    if (productName.includes('serum')) {
      return 'Serum'
    }
    if (productName.includes('moisturizer') || productName.includes('cream')) {
      return 'Moisturizer'
    }
    if (productName.includes('toner')) {
      return 'Toner'
    }
    if (productName.includes('mask')) {
      return 'Mask'
    }
    if (productName.includes('oil')) {
      return 'Oil'
    }
    if (productName.includes('sunscreen') || productName.includes('spf')) {
      return 'Sunscreen'
    }

    return 'Skincare Product'
  }

  function toggleShowAllIngredients() {
    if (showAllIngredients) {
      setShowAllIngredients(false)
    } else {
      setShowAllIngredients(true)
    }
  }

  return (
    <div className="product-detail">
      <div className="product-detail-header">
        {/* Back button */}
        <button className="btn btn-back" onClick={onBack}>
          ← Back to Recommendations
        </button>
      </div>

      <div className="product-detail-content">
        {/* Product image section */}
        <div className="product-image-large">
          <div className="placeholder-image-large">
            <span className="product-icon-large">🧴</span>
          </div>
        </div>

        {/* Product information section */}
        <div className="product-info-detailed">
          {/* Product header with name and brand */}
          <div className="product-header">
            <h1>{makeProductNameNice(product.name)}</h1>
            <p className="brand-large">{makeBrandNameNice(product.brand)}</p>
            <div className="product-category">
              <span className="category-badge">{getProductCategory()}</span>
            </div>
          </div>

          {/* Product statistics */}
          <div className="product-stats">
            <div className="stat-item">
              <span className="stat-number">{product.ingredient_list.length}</span>
              <span className="stat-label">Ingredients</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">#{product.id}</span>
              <span className="stat-label">Product ID</span>
            </div>
          </div>

          {/* Product description */}
          <div className="product-description">
            <h3>About This Product</h3>
            <p>
              This {getProductCategory().toLowerCase()} from {makeBrandNameNice(product.brand)} is formulated with{' '}
              {product.ingredient_list.length} carefully selected ingredients to provide effective skincare benefits.
            </p>
            <p>
              Perfect for those looking for quality skincare products with transparent ingredient lists.
              Each ingredient has been chosen for its specific skincare properties and benefits.
            </p>
          </div>

          {/* Ingredients section */}
          <div className="product-ingredients">
            <h3>Key Ingredients</h3>

            {/* Show first 5 ingredients as tags */}
            <div className="ingredients-list">
              {getKeyIngredients().map((ingredient, index) => (
                <span key={index} className="ingredient-tag">
                  {ingredient}
                </span>
              ))}
            </div>

            {/* Button to show/hide all ingredients */}
            <button
              className="btn btn-secondary ingredients-toggle"
              onClick={toggleShowAllIngredients}
            >
              {showAllIngredients
                ? 'Show Less'
                : `View All ${product.ingredient_list.length} Ingredients`
              }
            </button>

            {/* Show all ingredients if user clicked the button */}
            {showAllIngredients && (
              <div className="all-ingredients">
                <h4>Complete Ingredient List</h4>
                <div className="ingredients-grid">
                  {product.ingredient_list.map((ingredient, index) => (
                    <span key={index} className="ingredient-item">
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product benefits section */}
          <div className="product-benefits">
            <h3>Why Choose This Product</h3>
            <ul>
              <li>Transparent ingredient list with {product.ingredient_list.length} components</li>
              <li>Quality formulation from {makeBrandNameNice(product.brand)}</li>
              <li>Suitable for skincare enthusiasts who value ingredient transparency</li>
              <li>Part of a comprehensive skincare database</li>
            </ul>
          </div>

          {/* Action buttons section */}
          <div className="action-section">
            {favoriteError && (
              <div className="error-message" style={{ marginBottom: '1rem', color: '#e74c3c', fontSize: '0.9rem' }}>
                {favoriteError}
              </div>
            )}

            <button
              className={`btn btn-large ${isFavorite ? 'btn-success' : 'btn-primary'}`}
              onClick={handleAddToFavorites}
              disabled={isLoadingFavorite}
            >
              {isLoadingFavorite ? (
                '⏳ Loading...'
              ) : isFavorite ? (
                '💔 Remove from Favorites'
              ) : (
                '❤️ Add to Favorites'
              )}
            </button>

            <button className="btn btn-secondary btn-large">
              🔍 Find Similar Products
            </button>
          </div>

          {/* Footer with disclaimer */}
          <div className="product-footer">
            <p className="disclaimer">
              <strong>Note:</strong> This product information is sourced from a skincare database.
              Always patch test new products and consult with a dermatologist for personalized advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ProductDetail
