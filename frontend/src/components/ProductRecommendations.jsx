import { useState, useEffect } from 'react'
import SkincareAPI from '../services/api'
import './ProductRecommendations.css'

function ProductRecommendations({ onProductSelect, onBack }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {

    testAPIConnectivity()
    loadRecommendations()
  }, [])

  async function testAPIConnectivity() {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://skincare-api.herokuapp.com'}/products?limit=1`)

      if (response.ok) {
        await response.json()
      }
    } catch (error) {
      // API connectivity test failed
    }
  }

  async function loadRecommendations() {
    setLoading(true)
    setError('')

    try {
      const skinConcerns = ['hydrating', 'gentle']
      const skinType = 'normal'
      const maxProducts = 12

      const data = await SkincareAPI.getRecommendations(skinConcerns, skinType, maxProducts)

      if (data && data.success === false) {
        setError(data.error || 'Failed to load recommendations. Please try again.')
        setProducts([])
      } else if (Array.isArray(data)) {
        setProducts(data)
      } else {
        setError('Received unexpected data format from search API.')
        setProducts([])
        setProducts([])
      }
    } catch (err) {
      setError(`Search failed: ${err.message}. Please try again.`)
      setProducts([])
    }

    setLoading(false)
  }

  async function handleSearch(event) {
    event.preventDefault()
    if (!searchQuery.trim()) {
      return
    }

    setIsSearching(true)
    setError('')

    try {
      const maxResults = 12
      const data = await SkincareAPI.searchProducts(searchQuery, maxResults)

      if (data && data.success === false) {
        setError(data.error || 'Search failed. Please try again.')
        setProducts([])
      } else if (Array.isArray(data)) {
        setProducts(data)
      } else {
        setError('Received unexpected data format from search API.')
        setProducts([])
      }
    } catch (err) {
      setError(`Search failed: ${err.message}. Please try again.`)
      setProducts([])
    }

    setIsSearching(false)
  }

  async function searchForProductType(productType) {
    setIsSearching(true)
    setError('')

    try {
      const maxResults = 12
      const data = await SkincareAPI.searchProducts(productType, maxResults)

      if (data && data.success === false) {
        setError(data.error || 'Search failed. Please try again.')
        setProducts([])
      } else if (Array.isArray(data)) {
        setProducts(data)
      } else {
        setError('Received unexpected data format from search API.')
        setProducts([])
      }
    } catch (err) {
      setError(`Search failed: ${err.message}. Please try again.`)
      setProducts([])
    }

    setIsSearching(false)
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

  function getTopThreeIngredients(ingredientList) {
    const firstThree = ingredientList.slice(0, 3)
    return firstThree.join(', ')
  }

  if (loading) {
    return (
      <div className="recommendations">
        <div className="recommendations-header">
          <button className="btn btn-back" onClick={onBack}>
            ← Back to Dashboard
          </button>
          <h2>Your Personalized Recommendations</h2>
        </div>
        <div className="loading">Loading recommendations...</div>
      </div>
    )
  }

  return (
    <div className="recommendations">
      <div className="recommendations-header">
        {/* Back button */}
        <button className="btn btn-back" onClick={onBack}>
          ← Back to Dashboard
        </button>

        <h2>Your Personalized Recommendations</h2>
        <p>Based on your skin profile, here are products we recommend for you:</p>

        {/* Search form */}
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products, brands, or ingredients..."
              className="search-input"
            />
            <button
              type="submit"
              className="btn btn-primary search-btn"
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Quick filter buttons */}
        <div className="filter-buttons">
          <button
            className="btn btn-secondary"
            onClick={loadRecommendations}
          >
            Show Recommendations
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => searchForProductType('serum')}
          >
            Serums
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => searchForProductType('moisturizer')}
          >
            Moisturizers
          </button>
        </div>
      </div>

      {/* Show error message if there is one */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadRecommendations} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      )}

      {/* Products grid */}
      <div className="products-grid">
        {/* If no products found, show message */}
        {products.length === 0 && !loading ? (
          <div className="no-products">
            <p>No products found. Try a different search term.</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className="product-card">
              {/* Product image placeholder */}
              <div className="product-image">
                <div className="placeholder-image">
                  <span className="product-icon">🧴</span>
                </div>
              </div>
              {/* Product information */}
              <div className="product-info">
                <h3>{makeProductNameNice(product.name)}</h3>
                <p className="brand">{makeBrandNameNice(product.brand)}</p>
                <p className="ingredients">
                  <strong>Key Ingredients:</strong> {getTopThreeIngredients(product.ingredient_list)}
                </p>
                <p className="ingredient-count">
                  {product.ingredient_list.length} total ingredients
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => onProductSelect(product)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ProductRecommendations
