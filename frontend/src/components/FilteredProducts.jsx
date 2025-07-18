import { useState, useEffect } from 'react';
import './ProductRecommendations.css';
import './FilteredProducts.css';


function FilteredProducts({ onProductSelect, onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cacheStats, setCacheStats] = useState(null);
  const [showCacheStats, setShowCacheStats] = useState(false);
  const [queryTime, setQueryTime] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);

  const [filters, setFilters] = useState({
    skinType: '',
    skinConcern: '',
    isSustainable: false,
    isVegan: false,
    brand: '',
    minPrice: '',
    maxPrice: '',
    minRating: ''
  });

  const [sortField, setSortField] = useState('rating');
  const [sortDirection, setSortDirection] = useState('desc');

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadFilteredProducts();
  }, [page, limit]);

  async function loadFilteredProducts() {
    setLoading(true);
    setError('');

    const startTime = performance.now();

    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== false) {
          queryParams.append(key, value);
        }
      });

      // Add sort
      queryParams.append('sort', `${sortField}:${sortDirection}`);

      // Add pagination
      queryParams.append('page', page);
      queryParams.append('limit', limit);

      // Make API request
      const response = await fetch(`/api/filtered-products?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Update state with products and pagination info
      setProducts(data.products || []);
      setTotalProducts(data.pagination?.total || 0);
      setTotalPages(data.pagination?.pages || 1);

      // Calculate query time
      const endTime = performance.now();
      setQueryTime(endTime - startTime);

    } catch (err) {
      setError(`Failed to load products: ${err.message}`);
      setProducts([]);
    }

    setLoading(false);
  }

  async function loadCacheStats() {
    try {
      const response = await fetch('/api/filtered-products/cache-stats');

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const stats = await response.json();
      setCacheStats(stats);
      setShowCacheStats(true);
    } catch (err) {
      setError(`Failed to load cache statistics: ${err.message}`);
    }
  }

  async function clearCache() {
    try {
      const response = await fetch('/api/filtered-products/clear-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      loadCacheStats();

      loadFilteredProducts();
    } catch (err) {
      setError(`Failed to clear cache: ${err.message}`);
    }
  }

  function handleFilterChange(e) {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function handleSortChange(e) {
    setSortField(e.target.value);
  }

  function handleSortDirectionChange(e) {
    setSortDirection(e.target.value);
  }

  function applyFiltersAndSort(e) {
    e.preventDefault();
    setPage(1);
    loadFilteredProducts();
  }

  function goToPage(newPage) {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }

  function formatProductName(name) {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function formatBrandName(brand) {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  }

  function getTopThreeIngredients(ingredientList) {
    if (!Array.isArray(ingredientList)) return 'No ingredients listed';
    return ingredientList.slice(0, 3).join(', ');
  }

  return (
    <div className="recommendations">
      <div className="recommendations-header">
        {/* Back button */}
        <button className="btn btn-back" onClick={onBack}>
          ← Back to Dashboard
        </button>

        <h2>Product Filtering & Sorting with Caching</h2>
        <p>
          Filter and sort products with intelligent caching for improved performance.
          {queryTime && (
            <span className="query-time"> Query time: {queryTime.toFixed(2)}ms</span>
          )}
        </p>

        {/* Filter form */}
        <form onSubmit={applyFiltersAndSort} className="filter-form">
          <div className="filter-grid">
            {/* Skin Type Filter */}
            <div className="filter-group">
              <label htmlFor="skinType">Skin Type</label>
              <select
                id="skinType"
                name="skinType"
                value={filters.skinType}
                onChange={handleFilterChange}
              >
                <option value="">All Skin Types</option>
                <option value="oily">Oily</option>
                <option value="dry">Dry</option>
                <option value="combination">Combination</option>
                <option value="normal">Normal</option>
                <option value="sensitive">Sensitive</option>
              </select>
            </div>

            {/* Skin Concern Filter */}
            <div className="filter-group">
              <label htmlFor="skinConcern">Skin Concern</label>
              <select
                id="skinConcern"
                name="skinConcern"
                value={filters.skinConcern}
                onChange={handleFilterChange}
              >
                <option value="">All Concerns</option>
                <option value="acne">Acne</option>
                <option value="aging">Aging</option>
                <option value="dryness">Dryness</option>
                <option value="sensitivity">Sensitivity</option>
                <option value="hyperpigmentation">Hyperpigmentation</option>
                <option value="redness">Redness</option>
              </select>
            </div>

            {/* Brand Filter */}
            <div className="filter-group">
              <label htmlFor="brand">Brand</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={filters.brand}
                onChange={handleFilterChange}
                placeholder="Enter brand name"
              />
            </div>

            {/* Price Range Filters */}
            <div className="filter-group">
              <label htmlFor="minPrice">Min Price</label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min price"
                min="0"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="maxPrice">Max Price</label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max price"
                min="0"
              />
            </div>

            {/* Rating Filter */}
            <div className="filter-group">
              <label htmlFor="minRating">Min Rating</label>
              <input
                type="number"
                id="minRating"
                name="minRating"
                value={filters.minRating}
                onChange={handleFilterChange}
                placeholder="Min rating"
                min="0"
                max="5"
                step="0.5"
              />
            </div>

            {/* Checkbox Filters */}
            <div className="filter-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isSustainable"
                  checked={filters.isSustainable}
                  onChange={handleFilterChange}
                />
                Sustainable
              </label>
            </div>

            <div className="filter-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isVegan"
                  checked={filters.isVegan}
                  onChange={handleFilterChange}
                />
                Vegan
              </label>
            </div>

            {/* Sort Controls */}
            <div className="filter-group">
              <label htmlFor="sortField">Sort By</label>
              <select
                id="sortField"
                value={sortField}
                onChange={handleSortChange}
              >
                <option value="rating">Rating</option>
                <option value="price">Price</option>
                <option value="name">Name</option>
                <option value="brand">Brand</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sortDirection">Direction</label>
              <select
                id="sortDirection"
                value={sortDirection}
                onChange={handleSortDirectionChange}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="filter-actions">
            <button type="submit" className="btn btn-primary">
              Apply Filters
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFilters({
                  skinType: '',
                  skinConcern: '',
                  isSustainable: false,
                  isVegan: false,
                  brand: '',
                  minPrice: '',
                  maxPrice: '',
                  minRating: ''
                });
                setSortField('rating');
                setSortDirection('desc');
              }}
            >
              Reset Filters
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadCacheStats}
            >
              {showCacheStats ? 'Refresh Cache Stats' : 'Show Cache Stats'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={clearCache}
            >
              Clear Cache
            </button>
          </div>
        </form>

        {/* Cache Statistics */}
        {showCacheStats && cacheStats && (
          <div className="cache-stats">
            <h3>Cache Statistics</h3>
            <p>Cache Size: {cacheStats.size} entries</p>
            <p>Max Size: {cacheStats.maxSize} entries</p>
            <p>Default TTL: {cacheStats.defaultTTL / 1000} seconds</p>
          </div>
        )}
      </div>

      {/* Show error message if there is one */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadFilteredProducts} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {loading && <div className="loading">Loading products...</div>}

      {/* Products grid */}
      {!loading && (
        <>
          <div className="results-summary">
            Showing {products.length} of {totalProducts} products
          </div>

          <div className="products-grid">
            {/* If no products found, show message */}
            {products.length === 0 ? (
              <div className="no-products">
                <p>No products found matching your filters.</p>
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
                    <h3>{formatProductName(product.name)}</h3>
                    <p className="brand">{formatBrandName(product.brand)}</p>
                    <p className="price">${parseFloat(product.price).toFixed(2)}</p>
                    <p className="rating">Rating: {product.rating} / 5</p>
                    <p className="ingredients">
                      <strong>Key Ingredients:</strong> {getTopThreeIngredients(product.ingredients || product.ingredient_list)}
                    </p>
                    {product.isSustainable && <span className="tag sustainable">Sustainable</span>}
                    {product.isVegan && <span className="tag vegan">Vegan</span>}
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

          {/* Pagination controls */}
          <div className="pagination">
            <button
              onClick={() => goToPage(1)}
              disabled={page === 1}
              className="btn btn-secondary"
            >
              First
            </button>
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="btn btn-secondary"
            >
              Next
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={page === totalPages}
              className="btn btn-secondary"
            >
              Last
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default FilteredProducts;
