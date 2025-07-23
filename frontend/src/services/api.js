import { API_CONFIG, AUTH_CONFIG, ERROR_MESSAGES, EXTERNAL_API_CONFIG } from '../config/constants.js'

// Use relative URLs for API requests to work with the proxy configuration in vite.config.js
function handleApiError(error, operation) {
  return {
    success: false,
    error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
    data: null
  }
}


async function getAllProducts(maxProducts = API_CONFIG.DEFAULT_PAGE_SIZE, pageNumber = API_CONFIG.DEFAULT_PAGE_NUMBER) {
  try {
    const requestUrl = `/products?limit=${maxProducts}&page=${pageNumber}`

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed! Status: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    return handleApiError(error, 'Get all products')
  }
}

async function getProductById(productId) {
  try {
    const requestUrl = `/products/${productId}`

    const response = await fetch(requestUrl)

    if (!response.ok) {
      throw new Error(`API request failed! Status: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    return handleApiError(error, 'Get product by ID')
  }
}

async function searchProducts(searchText, maxResults = API_CONFIG.MAX_SEARCH_RESULTS, pageNumber = API_CONFIG.DEFAULT_PAGE_NUMBER) {
  try {
    const safeSearchText = encodeURIComponent(searchText)

    // Update the endpoint to match the backend route
    const requestUrl = `/api/product?q=${safeSearchText}&limit=${maxResults}&page=${pageNumber}`

    const response = await fetch(requestUrl)

    if (!response.ok) {
      throw new Error(`Search failed! Status: ${response.status}`)
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      // Fallback to products endpoint
      return getAllProducts(maxResults)
    }

    const data = await response.json()
    return data

  } catch (error) {
    // Fallback to products endpoint on error
    try {
      return await getAllProducts(maxResults)
    } catch (fallbackError) {
      return handleApiError(fallbackError, 'Search products fallback')
    }
  }
}

async function getAllIngredients() {
  try {
    const requestUrl = `/ingredients`

    const response = await fetch(requestUrl)

    if (!response.ok) {
      throw new Error(`API request failed! Status: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    return handleApiError(error, 'Get all ingredients')
  }
}

async function searchIngredients(searchText, maxResults = API_CONFIG.MAX_SEARCH_RESULTS, pageNumber = API_CONFIG.DEFAULT_PAGE_NUMBER) {
  try {
    const safeSearchText = encodeURIComponent(searchText)

    const requestUrl = `/ingredient?q=${safeSearchText}&limit=${maxResults}&page=${pageNumber}`

    const response = await fetch(requestUrl)

    if (!response.ok) {
      throw new Error(`Search failed! Status: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    return handleApiError(error, 'Search ingredients')
  }
}

async function addProduct(productInfo) {
  try {
    const requestUrl = `/products`

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productInfo)
    })

    if (!response.ok) {
      throw new Error(`Failed to add product! Status: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    return handleApiError(error, 'Add product')
  }
}

// Cache management functions
const ProductCache = {
  // Cache keys
  KEYS: {
    ALL_PRODUCTS: 'cachedProducts',
    FILTERED_BY_TAG: 'cachedProductsByTag_',
    SORTED_BY_TAG: 'cachedProductsSortedByTag_'
  },

  // Cache expiration time (5 minutes)
  EXPIRATION: 5 * 60 * 1000,

  // Get cached data if valid
  get: (key) => {
    try {
      const cachedData = localStorage.getItem(key);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const expirationTime = Date.now() - ProductCache.EXPIRATION;
        if (timestamp > expirationTime && Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (e) {
    }
    return null;
  },

  // Set cache data
  set: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
    }
  },

  // Clear all product caches
  clear: () => {
    try {
      // Get all localStorage keys
      const keys = Object.keys(localStorage);

      // Filter keys related to product caching
      const productCacheKeys = keys.filter(key =>
        key === ProductCache.KEYS.ALL_PRODUCTS ||
        key.startsWith(ProductCache.KEYS.FILTERED_BY_TAG) ||
        key.startsWith(ProductCache.KEYS.SORTED_BY_TAG)
      );

      // Remove each key
      productCacheKeys.forEach(key => localStorage.removeItem(key));

    } catch (e) {
    }
  }
};

async function getRecommendations(maxProducts = API_CONFIG.RECOMMENDATIONS_LIMIT) {
  try {
    // Check if we have cached products
    const cachedProducts = ProductCache.get(ProductCache.KEYS.ALL_PRODUCTS);
    if (cachedProducts) {
      return cachedProducts;
    }


    // Define multiple product types to fetch for more variety
    const productTypes = ['foundation', 'blush', 'bronzer', 'lipstick', 'mascara', 'eyeshadow', 'eyeliner'];
    const productsPerType = Math.ceil(maxProducts / productTypes.length);

    try {
      // Create promises for each product type
      const productPromises = productTypes.map(type =>
        fetch(`${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCTS}?product_type=${type}&limit=${productsPerType}`)
          .then(response => {
            if (!response.ok) throw new Error(`Failed to fetch ${type} products`);
            return response.json();
          })
          .catch(err => {
            return []; // Return empty array if this product type fails
          })
      );

      // Wait for all promises to resolve
      const productResults = await Promise.all(productPromises);

      // Combine all product types and limit to requested max
      const makeupData = productResults.flat().slice(0, maxProducts);
      if (makeupData.length > 0) {

        // Transform makeup API data to match our format with enhanced properties
        const transformedData = makeupData.map(product => ({
          id: product.id.toString(),
          name: product.name || 'Unknown Product',
          brand: product.brand || 'Unknown Brand',
          price: product.price || '0.0',
          rating: product.rating || 4.0,
          description: product.description || 'No description available',
          ingredient_list: [], // Don't use tag_list as ingredients
          product_tags: product.tag_list || [], // Store tags separately
          product_type: product.product_type || 'skincare',
          product_colors: product.product_colors || [],
          skinTypes: ['All'],
          skinConcerns: ['General'],
          isSustainable: false,
          image_link: product.image_link || `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`
        }));

        // Cache the products for future use
        localStorage.setItem('cachedProducts', JSON.stringify({
          products: transformedData,
          timestamp: Date.now()
        }));

        return transformedData;
      }
    } catch (error) {
      // Continue to next data source if this fails
    }

    try {
      const requestUrl = `/products?limit=${maxProducts}`;
      const response = await fetch(requestUrl);

      if (!response.ok) {
        throw new Error(`Backend request failed! Status: ${response.status}`);
      }

      const products = await response.json();

      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('No products returned from backend');
      }

      // Cache the products for future use
      localStorage.setItem('cachedProducts', JSON.stringify({
        products,
        timestamp: Date.now()
      }));

      return products;
    } catch (backendError) {
      // Return empty array if all methods fail
      return [];
    }
  } catch (error) {
    return handleApiError(error, 'Get recommendations')
  }
}

async function getProductsByIngredient(ingredientName, maxProducts = API_CONFIG.DEFAULT_PAGE_SIZE) {
  try {
    return await searchProducts(ingredientName, maxProducts, 1)
  } catch (error) {
    return handleApiError(error, 'Get products by ingredient')
  }
}

async function getTrendingProducts(maxProducts = API_CONFIG.TRENDING_PRODUCTS_LIMIT) {
  try {
    const randomPageNumber = Math.floor(Math.random() * 5) + 1

    return await getAllProducts(maxProducts, randomPageNumber)
  } catch (error) {
    return handleApiError(error, 'Get trending products')
  }
}

async function addToFavorites(productId) {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
    if (!token) {
      throw new Error(ERROR_MESSAGES.AUTHENTICATION_REQUIRED)
    }

    const requestUrl = `/favorites`

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${AUTH_CONFIG.TOKEN_HEADER_PREFIX} ${token}`
      },
      body: JSON.stringify({ productId })
    })

    if (!response.ok) {
      throw new Error(`Failed to add to favorites! Status: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    return handleApiError(error, 'Add to favorites')
  }
}

async function removeFromFavorites(productId) {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
    if (!token) {
      throw new Error(ERROR_MESSAGES.AUTHENTICATION_REQUIRED)
    }

    const requestUrl = `/favorites/${productId}`

    const response = await fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `${AUTH_CONFIG.TOKEN_HEADER_PREFIX} ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to remove from favorites! Status: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    return handleApiError(error, 'Remove from favorites')
  }
}

async function getFavorites() {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
    if (!token) {
      throw new Error(ERROR_MESSAGES.AUTHENTICATION_REQUIRED)
    }

    const requestUrl = `/favorites`

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Authorization': `${AUTH_CONFIG.TOKEN_HEADER_PREFIX} ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get favorites! Status: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    return handleApiError(error, 'Get favorites')
  }
}

async function checkFavoriteStatus(productId) {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY)
    if (!token) {
      throw new Error(ERROR_MESSAGES.AUTHENTICATION_REQUIRED)
    }

    const requestUrl = `/favorites/check/${productId}`

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Authorization': `${AUTH_CONFIG.TOKEN_HEADER_PREFIX} ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to check favorite status! Status: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    return handleApiError(error, 'Check favorite status')
  }
}

