# Conscious Cart API Endpoints

## User Management

| HTTP Verb | Endpoint | Description | User Stories |
|-----------|----------|-------------|-------------|
| POST | /api/users | Create a new user account | 1 |
| GET | /api/users/:id | Retrieve user profile information | 1 |
| PUT | /api/users/:id | Update user profile information | 1 |
| DELETE | /api/users/:id | Delete user account | - |

## Health & Preferences Profile

| HTTP Verb | Endpoint | Description | User Stories |
|-----------|----------|-------------|-------------|
| POST | /api/profiles | Create a health and values profile | 1 |
| GET | /api/profiles/:userId | Get a user's health and values profile | 1 |
| PUT | /api/profiles/:userId | Update a user's health and values profile | 1 |
| POST | /api/profiles/:userId/allergies | Add allergies to user profile | 1, 3 |
| DELETE | /api/profiles/:userId/allergies/:allergyId | Remove an allergy from user profile | 1, 3 |
| POST | /api/profiles/:userId/values | Add ethical values to user profile | 1 |
| DELETE | /api/profiles/:userId/values/:valueId | Remove an ethical value from user profile | 1 |

## Product Management

| HTTP Verb | Endpoint | Description | User Stories |
|-----------|----------|-------------|-------------|
| GET | /api/products/barcode/:code | Get product information by barcode | 2 |
| GET | /api/products/search | Search for products by name, brand, or category | 10 |
| GET | /api/products/:id | Get detailed information about a specific product | 2, 9, 10 |
| GET | /api/products/:id/alternatives | Get alternative products that match user preferences | 5 |
| GET | /api/products/:id/score | Get health, ethics, and environmental scores for a product | 9 |
| GET | /api/brands/:id | Get information about a specific brand | 10 |
| GET | /api/brands/:id/products | Get all products from a specific brand | 10 |

## Favorites & Lists

| HTTP Verb | Endpoint | Description | User Stories |
|-----------|----------|-------------|-------------|
| POST | /api/favorites | Add a product to user's favorites | 4 |
| GET | /api/favorites/:userId | Get all favorite products for a user | 4 |
| DELETE | /api/favorites/:id | Remove a product from user's favorites | 4 |
| POST | /api/lists | Create a new list (e.g., "Trusted Skincare Brands") | 4 |
| GET | /api/lists/:userId | Get all lists for a user | 4 |
| PUT | /api/lists/:id | Update a list's details | 4 |
| DELETE | /api/lists/:id | Delete a list | 4 |
| POST | /api/lists/:id/products | Add a product to a list | 4 |
| DELETE | /api/lists/:id/products/:productId | Remove a product from a list | 4 |

## Alerts & Notifications

| HTTP Verb | Endpoint | Description | User Stories |
|-----------|----------|-------------|-------------|
| POST | /api/alerts | Create a new alert configuration | 3 |
| GET | /api/alerts/:userId | Get all alert configurations for a user | 3 |
| PUT | /api/alerts/:id | Update an alert configuration | 3 |
| DELETE | /api/alerts/:id | Delete an alert configuration | 3 |
| GET | /api/alerts/check/:productId | Check if a product triggers any alerts for the user | 3 |

## Global Issues & Activism

| HTTP Verb | Endpoint | Description | User Stories |
|-----------|----------|-------------|-------------|
| GET | /api/issues | Get list of global issues tracked in the app | 6 |
| GET | /api/issues/:id | Get detailed information about a specific issue | 6 |
| GET | /api/issues/:id/products | Get products related to a specific issue | 6 |
| GET | /api/actions | Get list of available actions (petitions, donations, events) | 7 |
| GET | /api/actions/:id | Get detailed information about a specific action | 7 |
| POST | /api/actions/:id/participate | Record user participation in an action | 7 |
| GET | /api/events | Get list of local volunteer events | 7 |
| GET | /api/events/:location | Get events filtered by user location | 7 |

## Social Sharing

| HTTP Verb | Endpoint | Description | User Stories |
|-----------|----------|-------------|-------------|
| POST | /api/shares | Create a new social share | 8 |
| GET | /api/shares/:userId | Get all shares by a user | 8 |
| GET | /api/products/:id/shares | Get social shares related to a specific product | 8 |
| GET | /api/issues/:id/shares | Get social shares related to a specific issue | 8 |

## Analytics & Recommendations

| HTTP Verb | Endpoint | Description | User Stories |
|-----------|----------|-------------|-------------|
| GET | /api/recommendations | Get personalized product recommendations | 1, 5 |
| GET | /api/recommendations/trending | Get trending ethical products | - |
| GET | /api/analytics/impact | Get user's personal impact statistics | - |
