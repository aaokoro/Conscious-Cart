import { useState, useEffect } from 'react'
import SkincareAPI from '../services/api'
import { AUTH_CONFIG } from '../config/constants.js'

import './ProductDetail.css'

function ProductDetail({ product, onBack }) {
  const [showAllIngredients, setShowAllIngredients] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)
  const [favoriteError, setFavoriteError] = useState(null)

  useEffect(() => {
    if (product && product.id) {
      checkFavoriteStatus()
    }
  }, [product])

  async function checkFavoriteStatus() {
    try {
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
      if (!token) return // User not logged in, skip favorite check

      const response = await SkincareAPI.checkFavoriteStatus(product.id)
      if (response && !response.error) {
        setIsFavorite(response.isFavorite)
      }
    } catch (error) {
      // Error checking favorite status
    }
  }

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
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
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
      // Error updating favorites
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

  function handleFindSimilarProducts() {
    // Navigate back to recommendations to show similar products
    onBack()
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
              <span className="stat-number">#{product.id}</span>
              <span className="stat-label">Product ID</span>
            </div>
            {product.product_tags && product.product_tags.length > 0 && (
              <div className="stat-item">
                <span className="stat-number">{product.product_tags.length}</span>
                <span className="stat-label">Tags</span>
              </div>
            )}
            {product.product_colors && product.product_colors.length > 0 && (
              <div className="stat-item">
                <span className="stat-number">{product.product_colors.length}</span>
                <span className="stat-label">Colors</span>
              </div>
            )}
          </div>

          {/* Product description */}
          <div className="product-description">
            <h3>About This Product</h3>
            <p>
              This {getProductCategory().toLowerCase()} from {makeBrandNameNice(product.brand)} is a high-quality beauty product
              {product.product_type ? ` in the ${product.product_type} category` : ''}.
            </p>
            <p>
              {product.description || 'This product is designed to enhance your beauty routine with quality formulation and effective results.'}
            </p>
          </div>

          {/* No ingredients section as requested */}

          {/* Product Tags section - Display tags from makeup API */}
          <div className="product-tags">
            <h3>Product Tags</h3>
            {product.product_tags && product.product_tags.length > 0 ? (
              <div className="tags-list">
                {product.product_tags.map((tag, index) => (
                  <span key={index} className="product-tag">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p>No tags available for this product</p>
            )}
          </div>

          {/* Product Colors section - Display colors from makeup API */}
          {product.product_colors && product.product_colors.length > 0 && (
            <div className="product-colors">
              <h3>Available Colors</h3>
              <div className="color-swatches">
                {product.product_colors.map((color, index) => (
                  <div
                    key={index}
                    className="color-swatch"
                    style={{
                      backgroundColor: color.hex_value,
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      display: 'inline-block',
                      margin: '0 5px 5px 0',
                      border: '1px solid #ddd'
                    }}
                    title={color.colour_name || color.hex_value}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Product benefits section */}
          <div className="product-benefits">
            <h3>Why Choose This Product</h3>
            <ul>
              {product.product_tags && product.product_tags.length > 0 && (
                <li>Features {product.product_tags.length} product tags including {product.product_tags.slice(0, 2).join(', ')}</li>
              )}
              <li>Quality {product.product_type || 'beauty'} product from {makeBrandNameNice(product.brand)}</li>
              {product.product_colors && product.product_colors.length > 0 && (
                <li>Available in {product.product_colors.length} different colors/shades</li>
              )}
              <li>Part of a comprehensive beauty product database</li>
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

            <button
              className="btn btn-secondary btn-large"
              onClick={handleFindSimilarProducts}
            >
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
