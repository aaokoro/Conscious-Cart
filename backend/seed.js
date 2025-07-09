require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('./models');

// Mock products data to seed the database
// Valid skinConcerns: ['acne', 'aging', 'dryness', 'sensitivity', 'hyperpigmentation', 'redness']
// Valid skinTypes: ['oily', 'dry', 'combination', 'normal', 'sensitive']
const mockProducts = [
  {
    name: "gentle hydrating cleanser",
    brand: "cerave",
    description: "A gentle, non-drying cleanser perfect for sensitive skin with ceramides and hyaluronic acid.",
    price: 24.99,
    ingredients: ["water", "ceramides", "hyaluronic acid", "glycerin", "niacinamide"],
    skinTypes: ["sensitive", "dry"],
    skinConcerns: ["sensitivity", "dryness"],
    isSustainable: true,
    rating: 4.5,
    reviewCount: 1250
  },
  {
    name: "vitamin c brightening serum",
    brand: "skinceuticals",
    description: "Intensive brightening serum with vitamin C and ferulic acid.",
    price: 39.99,
    ingredients: ["l-ascorbic acid", "vitamin e", "ferulic acid", "water", "propylene glycol"],
    skinTypes: ["normal", "combination"],
    skinConcerns: ["hyperpigmentation", "aging"],
    isSustainable: false,
    rating: 4.8,
    reviewCount: 2100
  },
  {
    name: "niacinamide oil control moisturizer",
    brand: "the ordinary",
    description: "Lightweight moisturizer that controls oil without drying with niacinamide.",
    price: 29.99,
    ingredients: ["niacinamide", "zinc oxide", "hyaluronic acid", "squalane", "water"],
    skinTypes: ["oily", "combination"],
    skinConcerns: ["acne"],
    isSustainable: true,
    rating: 4.3,
    reviewCount: 890
  },
  {
    name: "retinol anti-aging serum",
    brand: "neutrogena",
    description: "Powerful anti-aging serum with retinol and peptides.",
    price: 34.99,
    ingredients: ["retinol", "peptides", "vitamin e", "squalane", "dimethicone"],
    skinTypes: ["normal", "dry"],
    skinConcerns: ["aging"],
    isSustainable: false,
    rating: 4.6,
    reviewCount: 1560
  },
  {
    name: "salicylic acid acne treatment",
    brand: "paula's choice",
    description: "BHA liquid exfoliant that unclogs pores and reduces acne.",
    price: 32.00,
    ingredients: ["salicylic acid", "green tea extract", "chamomile", "water", "butylene glycol"],
    skinTypes: ["oily", "combination"],
    skinConcerns: ["acne"],
    isSustainable: true,
    rating: 4.7,
    reviewCount: 3200
  },
  {
    name: "hyaluronic acid hydrating serum",
    brand: "the inkey list",
    description: "Multi-molecular weight hyaluronic acid for deep hydration.",
    price: 19.99,
    ingredients: ["hyaluronic acid", "sodium hyaluronate", "glycerin", "water", "panthenol"],
    skinTypes: ["dry", "sensitive"],
    skinConcerns: ["dryness"],
    isSustainable: true,
    rating: 4.4,
    reviewCount: 750
  },
  {
    name: "gentle exfoliating toner",
    brand: "pixi",
    description: "Gentle glycolic acid toner for smooth, radiant skin.",
    price: 28.00,
    ingredients: ["glycolic acid", "aloe vera", "ginseng", "water", "witch hazel"],
    skinTypes: ["normal", "combination"],
    skinConcerns: ["aging", "hyperpigmentation"],
    isSustainable: false,
    rating: 4.2,
    reviewCount: 980
  },
  {
    name: "ceramide repair moisturizer",
    brand: "cerave",
    description: "Rich moisturizer with ceramides for barrier repair.",
    price: 26.99,
    ingredients: ["ceramides", "cholesterol", "fatty acids", "hyaluronic acid", "dimethicone"],
    skinTypes: ["dry", "sensitive"],
    skinConcerns: ["dryness", "sensitivity"],
    isSustainable: true,
    rating: 4.5,
    reviewCount: 1800
  },
  {
    name: "zinc sunscreen spf 50",
    brand: "eltamd",
    description: "Broad spectrum mineral sunscreen with zinc oxide.",
    price: 41.00,
    ingredients: ["zinc oxide", "titanium dioxide", "octinoxate", "water", "silica"],
    skinTypes: ["normal", "sensitive"],
    skinConcerns: ["sensitivity"],
    isSustainable: false,
    rating: 4.8,
    reviewCount: 2500
  },
  {
    name: "peptide firming cream",
    brand: "olay",
    description: "Anti-aging cream with peptides and amino acids.",
    price: 37.99,
    ingredients: ["peptides", "amino acids", "niacinamide", "glycerin", "dimethicone"],
    skinTypes: ["normal", "dry"],
    skinConcerns: ["aging"],
    isSustainable: false,
    rating: 4.3,
    reviewCount: 1200
  },
  {
    name: "tea tree oil spot treatment",
    brand: "the body shop",
    description: "Targeted acne treatment with tea tree oil.",
    price: 15.00,
    ingredients: ["tea tree oil", "salicylic acid", "witch hazel", "alcohol", "water"],
    skinTypes: ["oily"],
    skinConcerns: ["acne"],
    isSustainable: true,
    rating: 4.1,
    reviewCount: 650
  },
  {
    name: "rose hip oil facial oil",
    brand: "trilogy",
    description: "Pure rosehip oil for hydration and anti-aging.",
    price: 29.99,
    ingredients: ["rosehip seed oil", "vitamin e", "linoleic acid", "oleic acid", "palmitic acid"],
    skinTypes: ["dry"],
    skinConcerns: ["aging", "dryness"],
    isSustainable: true,
    rating: 4.6,
    reviewCount: 890
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    await Product.deleteMany({});
    console.log('Cleared existing products');

    const insertedProducts = await Product.insertMany(mockProducts);
    console.log(`✅ Successfully seeded ${insertedProducts.length} products to the database!`);

    console.log('\nSeeded products:');
    insertedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} by ${product.brand} - $${product.price}`);
    });

    console.log('\n🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}
seedDatabase();
