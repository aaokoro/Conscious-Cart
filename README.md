# Skinfluence - Skincare Recommendation App

A personalized skincare recommendation platform that helps users discover products tailored to their skin type and concerns.

## Project Links

- **Project Plan**: [Google Doc](https://docs.google.com/document/d/1QTFmvcbl0Ds0DxBxlxneavytynoTvsAw92YnZO4pCj4/edit?pli=1&tab=t.0)
- **Wireframes**: [Google Doc](https://docs.google.com/document/d/1JOvZd_PdkN14WlO7gUfa6tTbq5l20FE4hTXqGoP44qw/edit?usp=sharing)

## Features

- User authentication and profile management
- Skincare questionnaire for personalized recommendations
- Product search and filtering
- Favorites and routine management
- Review and rating system
- Retailer integration

## Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Set up environment variables (see .env.example files)
5. Start the development servers:
   ```bash
   # Backend
   cd backend && npm start

   # Frontend
   cd frontend && npm run dev
   ```

## API Endpoints

### Authentication & User Management

| HTTP Verb | Endpoint | Description |
|-----------|----------|-------------|
| POST | /api/auth/register | Create a new user account |
| POST | /api/auth/login | Authenticate user and return token |
| GET | /api/users/me | Retrieve current user profile information |
| PUT | /api/users/me | Update user profile information |

### Products & Recommendations

| HTTP Verb | Endpoint | Description |
|-----------|----------|-------------|
| GET | /api/products | Get products with optional filtering |
| GET | /api/products/:id | Get detailed information about a specific product |
| GET | /api/recommendations | Get personalized product recommendations |

### Favorites & Reviews

| HTTP Verb | Endpoint | Description |
|-----------|----------|-------------|
| POST | /api/favorites | Add a product to user's favorites |
| GET | /api/favorites | Get all favorite products for current user |
| POST | /api/products/:id/reviews | Add a review for a product |
| GET | /api/products/:id/reviews | Get all reviews for a product |
