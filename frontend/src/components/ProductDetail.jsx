// Import React tools we need
import { useState } from 'react'
import './ProductDetail.css'

// This component shows detailed information about a single product
function ProductDetail({ product, onBack }) {
  // State variables to track what user is doing
  const [showAllIngredients, setShowAllIngredients] = useState(false) // Should we show all ingredients?
  const [addedToFavorites, setAddedToFavorites] = useState(false) // Did user add to favorites?

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

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1)
      capitalizedWords.push(capitalizedWord)
    }

    return capitalizedWords.join(' ')
  }

  function makeBrandNameNice(brand) {
    return brand.charAt(0).toUpperCase() + brand.slice(1)
  }

  function handleAddToFavorites() {
    setAddedToFavorites(true)

    setTimeout(() => {
      setAddedToFavorites(false)
    }, 2000)
  }

  function getKeyIngredients() {
    const firstFive = []
    for (let i = 0; i < 5 && i < product.ingredient_list.length; i++) {
      firstFive.push(product.ingredient_list[i])
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
            <button
              className={`btn btn-primary btn-large ${addedToFavorites ? 'btn-success' : ''}`}
              onClick={handleAddToFavorites}
              disabled={addedToFavorites}
            >
              {addedToFavorites ? '✓ Added to Favorites!' : '❤️ Add to Favorites'}
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
