import { useState, useEffect } from 'react'
import SkincareAPI from '../services/api'
import './ProductRecommendations.css'

function ProductRecommendations({ onProductSelect, onBack, user }) {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/health`)

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
      // Get direct API products without any transformations
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/products`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const apiData = await response.json();

      const apiProducts = Array.isArray(apiData) ? apiData :
                         (apiData.products ? apiData.products : []);

      const token = localStorage.getItem('auth_token');
      let userProfile = {};
      if (token) {
        try {
          const profileResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/skincare-profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (profileResponse.ok) {
            userProfile = await profileResponse.json();
          }
        } catch (err) {
          // Error loading user profile
        }
      }

      // Calculate match scores for each product
      const productsWithScores = apiProducts.map(product => {
        // Calculate a match score based on skin type and concerns
        let score = 0;
        let explanation = '';

        // Simple matching algorithm
        if (product.skinTypes && product.skinTypes.includes(userProfile.skinType)) {
          score += 0.3;
          explanation = 'Matches your skin type';
        }

        if (product.skinConcerns && userProfile.skinConcerns) {
          const matchingConcerns = product.skinConcerns.filter(
            concern => userProfile.skinConcerns.includes(concern)
          );
          if (matchingConcerns.length > 0) {
            score += 0.2 * matchingConcerns.length;
            explanation = explanation ?
              `${explanation} and addresses ${matchingConcerns.length} of your concerns` :
              `Addresses ${matchingConcerns.length} of your concerns`;
          }
        }

        if (userProfile.sustainabilityPreference && product.isSustainable) {
          score += 0.2;
          explanation = explanation ?
            `${explanation} and matches sustainability preference` :
            'Matches your sustainability preference';
        }

        return {
          product,
          score,
          explanation,
          confidence: 0.5
        };
      });

      // Sort products by score (highest first)
      productsWithScores.sort((a, b) => b.score - a.score);

      setProducts(productsWithScores);
    } catch (err) {
      setError(`Failed to load products: ${err.message}. Please try again.`);
      setProducts([]);
    }

    setLoading(false);
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
    if (!name) return 'Unnamed Product';

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

  function getTopThreeIngredients(product) {
    // Check for ingredients in both possible field names
    const ingredientList = product.ingredient_list || product.ingredients || [];

    if (!Array.isArray(ingredientList) || ingredientList.length === 0) {
      return 'No ingredients listed';
    }

    const firstThree = ingredientList.slice(0, 3);
    return firstThree.join(', ');
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
          products.map((item, index) => {
            // Handle both direct product objects and nested product objects
            const product = item.product ? item.product : item;

            return (
              <div key={product._id || product.id || index} className="product-card">
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
                    <strong>Key Ingredients:</strong> {getTopThreeIngredients(product)}
                  </p>
                  <p className="ingredient-count">
                    {(() => {
                      const ingredientList = product.ingredient_list || product.ingredients || [];
                      return Array.isArray(ingredientList) && ingredientList.length > 0 ?
                        `${ingredientList.length} total ingredients` :
                        'No ingredients listed';
                    })()}
                  </p>
                  {item.score && (
                    <p className="match-score">
                      <strong>Match Score:</strong> {Math.round(item.score * 100)}%
                      {item.explanation && <span className="match-reason"> - {item.explanation}</span>}
                    </p>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={() => onProductSelect(product)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}

export default ProductRecommendations
