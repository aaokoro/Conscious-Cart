const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const isMongoConnected = () => mongoose.connection.readyState === 1;

let Product;
try {
  const models = require('../models');
  Product = models.Product;
} catch (err) {
  console.log('Models not available - using mock data');
}

const mockProducts = [
  {
    id: 1,
    name: "gentle hydrating cleanser",
    brand: "cerave",
    price: 24.99,
    rating: 4.5,
    description: "A gentle, non-drying cleanser perfect for sensitive skin with ceramides and hyaluronic acid.",
    ingredient_list: ["water", "ceramides", "hyaluronic acid", "glycerin", "niacinamide"],
    skinTypes: ["sensitive", "dry"],
    skinConcerns: ["sensitivity", "dryness"],
    isSustainable: true
  },
  {
    id: 2,
    name: "vitamin c brightening serum",
    brand: "skinceuticals",
    price: 39.99,
    rating: 4.8,
    description: "Intensive brightening serum with vitamin C and ferulic acid.",
    ingredient_list: ["l-ascorbic acid", "vitamin e", "ferulic acid", "water", "propylene glycol"],
    skinTypes: ["normal", "combination"],
    skinConcerns: ["hyperpigmentation", "aging"],
    isSustainable: false
  },
  {
    id: 3,
    name: "niacinamide oil control moisturizer",
    brand: "the ordinary",
    price: 29.99,
    rating: 4.3,
    description: "Lightweight moisturizer that controls oil without drying with niacinamide.",
    ingredient_list: ["niacinamide", "zinc oxide", "hyaluronic acid", "squalane", "water"],
    skinTypes: ["oily", "combination"],
    skinConcerns: ["acne", "oiliness"],
    isSustainable: true
  },
  {
    id: 4,
    name: "retinol anti-aging serum",
    brand: "neutrogena",
    price: 34.99,
    rating: 4.6,
    description: "Powerful anti-aging serum with retinol and peptides.",
    ingredient_list: ["retinol", "peptides", "vitamin e", "squalane", "dimethicone"],
    skinTypes: ["normal", "dry"],
    skinConcerns: ["aging", "fine lines"],
    isSustainable: false
  },
  {
    id: 5,
    name: "salicylic acid acne treatment",
    brand: "paula's choice",
    price: 32.00,
    rating: 4.7,
    description: "BHA liquid exfoliant that unclogs pores and reduces acne.",
    ingredient_list: ["salicylic acid", "green tea extract", "chamomile", "water", "butylene glycol"],
    skinTypes: ["oily", "combination"],
    skinConcerns: ["acne", "blackheads"],
    isSustainable: true
  },
  {
    id: 6,
    name: "hyaluronic acid hydrating serum",
    brand: "the inkey list",
    price: 19.99,
    rating: 4.4,
    description: "Multi-molecular weight hyaluronic acid for deep hydration.",
    ingredient_list: ["hyaluronic acid", "sodium hyaluronate", "glycerin", "water", "panthenol"],
    skinTypes: ["dry", "sensitive"],
    skinConcerns: ["dryness", "dehydration"],
    isSustainable: true
  },
  {
    id: 7,
    name: "gentle exfoliating toner",
    brand: "pixi",
    price: 28.00,
    rating: 4.2,
    description: "Gentle glycolic acid toner for smooth, radiant skin.",
    ingredient_list: ["glycolic acid", "aloe vera", "ginseng", "water", "witch hazel"],
    skinTypes: ["normal", "combination"],
    skinConcerns: ["dullness", "texture"],
    isSustainable: false
  },
  {
    id: 8,
    name: "ceramide repair moisturizer",
    brand: "cerave",
    price: 26.99,
    rating: 4.5,
    description: "Rich moisturizer with ceramides for barrier repair.",
    ingredient_list: ["ceramides", "cholesterol", "fatty acids", "hyaluronic acid", "dimethicone"],
    skinTypes: ["dry", "sensitive"],
    skinConcerns: ["dryness", "barrier damage"],
    isSustainable: true
  },
  {
    id: 9,
    name: "zinc sunscreen spf 50",
    brand: "eltamd",
    price: 41.00,
    rating: 4.8,
    description: "Broad spectrum mineral sunscreen with zinc oxide.",
    ingredient_list: ["zinc oxide", "titanium dioxide", "octinoxate", "water", "silica"],
    skinTypes: ["all"],
    skinConcerns: ["sun protection"],
    isSustainable: false
  },
  {
    id: 10,
    name: "peptide firming cream",
    brand: "olay",
    price: 37.99,
    rating: 4.3,
    description: "Anti-aging cream with peptides and amino acids.",
    ingredient_list: ["peptides", "amino acids", "niacinamide", "glycerin", "dimethicone"],
    skinTypes: ["normal", "dry"],
    skinConcerns: ["aging", "firmness"],
    isSustainable: false
  },
  {
    id: 11,
    name: "tea tree oil spot treatment",
    brand: "the body shop",
    price: 15.00,
    rating: 4.1,
    description: "Targeted acne treatment with tea tree oil.",
    ingredient_list: ["tea tree oil", "salicylic acid", "witch hazel", "alcohol", "water"],
    skinTypes: ["oily", "acne-prone"],
    skinConcerns: ["acne", "blemishes"],
    isSustainable: true
  },
  {
    id: 12,
    name: "rose hip oil facial oil",
    brand: "trilogy",
    price: 29.99,
    rating: 4.6,
    description: "Pure rosehip oil for hydration and anti-aging.",
    ingredient_list: ["rosehip seed oil", "vitamin e", "linoleic acid", "oleic acid", "palmitic acid"],
    skinTypes: ["dry", "mature"],
    skinConcerns: ["aging", "dryness"],
    isSustainable: true
  }
];

