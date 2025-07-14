import { API_CONFIG, AUTH_CONFIG, ERROR_MESSAGES } from '../config/constants.js'

const API_WEBSITE = import.meta.env.VITE_API_URL || import.meta.env.VITE_FALLBACK_API_URL || 'http://localhost:5000'

function handleApiError() {
  return {
    success: false,
    error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
    data: null
  }
}


async function getAllProducts(maxProducts = API_CONFIG.DEFAULT_PAGE_SIZE, pageNumber = API_CONFIG.DEFAULT_PAGE_NUMBER) {
  try {
    const requestUrl = `${API_WEBSITE}/products?limit=${maxProducts}&page=${pageNumber}`

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
    const requestUrl = `${API_WEBSITE}/products/${productId}`

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

    const requestUrl = `${API_WEBSITE}/product?q=${safeSearchText}&limit=${maxResults}&page=${pageNumber}`

    const response = await fetch(requestUrl)

    if (!response.ok) {
      throw new Error(`Search failed! Status: ${response.status}`)
    }

    return await response.json()

  } catch (error) {
    return handleApiError(error, 'Search products')
  }
}

async function getAllIngredients() {
  try {
    const requestUrl = `${API_WEBSITE}/ingredients`

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

    const requestUrl = `${API_WEBSITE}/ingredient?q=${safeSearchText}&limit=${maxResults}&page=${pageNumber}`

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
    const requestUrl = `${API_WEBSITE}/products`

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

async function getRecommendations(_skinConcerns = [], _skinType = '', maxProducts = API_CONFIG.RECOMMENDATIONS_LIMIT) {
  try {
    // For recommendations, return all products instead of trying to match specific criteria
    // This gives users a good overview of available products
    // Note: _skinConcerns and _skinType parameters are reserved for future implementation
    return await getAllProducts(maxProducts, 1)
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

    const requestUrl = `${API_WEBSITE}/favorites`

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

    const requestUrl = `${API_WEBSITE}/favorites/${productId}`

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

    const requestUrl = `${API_WEBSITE}/favorites`

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

    const requestUrl = `${API_WEBSITE}/favorites/check/${productId}`

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
  checkFavoriteStatus
}

export default SkincareAPI
