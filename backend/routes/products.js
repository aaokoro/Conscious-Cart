const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const { EXTERNAL_API_CONFIG } = require('../config/constants');

const isMongoConnected = () => mongoose.connection.readyState === 1;


const logError = (location, err) => {
  const errorMsg = `Error in ${location}: ${err.message}`;
  return errorMsg;
};

let Product, Ingredient;
try {
  const models = require('../models');
  Product = models.Product;
  Ingredient = models.Ingredient;
} catch (err) {
  logError('Models import', err);
}



async function fetchProductsFromAPI(limit = 20) {
  console.log('Fetching products from API with limit:', limit);
  console.log('Primary API URL:', EXTERNAL_API_CONFIG.SKINCARE_API_PRODUCTS);

  // Try primary API (skincare-api)
  try {
    console.log('Attempting to fetch from primary API...');
    const response = await fetch(`${EXTERNAL_API_CONFIG.SKINCARE_API_PRODUCTS}?limit=${limit}`);
    console.log('Primary API response status:', response.status);

    if (!response.ok) {
      throw new Error(`Primary API responded with status: ${response.status}`);
    }

    const products = await response.json();
    console.log(`Primary API returned ${products.length} products`);

    return products.map(product => ({
      id: product.id.toString(),
      name: product.name || 'Unknown Product',
      brand: product.brand || 'Unknown Brand',
      price: '0.0',
      rating: 4.0,
      description: 'A skincare product with carefully selected ingredients',
      ingredient_list: product.ingredient_list || [],
      skinTypes: ['All'],
      skinConcerns: ['General'],
      isSustainable: false,
      image_link: product.image_link || 'https://cdn.shopify.com/s/files/1/0593/2187/6633/collections/gua-sha-lady-placeholder_f387e950-9165-4436-99b7-cc7498ea2376.jpg?v=1638000265'
    }));
  } catch (primaryErr) {
    console.error('Primary API error:', primaryErr.message);
    console.log('Backup API URL:', EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCTS);

    // If primary API fails, try backup API (makeup-api) with multiple product types
    try {
      console.log('Attempting to fetch from backup API with multiple product types...');

      // Define multiple product types to fetch for more variety
      const productTypes = ['foundation', 'blush', 'lipstick', 'mascara', 'eyeshadow'];
      const productsPerType = Math.ceil(limit / productTypes.length);

      // Create promises for each product type
      const productPromises = productTypes.map(type =>
        fetch(`${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCTS}?product_type=${type}&limit=${productsPerType}`)
          .then(response => {
            if (!response.ok) throw new Error(`Failed to fetch ${type} products`);
            return response.json();
          })
          .catch(err => {
            console.error(`Error fetching ${type} products:`, err);
            return []; // Return empty array if this product type fails
          })
      );

      // Wait for all promises to resolve
      const productResults = await Promise.all(productPromises);

      // Combine all product types and limit to requested max
      const backupProducts = productResults.flat().slice(0, limit);
      console.log(`Backup API returned ${backupProducts.length} products from multiple product types`);

      // Log a sample product to debug
      if (backupProducts.length > 0) {
        const sampleProduct = backupProducts[0];
        console.log('Sample makeup API product:', {
          id: sampleProduct.id,
          name: sampleProduct.name,
          brand: sampleProduct.brand,
          product_type: sampleProduct.product_type,
          tag_list: sampleProduct.tag_list,
          product_colors: sampleProduct.product_colors ? sampleProduct.product_colors.length : 0
        });
      }

      // Transform makeup API format to our application format with enhanced properties
      return backupProducts.map(product => ({
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
    } catch (backupErr) {
      console.error('Backup API error:', backupErr.message);

      // If both APIs fail, return empty array
      logError('fetchProductsFromAPI', `Primary API error: ${primaryErr.message}, Backup API error: ${backupErr.message}`);

      // Return seeded data as fallback
      console.log('Both APIs failed, returning seeded data as fallback');
      return [
        {
          id: "fallback1",
          name: "Gentle Hydrating Cleanser",
          brand: "CeraVe",
          price: "24.99",
          rating: 4.5,
          description: "A gentle, non-drying cleanser perfect for sensitive skin with ceramides and hyaluronic acid.",
          ingredient_list: ["water", "ceramides", "hyaluronic acid", "glycerin", "niacinamide"],
          skinTypes: ["sensitive", "dry"],
          skinConcerns: ["sensitivity", "dryness"],
          isSustainable: true,
          image_link: "https://via.placeholder.com/150?text=CeraVe+Cleanser"
        },
        {
          id: "fallback2",
          name: "Vitamin C Brightening Serum",
          brand: "SkinCeuticals",
          price: "39.99",
          rating: 4.8,
          description: "Intensive brightening serum with vitamin C and ferulic acid.",
          ingredient_list: ["l-ascorbic acid", "vitamin e", "ferulic acid", "water", "propylene glycol"],
          skinTypes: ["normal", "combination"],
          skinConcerns: ["hyperpigmentation", "aging"],
          isSustainable: false,
          image_link: "https://via.placeholder.com/150?text=SkinCeuticals+Serum"
        },
        {
          id: "fallback3",
          name: "Retinol 0.5% in Squalane",
          brand: "The Ordinary",
          price: "9.99",
          rating: 4.3,
          description: "A moderate-strength retinol formula to reduce signs of aging and improve skin texture.",
          ingredient_list: ["squalane", "retinol", "caprylic/capric triglyceride", "tocopherol"],
          skinTypes: ["normal", "combination", "oily"],
          skinConcerns: ["aging", "hyperpigmentation"],
          isSustainable: true,
          image_link: "https://via.placeholder.com/150?text=The+Ordinary+Retinol"
        },
        {
          id: "fallback4",
          name: "Ultra Facial Cream",
          brand: "Kiehl's",
          price: "32.00",
          rating: 4.7,
          description: "A 24-hour daily facial cream that leaves skin softer, smoother, and visibly healthier.",
          ingredient_list: ["water", "glycerin", "squalane", "olive fruit oil", "shea butter"],
          skinTypes: ["dry", "normal", "combination"],
          skinConcerns: ["dryness", "sensitivity"],
          isSustainable: false,
          image_link: "https://via.placeholder.com/150?text=Kiehls+Facial+Cream"
        },
        {
          id: "fallback5",
          name: "Salicylic Acid 2% Solution",
          brand: "The Ordinary",
          price: "6.50",
          rating: 4.2,
          description: "A direct acid exfoliant for blemish-prone skin to improve appearance of skin texture and clarity.",
          ingredient_list: ["water", "salicylic acid", "witch hazel", "glycerin"],
          skinTypes: ["oily", "combination"],
          skinConcerns: ["acne", "hyperpigmentation"],
          isSustainable: true,
          image_link: "https://via.placeholder.com/150?text=The+Ordinary+Salicylic"
        },
        {
          id: "fallback6",
          name: "Hydro Boost Water Gel",
          brand: "Neutrogena",
          price: "19.99",
          rating: 4.4,
          description: "A lightweight water gel that instantly quenches and continuously hydrates skin.",
          ingredient_list: ["water", "dimethicone", "glycerin", "hyaluronic acid", "olive extract"],
          skinTypes: ["normal", "combination", "oily"],
          skinConcerns: ["dryness"],
          isSustainable: false,
          image_link: "https://via.placeholder.com/150?text=Neutrogena+Hydro+Boost"
        },
        {
          id: "fallback7",
          name: "Niacinamide 10% + Zinc 1%",
          brand: "The Ordinary",
          price: "5.90",
          rating: 4.3,
          description: "A high-strength vitamin and mineral formula to reduce the appearance of blemishes and congestion.",
          ingredient_list: ["water", "niacinamide", "zinc pca", "glycerin", "tamarindus indica seed gum"],
          skinTypes: ["oily", "combination"],
          skinConcerns: ["acne", "redness"],
          isSustainable: true,
          image_link: "https://via.placeholder.com/150?text=The+Ordinary+Niacinamide"
        },
        {
          id: "fallback8",
          name: "Cicaplast Baume B5",
          brand: "La Roche-Posay",
          price: "14.99",
          rating: 4.8,
          description: "A multi-purpose balm that soothes and repairs dry, irritated skin.",
          ingredient_list: ["water", "glycerin", "panthenol", "shea butter", "zinc gluconate"],
          skinTypes: ["sensitive", "dry"],
          skinConcerns: ["sensitivity", "redness"],
          isSustainable: false,
          image_link: "https://via.placeholder.com/150?text=La+Roche+Posay+Cicaplast"
        },
        {
          id: "fallback9",
          name: "Hyaluronic Acid 2% + B5",
          brand: "The Ordinary",
          price: "7.80",
          rating: 4.4,
          description: "A hydration support formula with ultra-pure hyaluronic acid.",
          ingredient_list: ["water", "sodium hyaluronate", "panthenol", "ahnfeltia concinna extract"],
          skinTypes: ["all", "dry", "normal", "combination", "oily", "sensitive"],
          skinConcerns: ["dryness"],
          isSustainable: true,
          image_link: "https://via.placeholder.com/150?text=The+Ordinary+Hyaluronic"
        },
        {
          id: "fallback10",
          name: "Anthelios Melt-In Milk Sunscreen SPF 100",
          brand: "La Roche-Posay",
          price: "24.99",
          rating: 4.6,
          description: "A fast-absorbing, high SPF sunscreen with advanced UVA/UVB protection.",
          ingredient_list: ["avobenzone", "homosalate", "octisalate", "octocrylene", "water", "glycerin"],
          skinTypes: ["all", "sensitive"],
          skinConcerns: ["sensitivity", "aging"],
          isSustainable: false,
          image_link: "https://via.placeholder.com/150?text=La+Roche+Posay+Sunscreen"
        },
        {
          id: "fallback11",
          name: "Midnight Recovery Concentrate",
          brand: "Kiehl's",
          price: "52.00",
          rating: 4.7,
          description: "A replenishing nighttime facial oil that works with the skin's natural nocturnal activity.",
          ingredient_list: ["squalane", "lavender oil", "evening primrose oil", "jojoba seed oil"],
          skinTypes: ["all", "dry", "normal", "combination"],
          skinConcerns: ["dryness", "aging"],
          isSustainable: false,
          image_link: "https://via.placeholder.com/150?text=Kiehls+Midnight+Recovery"
        },
        {
          id: "fallback12",
          name: "Lactic Acid 10% + HA",
          brand: "The Ordinary",
          price: "6.80",
          rating: 4.2,
          description: "A mild lactic acid superficial peeling formulation for improved skin tone and texture.",
          ingredient_list: ["water", "lactic acid", "sodium hyaluronate", "glycerin", "pentylene glycol"],
          skinTypes: ["normal", "combination", "oily"],
          skinConcerns: ["hyperpigmentation", "aging"],
          isSustainable: true,
          image_link: "https://via.placeholder.com/150?text=The+Ordinary+Lactic+Acid"
        },
        {
          id: "fallback13",
          name: "Toleriane Double Repair Face Moisturizer",
          brand: "La Roche-Posay",
          price: "19.99",
          rating: 4.5,
          description: "A daily facial moisturizer that helps restore skin's natural protective barrier.",
          ingredient_list: ["water", "glycerin", "ceramide-3", "niacinamide", "shea butter"],
          skinTypes: ["sensitive", "dry", "normal", "combination"],
          skinConcerns: ["sensitivity", "dryness"],
          isSustainable: false,
          image_link: "https://via.placeholder.com/150?text=La+Roche+Posay+Toleriane"
        },
        {
          id: "fallback14",
          name: "Effaclar Duo (+) Acne Treatment",
          brand: "La Roche-Posay",
          price: "29.99",
          rating: 4.3,
          description: "A dual action acne treatment that targets acne and marks.",
          ingredient_list: ["water", "glycerin", "niacinamide", "salicylic acid", "zinc pid"],
          skinTypes: ["oily", "combination"],
          skinConcerns: ["acne", "hyperpigmentation"],
          isSustainable: false,
          image_link: "https://via.placeholder.com/150?text=La+Roche+Posay+Effaclar"
        },
        {
          id: "fallback15",
          name: "Buffet",
          brand: "The Ordinary",
          price: "14.80",
          rating: 4.2,
          description: "A multi-technology peptide serum aimed at targeting multiple signs of aging.",
          ingredient_list: ["water", "glycerin", "matrixyl 3000 peptide complex", "hyaluronic acid", "amino acids"],
          skinTypes: ["all", "normal", "dry", "combination", "oily"],
          skinConcerns: ["aging"],
          isSustainable: true,
          image_link: "https://via.placeholder.com/150?text=The+Ordinary+Buffet"
        }
      ];
    }
  }
}

async function fetchIngredientsFromAPI(limit = 20) {
  try {
    const response = await fetch(`${EXTERNAL_API_CONFIG.SKINCARE_API_INGREDIENTS}?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Primary API responded with status: ${response.status}`);
    }

    const ingredients = await response.json();

    return ingredients.map(item => ({
      id: item.id.toString(),
      name: item.ingredient,
      benefits: [],
      category: 'skincare'
    }));
  } catch (primaryErr) {
    try {
      const backupResponse = await fetch(`${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCTS}?product_type=${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCT_TYPE}`);
      if (!backupResponse.ok) {
        throw new Error(`Backup API responded with status: ${backupResponse.status}`);
      }

      const products = await backupResponse.json();

      const uniqueIngredients = new Set();
      const ingredientsList = [];

      products.forEach(product => {
        if (product.tag_list && Array.isArray(product.tag_list)) {
          product.tag_list.forEach(tag => {
            if (!uniqueIngredients.has(tag)) {
              uniqueIngredients.add(tag);
              ingredientsList.push({
                id: ingredientsList.length + 1,
                name: tag,
                benefits: [],
                category: 'makeup'
              });
            }
          });
        }
      });

      return ingredientsList.slice(0, limit);
    } catch (backupErr) {

      logError('fetchIngredientsFromAPI', `Primary API error: ${primaryErr.message}, Backup API error: ${backupErr.message}`);
      return [];
    }
  }
}

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

router.get('/api/products', async (req, res) => {
  try {
    const { skinType, skinConcern, isSustainable, brand, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    const query = {};

    if (skinType) query.skinTypes = skinType;
    if (skinConcern) query.skinConcerns = skinConcern;
    if (isSustainable === 'true') query.isSustainable = true;
    if (brand) query.brand = brand;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }

    if (isMongoConnected() && Product) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const products = await Product.find(query)
        .sort({ rating: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      const total = await Product.countDocuments(query);

      respond(res, {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } else {
      const allProducts = await fetchProductsFromAPI();
      respond(res, {
        products: allProducts,
        pagination: {
          total: allProducts.length,
          page: 1,
          limit: 10,
          pages: 1
        }
      });
    }
  } catch (err) {
    logError('/api/products', err);
    error(res, 'Could not retrieve products');
  }
});

router.get('/api/products/:id', async (req, res) => {
  try {
    if (isMongoConnected() && Product) {
      const product = await Product.findById(req.params.id);
      if (!product) return error(res, 'Product not found', 404);
      respond(res, product);
    } else {
      const allProducts = await fetchProductsFromAPI();
      const product = allProducts.find(p => p.id === req.params.id);
      if (!product) return error(res, 'Product not found', 404);
      respond(res, product);
    }
  } catch (err) {
    logError('/api/products/:id', err);
    error(res, 'Could not retrieve product');
  }
});

router.get('/products', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);

    // Always try to fetch from the makeup API first for better product data
    try {
      console.log('Directly fetching from makeup API for enhanced product data');
      const makeupProducts = await fetchProductsFromAPI(limitNum);

      if (makeupProducts && makeupProducts.length > 0) {
        console.log(`Successfully fetched ${makeupProducts.length} products from makeup API`);

        // Log a sample product to verify data structure
        if (makeupProducts.length > 0) {
          console.log('Sample makeup product:', {
            id: makeupProducts[0].id,
            name: makeupProducts[0].name,
            brand: makeupProducts[0].brand,
            product_type: makeupProducts[0].product_type,
            product_tags: makeupProducts[0].product_tags ? makeupProducts[0].product_tags.length : 0,
            product_colors: makeupProducts[0].product_colors ? makeupProducts[0].product_colors.length : 0,
            image_link: makeupProducts[0].image_link
          });
        }

        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedProducts = makeupProducts.slice(startIndex, endIndex);
        return respond(res, paginatedProducts);
      }
    } catch (makeupError) {
      console.error('Error fetching from makeup API:', makeupError);
      // Continue to MongoDB if makeup API fails
    }

    // Fallback to MongoDB if makeup API fails or returns no products
    if (isMongoConnected() && Product) {
      console.log('Falling back to MongoDB for product data');
      const skip = (pageNum - 1) * limitNum;
      const products = await Product.find({})
        .sort({ rating: -1 })
        .limit(limitNum)
        .skip(skip);

      const formattedProducts = products.map(product => ({
        id: product._id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        rating: product.rating,
        description: product.description,
        ingredient_list: product.ingredients, // Map ingredients to ingredient_list for frontend compatibility
        skinTypes: product.skinTypes,
        skinConcerns: product.skinConcerns,
        isSustainable: product.isSustainable,
        reviewCount: product.reviewCount || 0,
        image_link: `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`
      }));

      respond(res, formattedProducts);
    } else {
      // If both makeup API and MongoDB fail, return seeded data
      console.log('Both makeup API and MongoDB failed, returning seeded data');
      const allProducts = await fetchProductsFromAPI();
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedProducts = allProducts.slice(startIndex, endIndex);
      respond(res, paginatedProducts);
    }
  } catch (err) {
    logError('/products', err);
    error(res, 'Could not retrieve products');
  }
});

router.get('/product', async (req, res) => {
  try {
    // Set proper content type header
    res.setHeader('Content-Type', 'application/json');

    const { q: searchQuery, limit = 20, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);

    if (isMongoConnected() && Product) {
      if (!searchQuery) {
        const products = await Product.find({})
          .sort({ rating: -1 })
          .limit(limitNum);

        const formattedProducts = products.map(product => ({
          id: product._id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          rating: product.rating,
          description: product.description,
          ingredient_list: product.ingredients,
          skinTypes: product.skinTypes,
          skinConcerns: product.skinConcerns,
          isSustainable: product.isSustainable
        }));

        return respond(res, formattedProducts);
      }

      const searchTerm = searchQuery.toLowerCase();
      const searchRegex = new RegExp(searchTerm, 'i');

      const products = await Product.find({
        $or: [
          { name: searchRegex },
          { brand: searchRegex },
          { ingredients: { $in: [searchRegex] } },
          { skinConcerns: { $in: [searchTerm] } },
          { skinTypes: { $in: [searchTerm] } }
        ]
      })
      .sort({ rating: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

      const formattedProducts = products.map(product => ({
        id: product._id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        rating: product.rating,
        description: product.description,
        ingredient_list: product.ingredients,
        skinTypes: product.skinTypes,
        skinConcerns: product.skinConcerns,
        isSustainable: product.isSustainable
      }));

      respond(res, formattedProducts);
    } else {
      // If MongoDB is not connected, use the mock data
      const allProducts = await fetchProductsFromAPI();

      if (!searchQuery) {
        return respond(res, allProducts.slice(0, limitNum));
      }

      const searchTerm = searchQuery.toLowerCase();
      const filteredProducts = allProducts.filter(product => {
        return (
          product.name.toLowerCase().includes(searchTerm) ||
          product.brand.toLowerCase().includes(searchTerm) ||
          (product.ingredient_list && product.ingredient_list.some(ingredient =>
            ingredient.toLowerCase().includes(searchTerm)
          )) ||
          (product.skinConcerns && product.skinConcerns.some(concern =>
            concern.toLowerCase().includes(searchTerm)
          )) ||
          (product.skinTypes && product.skinTypes.some(type =>
            type.toLowerCase().includes(searchTerm)
          ))
        );
      });

      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedResults = filteredProducts.slice(startIndex, endIndex);

      // Ensure we're sending JSON
      respond(res, paginatedResults);
    }
  } catch (err) {
    logError('/product search', err);
    // Make sure error response is also JSON
    error(res, 'Search failed');
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (isMongoConnected() && Product) {
      const product = await Product.findOne({ id: productId });
      if (!product) return error(res, 'Product not found', 404);
      respond(res, product);
    } else {
      const allProducts = await fetchProductsFromAPI();
      const product = allProducts.find(p => p.id === productId);

      if (!product) {
        return error(res, 'Product not found', 404);
      }

      respond(res, product);
    }
  } catch (err) {
    logError('/products/:id', err);
    error(res, 'Could not retrieve product');
  }
});

router.get('/ingredients', async (_req, res) => {
  try {
    if (isMongoConnected() && Ingredient) {
      const ingredients = await Ingredient.find({});
      respond(res, ingredients);
    } else {
      const ingredients = await fetchIngredientsFromAPI();
      respond(res, ingredients);
    }
  } catch (err) {
    logError('/ingredients', err);
    error(res, 'Could not retrieve ingredients');
  }
});

router.get('/ingredient', async (req, res) => {
  try {
    const { q: searchQuery, limit = 20 } = req.query;
    const limitNum = parseInt(limit);

    if (isMongoConnected() && Ingredient) {
      if (!searchQuery) {
        const ingredients = await Ingredient.find({}).limit(limitNum);
        return respond(res, ingredients);
      }

      const searchRegex = new RegExp(searchQuery.toLowerCase(), 'i');
      const ingredients = await Ingredient.find({
        $or: [
          { name: searchRegex },
          { benefits: { $in: [searchRegex] } },
          { category: searchRegex }
        ]
      }).limit(limitNum);

      respond(res, ingredients);
    } else {
      const allIngredients = await fetchIngredientsFromAPI();

      if (!searchQuery) {
        return respond(res, allIngredients.slice(0, limitNum));
      }

      const searchTerm = searchQuery.toLowerCase();
      const filteredIngredients = allIngredients.filter(ingredient => {
        return (
          ingredient.name.toLowerCase().includes(searchTerm) ||
          (ingredient.benefits && ingredient.benefits.some(benefit =>
            benefit.toLowerCase().includes(searchTerm)
          )) ||
          (ingredient.category && ingredient.category.toLowerCase().includes(searchTerm))
        );
      });

      respond(res, filteredIngredients.slice(0, limitNum));
    }
  } catch (err) {
    logError('/ingredient search', err);
    error(res, 'Ingredient search failed');
  }
});

// Route to get all product types from the makeup API
router.get('/api/products/types', async (_req, res) => {
  try {
    // Try to fetch from makeup API
    try {
      // Fetch a sample of products to extract types
      const response = await fetch(`${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCTS}`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const products = await response.json();

      // Extract unique product types
      const productTypesSet = new Set();
      products.forEach(product => {
        if (product.product_type) {
          productTypesSet.add(product.product_type);
        }
      });

      const productTypes = Array.from(productTypesSet).sort();
      respond(res, productTypes);
    } catch (apiError) {
      // Fallback to default product types
      console.error('Error fetching product types from API:', apiError);
      respond(res, [
        'blush', 'bronzer', 'eyebrow', 'eyeliner',
        'eyeshadow', 'foundation', 'lip_liner', 'lipstick',
        'mascara', 'nail_polish'
      ]);
    }
  } catch (err) {
    logError('/api/products/types', err);
    error(res, 'Could not retrieve product types');
  }
});

// Route to get all brands from the makeup API
router.get('/api/products/brands', async (_req, res) => {
  try {
    // Try to fetch from makeup API
    try {
      // Fetch a sample of products to extract brands
      const response = await fetch(`${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCTS}`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const products = await response.json();

      // Extract unique brands
      const brandsSet = new Set();
      products.forEach(product => {
        if (product.brand) {
          brandsSet.add(product.brand);
        }
      });

      const brands = Array.from(brandsSet).sort();
      respond(res, brands);
    } catch (apiError) {
      // Fallback to empty array
      console.error('Error fetching brands from API:', apiError);
      respond(res, []);
    }
  } catch (err) {
    logError('/api/products/brands', err);
    error(res, 'Could not retrieve brands');
  }
});

// Route to get all tags from the makeup API
router.get('/api/products/tags', async (_req, res) => {
  try {
    // Try to fetch from makeup API
    try {
      // Fetch a sample of products to extract tags
      const response = await fetch(`${EXTERNAL_API_CONFIG.MAKEUP_API_PRODUCTS}`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const products = await response.json();

      // Extract unique tags
      const tagsSet = new Set();
      products.forEach(product => {
        if (product.tag_list && Array.isArray(product.tag_list)) {
          product.tag_list.forEach(tag => {
            tagsSet.add(tag);
          });
        }
      });

      const tags = Array.from(tagsSet).sort();
      respond(res, tags);
    } catch (apiError) {
      // Fallback to default tags
      console.error('Error fetching tags from API:', apiError);
      respond(res, [
        'Canadian', 'CertClean', 'Chemical Free', 'Dairy Free',
        'EWG Verified', 'EcoCert', 'Fair Trade', 'Gluten Free',
        'Hypoallergenic', 'Natural', 'No Talc', 'Non-GMO',
        'Organic', 'Peanut Free Product', 'Sugar Free',
        'USDA Organic', 'Vegan', 'alcohol free',
        'cruelty free', 'oil free', 'purpicks',
        'silicone free', 'water free'
      ]);
    }
  } catch (err) {
    logError('/api/products/tags', err);
    error(res, 'Could not retrieve tags');
  }
});

module.exports = router;