const mockIngredients = [
  { id: 1, name: "hyaluronic acid", benefits: ["hydration", "plumping"], category: "humectant" },
  { id: 2, name: "niacinamide", benefits: ["oil control", "pore minimizing"], category: "vitamin" },
  { id: 3, name: "retinol", benefits: ["anti-aging", "cell turnover"], category: "retinoid" },
  { id: 4, name: "salicylic acid", benefits: ["exfoliation", "acne treatment"], category: "bha" },
  { id: 5, name: "vitamin c", benefits: ["brightening", "antioxidant"], category: "vitamin" },
  { id: 6, name: "ceramides", benefits: ["barrier repair", "moisturizing"], category: "lipid" },
  { id: 7, name: "glycolic acid", benefits: ["exfoliation", "texture improvement"], category: "aha" },
  { id: 8, name: "peptides", benefits: ["anti-aging", "firming"], category: "protein" },
  { id: 9, name: "zinc oxide", benefits: ["sun protection", "anti-inflammatory"], category: "mineral" },
  { id: 10, name: "tea tree oil", benefits: ["antibacterial", "acne treatment"], category: "essential oil" }
];

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
      // Use mock data when MongoDB is not available
      respond(res, {
        products: mockProducts,
        pagination: {
          total: mockProducts.length,
          page: 1,
          limit: 10,
          pages: 1
        }
      });
    }
  } catch (err) {
    error(res, 'Could not retrieve products');
  }
});

// GET /api/products/:id - Get product by ID
router.get('/api/products/:id', async (req, res) => {
  try {
    if (isMongoConnected() && Product) {
      const product = await Product.findById(req.params.id);
      if (!product) return error(res, 'Product not found', 404);
      respond(res, product);
    } else {
      const product = mockProducts.find(p => p._id === req.params.id);
      if (!product) return error(res, 'Product not found', 404);
      respond(res, product);
    }
  } catch (err) {
    error(res, 'Could not retrieve product');
  }
});

router.get('/products', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);

    if (isMongoConnected() && Product) {
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
        ingredient_list: product.ingredients,
        skinTypes: product.skinTypes,
        skinConcerns: product.skinConcerns,
        isSustainable: product.isSustainable
      }));

      respond(res, formattedProducts);
    } else {
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedProducts = mockProducts.slice(startIndex, endIndex);
      respond(res, paginatedProducts);
    }
  } catch (err) {
    console.error('Error in /products:', err);
    error(res, 'Could not retrieve products');
  }
});

router.get('/product', async (req, res) => {
  try {
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
      if (!searchQuery) {
        return respond(res, mockProducts.slice(0, limitNum));
      }

      const searchTerm = searchQuery.toLowerCase();
      const filteredProducts = mockProducts.filter(product => {
        return (
          product.name.toLowerCase().includes(searchTerm) ||
          product.brand.toLowerCase().includes(searchTerm) ||
          product.ingredient_list.some(ingredient =>
            ingredient.toLowerCase().includes(searchTerm)
          ) ||
          product.skinConcerns.some(concern =>
            concern.toLowerCase().includes(searchTerm)
          ) ||
          product.skinTypes.some(type =>
            type.toLowerCase().includes(searchTerm)
          )
        );
      });

      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedResults = filteredProducts.slice(startIndex, endIndex);
      respond(res, paginatedResults);
    }
  } catch (err) {
    console.error('Error in /product search:', err);
    error(res, 'Search failed');
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = mockProducts.find(p => p.id === productId);

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    respond(res, product);
  } catch (err) {
    console.error('Error in /products/:id:', err);
    error(res, 'Could not retrieve product');
  }
});

router.get('/ingredients', async (req, res) => {
  try {
    respond(res, mockIngredients);
  } catch (err) {
    console.error('Error in /ingredients:', err);
    error(res, 'Could not retrieve ingredients');
  }
});

router.get('/ingredient', async (req, res) => {
  try {
    const { q: searchQuery, limit = 20 } = req.query;
    const limitNum = parseInt(limit);

    if (!searchQuery) {
      return respond(res, mockIngredients.slice(0, limitNum));
    }

    const searchTerm = searchQuery.toLowerCase();
    const filteredIngredients = mockIngredients.filter(ingredient => {
      return (
        ingredient.name.toLowerCase().includes(searchTerm) ||
        ingredient.benefits.some(benefit =>
          benefit.toLowerCase().includes(searchTerm)
        ) ||
        ingredient.category.toLowerCase().includes(searchTerm)
      );
    });

    respond(res, filteredIngredients.slice(0, limitNum));
  } catch (err) {
    console.error('Error in /ingredient search:', err);
    error(res, 'Ingredient search failed');
  }
});

module.exports = router;
