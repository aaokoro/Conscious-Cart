const API_WEBSITE = 'https://skincare-api.herokuapp.com'

const BACKUP_PRODUCTS = [
  {
    id: 1,
    brand: "cerave",
    name: "hydrating cleanser",
    ingredient_list: ["water", "glycerin", "cocamidopropyl betaine", "sodium lauroyl sarcosinate", "peg-150 pentaerythrityl tetrastearate", "niacinamide", "peg-6 caprylic/capric glycerides", "sodium hyaluronate", "ceramide np", "ceramide ap", "ceramide eop", "carbomer", "methylparaben", "sodium chloride", "sodium lauroyl lactylate", "cholesterol", "phenoxyethanol", "disodium edta", "dipotassium phosphate", "sodium phosphate", "tocopherol", "phytosphingosine", "xanthan gum", "ethylhexylglycerin"]
  },
  {
    id: 2,
    brand: "the ordinary",
    name: "niacinamide 10% + zinc 1%",
    ingredient_list: ["aqua", "niacinamide", "pentylene glycol", "zinc pca", "dimethyl isosorbide", "tamarindus indica seed gum", "xanthan gum", "isoceteth-20", "ethoxydiglycol", "phenoxyethanol", "chlorphenesin"]
  },
  {
    id: 3,
    brand: "neutrogena",
    name: "hydro boost water gel",
    ingredient_list: ["water", "dimethicone", "glycerin", "cetearyl olivate", "sorbitan olivate", "phenoxyethanol", "synthetic beeswax", "trehalose", "carbomer", "sodium hyaluronate", "ethylhexylglycerin", "c12-20 alkyl glucoside", "sodium hydroxide", "caprylyl glycol"]
  },
  {
    id: 4,
    brand: "la roche posay",
    name: "toleriane caring wash",
    ingredient_list: ["aqua", "glycerin", "sodium cocoyl isethionate", "arginine", "peg-200 hydrogenated glyceryl palmate", "coco-betaine", "peg-7 glyceryl cocoate", "phenoxyethanol", "peg-120 methyl glucose dioleate", "niacinamide", "sodium chloride", "sodium benzoate", "citric acid", "zinc gluconate", "copper gluconate", "manganese gluconate"]
  },
  {
    id: 5,
    brand: "olay",
    name: "regenerist micro-sculpting serum",
    ingredient_list: ["water", "dimethicone", "isohexadecane", "glycerin", "isopropyl isostearate", "polyacrylamide", "olea europaea fruit oil", "tocopheryl acetate", "sodium pca", "c13-14 isoparaffin", "dimethiconol", "laureth-7", "cyclopentasiloxane", "phenoxyethanol", "methylparaben", "ethylparaben", "propylparaben", "butylparaben", "isobutylparaben", "fragrance"]
  },
  {
    id: 6,
    brand: "aveeno",
    name: "daily moisturizing lotion",
    ingredient_list: ["water", "glycerin", "distearyldimonium chloride", "petrolatum", "isopropyl palmitate", "cetyl alcohol", "avena sativa kernel flour", "benzyl alcohol", "sodium chloride"]
  }
]

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
    console.warn('Main API not working, using backup data:', error.message)

    const productsToReturn = []
    for (let i = 0; i < maxProducts && i < BACKUP_PRODUCTS.length; i++) {
      productsToReturn.push(BACKUP_PRODUCTS[i])
    }
    return productsToReturn
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
    throw error
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
    throw error
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
    throw error
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
    throw error
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
    throw error
  }
}

async function getRecommendations(skinConcerns = [], skinType = '', maxProducts = 12) {
  try {
    const thingsToSearchFor = []

    for (let i = 0; i < skinConcerns.length; i++) {
      if (skinConcerns[i]) { // Only add if it's not empty
        thingsToSearchFor.push(skinConcerns[i])
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
    return await getAllProducts(maxProducts, 1)
  }
}

async function getProductsByIngredient(ingredientName, maxProducts = 20) {
  try {
    return await searchProducts(ingredientName, maxProducts, 1)
  } catch (error) {
    throw error
  }
}

async function getTrendingProducts(maxProducts = 10) {
  try {
    const randomPageNumber = Math.floor(Math.random() * 5) + 1

    return await getAllProducts(maxProducts, randomPageNumber)
  } catch (error) {
    throw error
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
