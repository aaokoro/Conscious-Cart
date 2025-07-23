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
  const [evictionPolicies, setEvictionPolicies] = useState([]);
  const [currentPolicy, setCurrentPolicy] = useState('');
  const [policyDescriptions, setPolicyDescriptions] = useState({});
  const [customWeights, setCustomWeights] = useState({
    recency: 0.6,
    frequency: 0.3,
    age: 0.1
  });

  const [filters, setFilters] = useState({
    skinType: '',
    skinConcern: '',
    product_type: '',
    product_category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    maxRating: '',
    selectedTags: []
  });

  // State for dynamic data
  const [productTypes, setProductTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  const [sortField, setSortField] = useState('rating');
  const [sortDirection, setSortDirection] = useState('desc');

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadFilteredProducts();
    fetchProductMetadata();
    fetchEvictionPolicies();
  }, [page, limit]);

  // Fetch product types, brands, and tags from the API
  async function fetchProductMetadata() {
    try {
      // Fetch product types
      const typesResponse = await fetch('/api/products/types');
      if (typesResponse.ok) {
        const types = await typesResponse.json();
        setProductTypes(types);
      }

      // Fetch brands
      const brandsResponse = await fetch('/api/products/brands');
      if (brandsResponse.ok) {
        const brandsData = await brandsResponse.json();
        setBrands(brandsData);
      }

      // Fetch tags
      const tagsResponse = await fetch('/api/products/tags');
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setAvailableTags(tagsData);
      }
    } catch (err) {
      // Set default values if API fails
      setProductTypes(['foundation', 'blush', 'bronzer', 'lipstick', 'mascara', 'eyeshadow', 'eyeliner']);
      setBrands([]);
      setAvailableTags([]);
    }
  }

  async function loadFilteredProducts() {
    setLoading(true);
    setError('');

    const startTime = performance.now();

    try {
      const queryParams = new URLSearchParams();

      // Handle special case for selectedTags
      if (filters.selectedTags && filters.selectedTags.length > 0) {
        queryParams.append('selectedTags', filters.selectedTags.join(','));
      }

      // Add all other filters
      Object.entries(filters).forEach(([key, value]) => {
        if (key !== 'selectedTags' && value !== '' && value !== false && value !== null && value !== undefined) {
          // Convert filter names to match makeup API parameters
          let apiKey = key;

          // Map our filter names to makeup API parameter names
          if (key === 'minPrice') apiKey = 'price_greater_than';
          if (key === 'maxPrice') apiKey = 'price_less_than';
          if (key === 'minRating') apiKey = 'rating_greater_than';
          if (key === 'maxRating') apiKey = 'rating_less_than';

          queryParams.append(apiKey, value);
        }
      });

      // Add sort parameters
      // Map our sort fields to makeup API sort parameters
      let apiSortField = sortField;
      if (sortField === 'name') apiSortField = 'product_name';
      if (sortField === 'price') apiSortField = 'price';
      if (sortField === 'rating') apiSortField = 'rating';

      queryParams.append('sort_by', apiSortField);
      queryParams.append('sort_direction', sortDirection);

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

  async function fetchEvictionPolicies() {
    try {
      const response = await fetch('/api/filtered-products/cache-policies');

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      setEvictionPolicies(data.policies || []);
      setCurrentPolicy(data.current || '');
      setPolicyDescriptions(data.descriptions || {});
    } catch (err) {
    }
  }

  async function changeEvictionPolicy(policy) {
    try {
      const payload = { policy };

      // Add weights if using custom policy
      if (policy === 'custom') {
        payload.weights = customWeights;
      }

      const response = await fetch('/api/filtered-products/cache-policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      setCurrentPolicy(result.policy);

      // Refresh cache stats to show the change
      loadCacheStats();
    } catch (err) {
      setError(`Failed to change eviction policy: ${err.message}`);
    }
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

            {/* Product Type Filter */}
            <div className="filter-group">
              <label htmlFor="product_type">Product Type</label>
              <select
                id="product_type"
                name="product_type"
                value={filters.product_type}
                onChange={handleFilterChange}
              >
                <option value="">All Product Types</option>
                {productTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="filter-group">
              <label htmlFor="brand">Brand</label>
              <select
                id="brand"
                name="brand"
                value={filters.brand}
                onChange={handleFilterChange}
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>
                    {brand.charAt(0).toUpperCase() + brand.slice(1)}
                  </option>
                ))}
              </select>
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

            {/* Rating Max Filter */}
            <div className="filter-group">
              <label htmlFor="maxRating">Max Rating</label>
              <input
                type="number"
                id="maxRating"
                name="maxRating"
                value={filters.maxRating}
                onChange={handleFilterChange}
                placeholder="Max rating"
                min="0"
                max="5"
                step="0.5"
              />
            </div>

            {/* Tag Selection */}
            <div className="filter-group full-width">
              <label>Product Tags</label>
              <div className="tags-container">
                {availableTags.map(tag => (
                  <label key={tag} className="tag-checkbox">
                    <input
                      type="checkbox"
                      name={tag}
                      checked={filters.selectedTags.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            selectedTags: [...prev.selectedTags, tag]
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            selectedTags: prev.selectedTags.filter(t => t !== tag)
                          }));
                        }
                      }}
                    />
                    {tag}
                  </label>
                ))}
              </div>
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
                  minRating: '',
                  maxRating: '',
                  product_type: '',
                  product_category: '',
                  selectedTags: []
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
            <div className="cache-stats-grid">
              <div className="cache-stat-group">
                <h4>Size</h4>
                <p>Current: {cacheStats.size} entries</p>
                <p>Maximum: {cacheStats.maxSize} entries</p>
                <p>Utilization: {cacheStats.utilization}</p>
              </div>

              <div className="cache-stat-group">
                <h4>Performance</h4>
                <p>Hits: {cacheStats.hits}</p>
                <p>Misses: {cacheStats.misses}</p>
                <p>Hit Rate: {cacheStats.hitRate}</p>
              </div>

              <div className="cache-stat-group">
                <h4>Eviction</h4>
                <p>Policy: {cacheStats.evictionPolicy?.toUpperCase()}</p>
                <p>Evictions: {cacheStats.evictions}</p>
                <p>Expirations: {cacheStats.expirations}</p>
                <p>TTL: {cacheStats.defaultTTL / 1000} seconds</p>
              </div>
            </div>

            {/* Eviction Policy Controls */}
            <div className="eviction-policy-controls">
              <h4>Change Eviction Policy</h4>
              <div className="policy-buttons">
                {evictionPolicies.map(policy => (
                  <button
                    key={policy}
                    className={`btn ${currentPolicy === policy ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => changeEvictionPolicy(policy)}
                    title={policyDescriptions[policy]}
                  >
                    {policy.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Custom Policy Weights (only shown when custom policy is selected) */}
              {currentPolicy === 'custom' && (
                <div className="custom-weights">
                  <h5>Custom Policy Weights</h5>
                  <div className="weight-sliders">
                    <div className="weight-slider">
                      <label>Recency: {customWeights.recency.toFixed(2)}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={customWeights.recency}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setCustomWeights(prev => ({
                            ...prev,
                            recency: newValue,
                            // Adjust other weights to ensure they sum to 1
                            frequency: (1 - newValue) * (prev.frequency / (prev.frequency + prev.age)),
                            age: (1 - newValue) * (prev.age / (prev.frequency + prev.age))
                          }));
                        }}
                      />
                    </div>

                    <div className="weight-slider">
                      <label>Frequency: {customWeights.frequency.toFixed(2)}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={customWeights.frequency}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setCustomWeights(prev => ({
                            ...prev,
                            frequency: newValue,
                            // Adjust other weights to ensure they sum to 1
                            recency: (1 - newValue) * (prev.recency / (prev.recency + prev.age)),
                            age: (1 - newValue) * (prev.age / (prev.recency + prev.age))
                          }));
                        }}
                      />
                    </div>

                    <div className="weight-slider">
                      <label>Age: {customWeights.age.toFixed(2)}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={customWeights.age}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setCustomWeights(prev => ({
                            ...prev,
                            age: newValue,
                            // Adjust other weights to ensure they sum to 1
                            recency: (1 - newValue) * (prev.recency / (prev.recency + prev.frequency)),
                            frequency: (1 - newValue) * (prev.frequency / (prev.recency + prev.frequency))
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={() => changeEvictionPolicy('custom')}
                  >
                    Apply Custom Weights
                  </button>
                </div>
              )}

              <div className="policy-descriptions">
                <h5>Policy Descriptions</h5>
                <ul>
                  {Object.entries(policyDescriptions).map(([policy, description]) => (
                    <li key={policy}>
                      <strong>{policy.toUpperCase()}</strong>: {description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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
                      <img
                        src="https://cdn.shopify.com/s/files/1/0593/2187/6633/collections/gua-sha-lady-placeholder_f387e950-9165-4436-99b7-cc7498ea2376.jpg?v=1638000265"
                        alt="Makeup product placeholder"
                      />
                    </div>
                  </div>
                  {/* Product information */}
                  <div className="product-info">
                    <h3>{formatProductName(product.name)}</h3>
                    <p className="brand">{formatBrandName(product.brand)}</p>
                    <p className="price">${parseFloat(product.price).toFixed(2)}</p>
                    <p className="rating">Rating: {product.rating} / 5</p>
                    {/* Display product type if available */}
                    {product.product_type && (
                      <p className="product-type">
                        <span className="type-badge">{product.product_type}</span>
                      </p>
                    )}

                    {/* Display product tags if available */}
                    {product.product_tags && Array.isArray(product.product_tags) && product.product_tags.length > 0 && (
                      <p className="product-tags">
                        <strong>Tags:</strong> {product.product_tags.join(', ')}
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
