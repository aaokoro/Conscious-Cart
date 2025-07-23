import { useState, useEffect, useRef } from 'react'
import SkincareAPI from '../services/api'
import './ProductRecommendations.css'
import { AUTH_CONFIG } from '../config/constants'

function ProductRecommendations({ onProductSelect, onBack, userProfile }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [popularTags, setPopularTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [loadingTags, setLoadingTags] = useState(false)

  // Track view start time for calculating time spent on products
  const viewStartTime = useRef({});
  const isAuthenticated = useRef(!!localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY));

  useEffect(() => {
    testAPIConnectivity()
    loadRecommendations()
    loadPopularTags()

    // Track page view for recommendations
    if (isAuthenticated.current) {
      trackInteraction('view', null, { page: 'recommendations' });
    }
  }, [])

  async function loadPopularTags() {
    setLoadingTags(true)
    try {
      const tags = await SkincareAPI.getPopularTags(15) // Get top 15 tags
      setPopularTags(tags)
    } catch (err) {
    } finally {
      setLoadingTags(false)
    }
  }

  async function handleTagSelect(tag) {
    setLoading(true)
    setError('')

    try {
      if (selectedTags.includes(tag)) {
        setSelectedTags(prev => prev.filter(t => t !== tag))

        // If no tags left selected, load all recommendations
        if (selectedTags.length <= 1) {
          await loadRecommendations()
          return
        }

        // Otherwise filter by remaining tags
        const newSelectedTags = selectedTags.filter(t => t !== tag)
        const filteredProducts = await filterProductsByTags(newSelectedTags)
        setProducts(filteredProducts)
      }
      // Otherwise add the tag to selected tags
      else {
        setSelectedTags(prev => [...prev, tag])
        const filteredProducts = await filterProductsByTags([...selectedTags, tag])
        setProducts(filteredProducts)
      }
    } catch (err) {
      setError('Failed to filter products by tag. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter products by selected tags
  async function filterProductsByTags(tags) {
    if (!tags || tags.length === 0) {
      return await SkincareAPI.getRecommendations()
    }

    // Get all products first
    const allProducts = await SkincareAPI.getRecommendations()

    // Filter products that have ALL selected tags
    return allProducts.filter(product =>
      tags.every(tag =>
        product.product_tags &&
        Array.isArray(product.product_tags) &&
        product.product_tags.some(t => t.toLowerCase() === tag.toLowerCase())
      )
    )
  }

  async function testAPIConnectivity() {
    try {
      const response = await fetch(`/products?limit=1`);
      await response.json();
    } catch (error) {
    }
  }

  // Track user interactions with products
  async function trackInteraction(interactionType, productId, metadata = {}) {
    if (!isAuthenticated.current) return;

    try {
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
      if (!token) return;

      const requestUrl = `/api/recommendations/track-interaction`;

      let timeSpent = 0;
      if (interactionType === 'view' && productId && viewStartTime.current[productId]) {
        timeSpent = Math.floor((Date.now() - viewStartTime.current[productId]) / 1000);
        delete viewStartTime.current[productId];
      }

      await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${AUTH_CONFIG.TOKEN_HEADER_PREFIX} ${token}`
        },
        body: JSON.stringify({
          productId,
          interactionType,
          timeSpent,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {

    }
  }

  async function loadRecommendations() {
    setLoading(true)
    setError('')

    try {
      // Use a reasonable number of products for good performance
      const maxProducts = 50 // Show more products but not too many

      // Clear any existing data first
      setProducts([])

      const data = await SkincareAPI.getRecommendations(maxProducts)

      if (data && data.success === false) {
        setError(data.error || 'Failed to load recommendations. Please try again.')
        setProducts([])
      } else if (Array.isArray(data)) {
        // Validate each product has the required fields
        const validProducts = data.filter(product => {
          if (!product || typeof product !== 'object') {
            return false
          }
          return true
        })

        setProducts(validProducts)
      } else {
        setError('Received unexpected data format from search API.')
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

  // Start tracking time spent viewing a product
  function startProductViewTimer(productId) {
    viewStartTime.current[productId] = Date.now();
  }

  // Handle product selection with interaction tracking
  function handleProductSelect(product) {
    // Track the product view interaction
    if (isAuthenticated.current) {
      trackInteraction('click', product.id);
    }

    // Call the original onProductSelect function
    onProductSelect(product);
  }

  function makeProductNameNice(name) {
    if (!name) return 'Unknown Product';

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
    if (!brand) return 'Unknown Brand';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  }

  function getTopThreeIngredients(ingredientList) {
    // Check if ingredientList exists and is an array
    if (!ingredientList || !Array.isArray(ingredientList)) {
      return 'No ingredients listed';
    }
    const firstThree = ingredientList.slice(0, 3);
    return firstThree.join(', ');
  }

  function getTopTags(tagList) {
    // Check if tagList exists and is an array
    if (!tagList || !Array.isArray(tagList)) {
      return 'No tags available';
    }
    // Show all tags instead of just the first two
    return tagList.join(', ');
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

        {/* Product type filter buttons */}
        <h3 className="filter-section-title">Filter by Product Type</h3>
        <div className="filter-buttons">
          <button
            className="btn btn-secondary"
            onClick={loadRecommendations}
          >
            Show All
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => searchForProductType('foundation')}
          >
            Foundation
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => searchForProductType('blush')}
          >
            Blush
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => searchForProductType('bronzer')}
          >
            Bronzer
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => searchForProductType('lipstick')}
          >
            Lipstick
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => searchForProductType('mascara')}
          >
            Mascara
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => searchForProductType('eyeshadow')}
          >
            Eyeshadow
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => searchForProductType('eyeliner')}
          >
            Eyeliner
          </button>
        </div>

        {/* Tag filter buttons */}
        <h3 className="filter-section-title">Filter by Tags</h3>
        <div className="tag-filters">
          {loadingTags ? (
            <p>Loading tags...</p>
          ) : popularTags.length > 0 ? (
            <div className="tag-buttons">
              {popularTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  className={`tag-button ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => handleTagSelect(tag)}
                >
                  {tag} ({count})
                </button>
              ))}
            </div>
          ) : (
            <p>No tags found</p>
          )}

          {selectedTags.length > 0 && (
            <div className="selected-tags">
              <p>Selected tags: {selectedTags.join(', ')}</p>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedTags([]);
                  loadRecommendations();
                }}
              >
                Clear Tags
              </button>
            </div>
          )}
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
              {/* Product image */}
              <div className="product-image">
                {product.image_link ? (
                  <img
                    src={product.image_link}
                    alt={product.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      // Use the new makeup placeholder image
                      e.target.src = "https://cdn.shopify.com/s/files/1/0593/2187/6633/collections/gua-sha-lady-placeholder_f387e950-9165-4436-99b7-cc7498ea2376.jpg?v=1638000265";
                    }}
                  />
                ) : (
                  <div className="placeholder-image">
                    <span className="product-icon">🧴</span>
                  </div>
                )}
              </div>
              {/* Product information */}
              <div className="product-info">
                <h3>{makeProductNameNice(product.name)}</h3>
                <p className="brand">{makeBrandNameNice(product.brand)}</p>

                {/* Display product type if available */}
                {product.product_type && (
                  <p className="product-type">
                    <span className="type-badge">{product.product_type}</span>
                  </p>
                )}

                {/* Display product tags if available */}
                {product.product_tags && Array.isArray(product.product_tags) && product.product_tags.length > 0 && (
                  <p className="product-tags">
                    <strong>Tags:</strong> {getTopTags(product.product_tags)}
                  </p>
                )}

                {/* Display color count if available */}
                {product.product_colors && Array.isArray(product.product_colors) && product.product_colors.length > 0 && (
                  <p className="color-count">
                    <strong>Colors:</strong> {product.product_colors.length} available
                  </p>
                )}

                <button
                  className="btn btn-primary"
                  onClick={() => handleProductSelect(product)}
                  onMouseEnter={() => startProductViewTimer(product.id)}
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