/**
 * Filter products by a specific tag
 * @param {string} tag - The tag to filter by
 * @param {number} maxProducts - Maximum number of products to return
 * @returns {Promise<Array>} - Filtered products
 */
async function getProductsByTag(tag) {
  try {
    // Check if we have cached filtered products for this tag
    const cacheKey = `${ProductCache.KEYS.FILTERED_BY_TAG}${tag}`;
    const cachedProducts = ProductCache.get(cacheKey);
    if (cachedProducts) {
      return cachedProducts;
    }

    // Get all products first
    const allProducts = await getRecommendations();

    // Filter products by tag
    const filteredProducts = allProducts.filter(product =>
      product.product_tags &&
      Array.isArray(product.product_tags) &&
      product.product_tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );


    // Cache the filtered products
    ProductCache.set(cacheKey, filteredProducts);

    return filteredProducts;
  } catch (error) {
    return handleApiError(error, `Get products by tag: ${tag}`);
  }
}

/**
 * Sort products by the presence of specific tags
 * @param {Array} products - The products to sort
 * @param {Array} priorityTags - Tags to prioritize in sorting
 * @returns {Array} - Sorted products
 */
function sortProductsByTags(products, priorityTags) {
  try {
    // Create a cache key based on the priority tags
    const tagKey = priorityTags.sort().join('_');
    const cacheKey = `${ProductCache.KEYS.SORTED_BY_TAG}${tagKey}`;

    // Check if we have cached sorted products for these tags
    const cachedSortedProducts = ProductCache.get(cacheKey);
    if (cachedSortedProducts) {
      return cachedSortedProducts;
    }

    // Sort products by the number of matching priority tags
    const sortedProducts = [...products].sort((a, b) => {
      const aTagCount = countMatchingTags(a, priorityTags);
      const bTagCount = countMatchingTags(b, priorityTags);
      return bTagCount - aTagCount; // Descending order
    });

    // Cache the sorted products
    ProductCache.set(cacheKey, sortedProducts);

    return sortedProducts;
  } catch (error) {
    return products; // Return original products on error
  }
}

