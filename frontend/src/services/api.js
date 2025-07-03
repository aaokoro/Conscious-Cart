const API_WEBSITE = 'https://skincare-api.herokuapp.com'

function handleApiError(error, context = 'API request') {
  const errorMessage = `${context} failed: ${error.message}`
  console.error(errorMessage, {
    timestamp: new Date().toISOString(),
    context,
    originalError: error
  })

  return {
    success: false,
    error: 'Service temporarily unavailable. Please try again later.',
    data: null
  }
}


async function getAllProducts(maxProducts = 20, pageNumber = 1) {
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

async function searchProducts(searchText, maxResults = 20, pageNumber = 1) {
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

async function searchIngredients(searchText, maxResults = 20, pageNumber = 1) {
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

async function getRecommendations(skinConcerns = [], skinType = '', maxProducts = 12) {
  try {
    const thingsToSearchFor = []

    for (let concernIndex = 0; concernIndex < skinConcerns.length; concernIndex++) {
      if (skinConcerns[concernIndex]) {
        thingsToSearchFor.push(skinConcerns[concernIndex])
      }
    }
    if (skinType) {
      thingsToSearchFor.push(skinType)
    }

    thingsToSearchFor.push('serum')
    thingsToSearchFor.push('moisturizer')
    thingsToSearchFor.push('cleanser')

    if (thingsToSearchFor.length === 0) {
      return await getAllProducts(maxProducts, 1)
    }

    const searchText = thingsToSearchFor.join(' ')
    return await searchProducts(searchText, maxProducts, 1)

  } catch (error) {
    return handleApiError(error, 'Get recommendations')
  }
}

async function getProductsByIngredient(ingredientName, maxProducts = 20) {
  try {
    return await searchProducts(ingredientName, maxProducts, 1)
  } catch (error) {
    return handleApiError(error, 'Get products by ingredient')
  }
}

async function getTrendingProducts(maxProducts = 10) {
  try {
    const randomPageNumber = Math.floor(Math.random() * 5) + 1

    return await getAllProducts(maxProducts, randomPageNumber)
  } catch (error) {
    return handleApiError(error, 'Get trending products')
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
  getTrendingProducts
}

export default SkincareAPI
