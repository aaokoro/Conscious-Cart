const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware');

const isMongoConnected = () => mongoose.connection.readyState === 1;


let User, Profile, Product;
try {
  const models = require('../models');
  User = models.User;
  Profile = models.Profile;
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

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

router.get('/', auth, async (req, res) => {
  try {
    if (isMongoConnected() && User && Profile && Product) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (!user) return error(res, 'User not found', 404);

      const profile = await Profile.findOne({ user: user._id });
      if (!profile) return error(res, 'Profile not found', 404);

      const query = { skinTypes: profile.skinType };
      if (profile.skinConcerns?.length > 0) query.skinConcerns = { $in: profile.skinConcerns };
      if (profile.sustainabilityPreference) query.isSustainable = true;

      const recommendations = await Product.find(query).sort({ rating: -1 }).limit(10);
      respond(res, recommendations);
    } else {
      // Mock recommendations
      respond(res, mockProducts);
    }
  } catch (err) {
    error(res, 'Could not retrieve recommendations');
  }
});


const getRecommendations = async (query, res) => {
  try {
    if (isMongoConnected() && Product) {
      const products = await Product.find(query).sort({ rating: -1 }).limit(10);
      respond(res, products);
    } else {

      let filteredProducts = mockProducts;
      if (query.isSustainable) {
        filteredProducts = mockProducts.filter(p => p.isSustainable);
      }
      if (query.skinTypes) {
        filteredProducts = mockProducts.filter(p => p.skinTypes.includes(query.skinTypes));
      }
      respond(res, filteredProducts);
    }
  } catch (err) {
    error(res, 'Could not retrieve recommendations');
  }
};

router.get('/trending', (req, res) => getRecommendations({}, res));

router.get('/sustainable', (req, res) => getRecommendations({ isSustainable: true }, res));

router.get('/skin-type/:type', (req, res) => {
  const validTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive'];
  if (!validTypes.includes(req.params.type)) return error(res, 'Invalid skin type', 400);
  getRecommendations({ skinTypes: req.params.type }, res);
});

module.exports = router;