/**
 * Count how many priority tags a product has
 * @param {Object} product - The product to check
 * @param {Array} priorityTags - Tags to check for
 * @returns {number} - Number of matching tags
 */
function countMatchingTags(product, priorityTags) {
  if (!product.product_tags || !Array.isArray(product.product_tags)) {
    return 0;
  }

  return product.product_tags.filter(tag =>
    priorityTags.some(priorityTag =>
      tag.toLowerCase() === priorityTag.toLowerCase()
    )
  ).length;
}

/**
 * Get all unique tags from all products
 * @returns {Promise<Array>} - Array of unique tags
 */
async function getAllTags() {
  try {
    // Get all products
    const allProducts = await getRecommendations();

    // Extract all tags
    const tagSet = new Set();
    allProducts.forEach(product => {
      if (product.product_tags && Array.isArray(product.product_tags)) {
        product.product_tags.forEach(tag => tagSet.add(tag));
      }
    });

    // Convert Set to Array and sort alphabetically
    const allTags = Array.from(tagSet).sort();

    return allTags;
  } catch (error) {
    return handleApiError(error, 'Get all tags');
  }
}

/**
 * Get popular tags based on frequency in products
 * @param {number} limit - Maximum number of tags to return
 * @returns {Promise<Array>} - Array of popular tags with counts
 */
async function getPopularTags(limit = 10) {
  try {
    // Get all products
    const allProducts = await getRecommendations();

    // Count tag occurrences
    const tagCounts = {};
    allProducts.forEach(product => {
      if (product.product_tags && Array.isArray(product.product_tags)) {
        product.product_tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Convert to array of objects and sort by count
    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);


    return popularTags;
  } catch (error) {
    return handleApiError(error, 'Get popular tags');
  }
}

const SkincareAPI = {
  getAllProducts,
  getProductById,
  searchProducts,
  getAllIngredients,
  searchIngredients,
  addProduct,
  getRecommendations,
  getProductsByIngredient,
  getTrendingProducts,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  checkFavoriteStatus,
  // New tag-based functions
  getProductsByTag,
  sortProductsByTags,
  getAllTags,
  getPopularTags,
  // Cache management
  clearProductCache: ProductCache.clear
}

export default SkincareAPI
