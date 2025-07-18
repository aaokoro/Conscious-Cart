## 📋 Project Documentation

- **[Project Plan Document](https://docs.google.com/document/d/1QTFmvcbl0Ds0DxBxlxneavytynoTvsAw92YnZO4pCj4/edit?pli=1&tab=t.0)** - Complete project planning and development roadmap
- **[Wireframes Document](https://docs.google.com/document/d/1JOvZd_PdkN14WlO7gUfa6tTbq5l20FE4hTXqGoP44qw/edit?usp=sharing)** - UI/UX design mockups and user flow diagrams
- **[Demo Video](https://www.loom.com/share/e896311a9504439fb0e24b1d0c4e3fd1?sid=b310ea38-fa29-484b-93c2-700a79e19bbd)** - Live application demonstration

## 🔗 API Endpoints
Project Plan doc **(https://docs.google.com/document/d/1QTFmvcbl0Ds0DxBxlxneavytynoTvsAw92YnZO4pCj4/edit?pli=1&tab=t.0)**

WireFrames doc:
**(https://docs.google.com/document/d/1JOvZd_PdkN14WlO7gUfa6tTbq5l20FE4hTXqGoP44qw/edit?usp=sharing)**


Endpoints:
**Note** put endpoints file in to read me

# Skincare App API Endpoints

## Authentication & User Management

| HTTP Verb | Endpoint | Description | Screen |
|-----------|----------|-------------|--------|
| POST | /api/auth/register | Create a new user account | Sign Up |
| POST | /api/auth/login | Authenticate user and return token | Log In |
| POST | /api/auth/forgot-password | Initiate password reset process | Log In |
| POST | /api/auth/reset-password | Complete password reset with token | Password Reset |
| GET | /api/users/me | Retrieve current user profile information | Profile Summary |
| PUT | /api/users/me | Update user profile information | Profile Summary |
| DELETE | /api/users/me | Delete user account | Profile Settings |
| POST | /api/auth/social/google | Authenticate with Google | Sign Up/Log In |
| POST | /api/auth/social/apple | Authenticate with Apple | Sign Up/Log In |

## Skincare Profile

| HTTP Verb | Endpoint | Description | Screen |
|-----------|----------|-------------|--------|
| POST | /api/skincare-profile | Create a skincare profile | Profile Questionnaire |
| GET | /api/skincare-profile | Get user's skincare profile | Profile Summary |
| PUT | /api/skincare-profile | Update skincare profile | Profile Summary |
| POST | /api/skincare-profile/photos | Upload skin photo for analysis/tracking | Profile Summary |
| GET | /api/skincare-profile/photos | Get user's skin photos history | Profile Summary |
| DELETE | /api/skincare-profile/photos/:id | Delete a skin photo | Profile Summary |

## Skincare Questionnaire

| HTTP Verb | Endpoint | Description | Screen |
|-----------|----------|-------------|--------|
| GET | /api/questionnaire/skin-types | Get list of skin types | Profile Questionnaire |
| GET | /api/questionnaire/skin-concerns | Get list of skin concerns | Profile Questionnaire |
| GET | /api/questionnaire/preferences | Get list of product preferences | Profile Questionnaire |
| POST | /api/questionnaire/submit | Submit completed questionnaire | Profile Questionnaire |

## Products

| HTTP Verb | Endpoint | Description | Screen |
|-----------|----------|-------------|--------|
| GET | /api/products | Get products with optional filtering | Recommendations |
| GET | /api/products/search | Search for products by name, brand, or category | Recommendations |
| GET | /api/products/:id | Get detailed information about a specific product | Product Detail |
| GET | /api/products/categories | Get list of product categories | Recommendations |
| GET | /api/products/ingredients | Search products by ingredients | Recommendations |
| GET | /api/brands | Get list of skincare brands | Recommendations |
| GET | /api/brands/:id | Get information about a specific brand | Product Detail |
| GET | /api/brands/:id/products | Get all products from a specific brand | Recommendations |

## Recommendations

| HTTP Verb | Endpoint | Description | Screen |
|-----------|----------|-------------|--------|
| GET | /api/recommendations | Get personalized product recommendations | Recommendations |
| GET | /api/recommendations/skin-type/:type | Get recommendations for specific skin type | Recommendations |
| GET | /api/recommendations/concern/:concern | Get recommendations for specific skin concern | Recommendations |
| GET | /api/recommendations/trending | Get trending skincare products | Recommendations |
| GET | /api/recommendations/sustainable | Get sustainable/eco-friendly products | Recommendations |
| GET | /api/recommendations/vegan | Get vegan skincare products | Recommendations |

## Favorites & Lists

| HTTP Verb | Endpoint | Description | Screen |
|-----------|----------|-------------|--------|
| POST | /api/favorites | Add a product to user's favorites | Product Detail |
| GET | /api/favorites | Get all favorite products for current user | Recommendations |
| DELETE | /api/favorites/:productId | Remove a product from user's favorites | Product Detail |
| POST | /api/routines | Create a new skincare routine | Profile Summary |
| GET | /api/routines | Get all routines for current user | Profile Summary |
| PUT | /api/routines/:id | Update a routine's details | Profile Summary |
| DELETE | /api/routines/:id | Delete a routine | Profile Summary |
| POST | /api/routines/:id/products | Add a product to a routine | Product Detail |
| DELETE | /api/routines/:id/products/:productId | Remove a product from a routine | Profile Summary |

## Reviews & Ratings

| HTTP Verb | Endpoint | Description | Screen |
|-----------|----------|-------------|--------|
| POST | /api/products/:id/reviews | Add a review for a product | Product Detail |
| GET | /api/products/:id/reviews | Get all reviews for a product | Product Detail |
| PUT | /api/reviews/:id | Update user's review | Product Detail |
| DELETE | /api/reviews/:id | Delete user's review | Product Detail |
| GET | /api/reviews/me | Get all reviews by current user | Profile Summary |

## Retailer Links

| HTTP Verb | Endpoint | Description | Screen |
|-----------|----------|-------------|--------|
| GET | /api/products/:id/retailers | Get retailer links for a product | Product Detail |
| POST | /api/retailers/click/:id | Record when user clicks on retailer link | Product Detail |


# 🌟 Skinfluence - AI-Powered Skincare Recommendation Platform

A modern web application that provides personalized skincare product recommendations using machine learning algorithms.

## 🚀 Features

- **AI-Powered Recommendations**: Content-based, collaborative filtering, and hybrid recommendation engines
- **Product Search & Discovery**: Advanced search with filtering by skin type, concerns, and ingredients
- **User Profiles**: Personalized accounts with favorites and recommendation history
- **Responsive Design**: Mobile-first approach with modern UI/UX
- **Secure Authentication**: JWT-based authentication with secure password handling

## 🏗️ Architecture

### Backend (Node.js/Express)
- RESTful API with Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- Machine learning recommendation engines
- Rate limiting and security middleware

### Frontend (React/Vite)
- Modern React with hooks
- Vite for fast development and building
- Responsive CSS with mobile-first design
- Environment-based configuration

