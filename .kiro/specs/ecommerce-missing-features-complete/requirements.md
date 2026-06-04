# Requirements Document

## Introduction

This document specifies the requirements for implementing all missing backend features for a professional e-commerce platform. The system will provide secure, fast, and scalable APIs for shopping cart management, wishlist functionality, image upload with compression, newsletter subscriptions, admin analytics, category management, user administration, product reviews, and advanced product discovery features.

The implementation will migrate client-side functionality (cart and favorites stored in localStorage) to secure server-side APIs, add comprehensive admin capabilities, and enhance the product catalog with reviews, search suggestions, and related product recommendations.

## Glossary

- **API_Server**: The Express.js backend application handling all HTTP requests
- **Cart_Manager**: The subsystem managing shopping cart operations
- **Wishlist_Manager**: The subsystem managing user favorites/wishlist
- **Image_Processor**: The subsystem handling image upload, compression, and storage
- **Newsletter_Service**: The subsystem managing email subscriptions
- **Analytics_Engine**: The subsystem calculating and caching dashboard statistics
- **Category_Manager**: The subsystem managing product categories
- **User_Manager**: The subsystem managing user accounts and permissions
- **Review_System**: The subsystem managing product reviews and ratings
- **Search_Engine**: The subsystem providing product search and discovery
- **Storage_Bucket**: Supabase Storage bucket for product images
- **Cache_Layer**: Redis cache for performance optimization
- **Database**: PostgreSQL database accessed via Prisma ORM
- **Authenticated_User**: A user with a valid JWT token
- **Admin_User**: An authenticated user with isAdmin flag set to true
- **Public_User**: Any user accessing public endpoints without authentication
- **Product**: An item available for purchase in the catalog
- **Order**: A completed purchase transaction
- **Review**: A user-submitted rating and comment for a product
- **WebP**: Modern image format with superior compression
- **RLS_Policy**: Row Level Security policy in Supabase
- **JWT**: JSON Web Token for authentication
- **GDPR**: General Data Protection Regulation for data privacy

## Requirements

### Requirement 1: Secure Image Upload with Compression

**User Story:** As an admin, I want to upload product images that are automatically compressed and optimized, so that the website loads faster and storage costs are minimized.

#### Acceptance Criteria

1. WHEN an admin uploads an image file, THE Image_Processor SHALL validate the file type is an image format (JPEG, PNG, GIF, WebP)
2. WHEN an admin uploads an image file, THE Image_Processor SHALL validate the file size does not exceed 10MB
3. WHEN a valid image is uploaded, THE Image_Processor SHALL compress the image to WebP format
4. WHEN a valid image is uploaded, THE Image_Processor SHALL generate three sizes: thumbnail (150x150), medium (500x500), and large (1200x1200)
5. WHEN image sizes are generated, THE Image_Processor SHALL upload all sizes to the Storage_Bucket with unique filenames
6. WHEN images are uploaded successfully, THE Image_Processor SHALL return secure URLs for all three image sizes
7. WHEN a product image is updated, THE Image_Processor SHALL delete the old images from the Storage_Bucket
8. WHEN a product is deleted, THE Image_Processor SHALL delete all associated images from the Storage_Bucket
9. THE Storage_Bucket SHALL enforce RLS_Policy allowing authenticated users to upload and public users to read
10. WHEN multiple images are uploaded for a product gallery, THE Image_Processor SHALL process each image independently and return an array of URL sets

### Requirement 2: Shopping Cart API

**User Story:** As a customer, I want my shopping cart to be stored on the server, so that my cart persists across devices and sessions.

#### Acceptance Criteria

1. WHEN an Authenticated_User adds a product to cart, THE Cart_Manager SHALL validate the product exists in the Database
2. WHEN an Authenticated_User adds a product to cart, THE Cart_Manager SHALL validate the product has sufficient stock
3. WHEN an Authenticated_User adds a product to cart, THE Cart_Manager SHALL create or update a cart item with the specified quantity
4. WHEN an Authenticated_User requests their cart, THE Cart_Manager SHALL return all cart items with full product details including title, price, image, and stock
5. WHEN an Authenticated_User updates a cart item quantity, THE Cart_Manager SHALL validate the new quantity does not exceed available stock
6. WHEN an Authenticated_User removes a cart item, THE Cart_Manager SHALL delete the item from the Database
7. WHEN an Authenticated_User clears their cart, THE Cart_Manager SHALL delete all cart items for that user
8. WHEN a product is deleted, THE Cart_Manager SHALL automatically remove the product from all user carts
9. WHEN an Authenticated_User logs in for the first time, THE Cart_Manager SHALL merge items from localStorage with server-side cart
10. THE Cart_Manager SHALL calculate cart totals (subtotal, item count) server-side and return them with cart data

### Requirement 3: Wishlist/Favorites API

**User Story:** As a customer, I want to save my favorite products on the server, so that I can access them from any device.

#### Acceptance Criteria

1. WHEN an Authenticated_User adds a product to favorites, THE Wishlist_Manager SHALL validate the product exists in the Database
2. WHEN an Authenticated_User adds a product to favorites, THE Wishlist_Manager SHALL create a favorite record if it does not already exist
3. WHEN an Authenticated_User adds a duplicate product to favorites, THE Wishlist_Manager SHALL return success without creating a duplicate record
4. WHEN an Authenticated_User requests their favorites, THE Wishlist_Manager SHALL return all favorited products with full product details
5. WHEN an Authenticated_User removes a product from favorites, THE Wishlist_Manager SHALL delete the favorite record
6. WHEN a product is deleted, THE Wishlist_Manager SHALL automatically remove the product from all user favorites
7. WHEN an Authenticated_User logs in for the first time, THE Wishlist_Manager SHALL merge items from localStorage with server-side favorites
8. THE Wishlist_Manager SHALL return favorites sorted by most recently added first

### Requirement 4: Newsletter Subscription

**User Story:** As a visitor, I want to subscribe to the newsletter, so that I can receive updates about new products and promotions.

#### Acceptance Criteria

1. WHEN a Public_User submits an email for subscription, THE Newsletter_Service SHALL validate the email format is correct
2. WHEN a valid email is submitted, THE Newsletter_Service SHALL check if the email is already subscribed
3. WHEN a new email is submitted, THE Newsletter_Service SHALL create a subscription record with the current timestamp
4. WHEN a duplicate email is submitted, THE Newsletter_Service SHALL return success without creating a duplicate record
5. WHEN an Admin_User requests subscriber list, THE Newsletter_Service SHALL return all subscribers with email and subscription date
6. WHEN a user requests to unsubscribe, THE Newsletter_Service SHALL delete the subscription record for the provided email
7. THE Newsletter_Service SHALL support pagination for the subscriber list with a default of 20 subscribers per page
8. THE Newsletter_Service SHALL store subscription date for GDPR compliance

### Requirement 5: Admin Dashboard Analytics

**User Story:** As an admin, I want to view comprehensive business analytics, so that I can make informed decisions about inventory and marketing.

#### Acceptance Criteria

1. WHEN an Admin_User requests analytics, THE Analytics_Engine SHALL calculate total revenue for all time, current month, and current week
2. WHEN an Admin_User requests analytics, THE Analytics_Engine SHALL calculate total order counts for all time, pending status, and completed status
3. WHEN an Admin_User requests analytics, THE Analytics_Engine SHALL calculate total customer count
4. WHEN an Admin_User requests analytics, THE Analytics_Engine SHALL calculate total product count
5. WHEN an Admin_User requests analytics, THE Analytics_Engine SHALL identify the top 5 best-selling products by order count
6. WHEN an Admin_User requests analytics, THE Analytics_Engine SHALL retrieve the 10 most recent orders with customer and status information
7. WHEN an Admin_User requests analytics, THE Analytics_Engine SHALL calculate daily revenue for the last 7 days
8. WHEN an Admin_User requests analytics, THE Analytics_Engine SHALL calculate order status breakdown (pending, processing, completed, cancelled)
9. THE Analytics_Engine SHALL cache analytics results in the Cache_Layer for 5 minutes
10. THE Analytics_Engine SHALL execute all aggregation queries efficiently using database indexes

### Requirement 6: Category Management CRUD

**User Story:** As an admin, I want to create, update, and delete product categories, so that I can organize the product catalog effectively.

#### Acceptance Criteria

1. WHEN an Admin_User creates a category, THE Category_Manager SHALL validate the category name is unique
2. WHEN an Admin_User creates a category, THE Category_Manager SHALL auto-generate a URL-safe slug from the category name
3. WHEN an Admin_User creates a category, THE Category_Manager SHALL store the category with optional icon URL
4. WHEN an Admin_User updates a category, THE Category_Manager SHALL validate the new name is unique if changed
5. WHEN an Admin_User updates a category, THE Category_Manager SHALL regenerate the slug if the name changed
6. WHEN an Admin_User deletes a category, THE Category_Manager SHALL check if products exist in that category
7. WHEN a category has associated products, THE Category_Manager SHALL prevent deletion and return an error message
8. WHEN a category is created, updated, or deleted, THE Category_Manager SHALL invalidate all category caches in the Cache_Layer
9. THE Category_Manager SHALL return category data with product count for admin list views
10. THE Category_Manager SHALL enforce unique constraints on both name and slug fields

### Requirement 7: User Management for Admins

**User Story:** As an admin, I want to manage user accounts and permissions, so that I can control access to admin features.

#### Acceptance Criteria

1. WHEN an Admin_User requests the user list, THE User_Manager SHALL return all users with pagination (default 20 per page)
2. WHEN an Admin_User requests the user list, THE User_Manager SHALL include user ID, email, full name, admin status, and creation date
3. WHEN an Admin_User searches for users, THE User_Manager SHALL filter by email or full name using case-insensitive matching
4. WHEN an Admin_User requests user details, THE User_Manager SHALL return complete profile information
5. WHEN an Admin_User grants admin privileges, THE User_Manager SHALL update the isAdmin flag to true
6. WHEN an Admin_User revokes admin privileges, THE User_Manager SHALL update the isAdmin flag to false
7. WHEN an Admin_User attempts to revoke their own admin privileges, THE User_Manager SHALL prevent the action and return an error
8. WHEN an Admin_User requests a user's order history, THE User_Manager SHALL return all orders for that user with order details
9. THE User_Manager SHALL sort users by creation date (newest first) by default
10. THE User_Manager SHALL validate user existence before any update operation

### Requirement 8: Product Reviews and Ratings

**User Story:** As a customer, I want to review products I've purchased, so that I can share my experience with other shoppers.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits a review, THE Review_System SHALL validate the user has purchased the product
2. WHEN an Authenticated_User submits a review, THE Review_System SHALL validate the rating is between 1 and 5 stars
3. WHEN an Authenticated_User submits a review, THE Review_System SHALL validate the comment is not empty
4. WHEN a valid review is submitted, THE Review_System SHALL create a review record with user ID, product ID, rating, comment, and timestamp
5. WHEN a review is created, THE Review_System SHALL recalculate the product's average rating
6. WHEN an Authenticated_User attempts to submit a duplicate review for the same product, THE Review_System SHALL prevent the action and return an error
7. WHEN an Authenticated_User updates their review, THE Review_System SHALL update the rating and comment and recalculate the product average rating
8. WHEN an Authenticated_User deletes their review, THE Review_System SHALL remove the review and recalculate the product average rating
9. WHEN an Admin_User deletes any review, THE Review_System SHALL remove the review and recalculate the product average rating
10. WHEN a Public_User requests product reviews, THE Review_System SHALL return paginated reviews (default 10 per page) with reviewer name and date
11. THE Review_System SHALL sort reviews by most recent first by default

### Requirement 9: Advanced Product Discovery

**User Story:** As a customer, I want to discover products through search suggestions, related items, and curated lists, so that I can find products that interest me.

#### Acceptance Criteria

1. WHEN a Public_User types a search query, THE Search_Engine SHALL return up to 10 product title suggestions matching the query prefix
2. WHEN a Public_User requests related products, THE Search_Engine SHALL return up to 8 products from the same category excluding the current product
3. WHEN a Public_User requests trending products, THE Search_Engine SHALL return products sorted by order count in descending order
4. WHEN a Public_User requests deals, THE Search_Engine SHALL return products where oldPrice is greater than price
5. THE Search_Engine SHALL cache search suggestions in the Cache_Layer for 1 hour
6. THE Search_Engine SHALL cache related products in the Cache_Layer for 2 hours
7. THE Search_Engine SHALL cache trending products in the Cache_Layer for 30 minutes
8. THE Search_Engine SHALL cache deals in the Cache_Layer for 1 hour
9. THE Search_Engine SHALL use case-insensitive matching for search suggestions
10. THE Search_Engine SHALL return products with full details including images, prices, and ratings

### Requirement 10: Order Enhancements

**User Story:** As a customer, I want to provide shipping details and track my order, so that I know when my purchase will arrive.

#### Acceptance Criteria

1. WHEN an Authenticated_User creates an order, THE API_Server SHALL accept a shipping address as a JSON object with street, city, state, postal code, and country
2. WHEN an Authenticated_User creates an order, THE API_Server SHALL accept a payment method string (e.g., "Credit Card", "PayPal")
3. WHEN an Authenticated_User creates an order, THE API_Server SHALL accept optional order notes
4. WHEN an order is created, THE API_Server SHALL store the shipping address, payment method, and notes in the Database
5. WHEN an Admin_User updates an order, THE API_Server SHALL allow updating the tracking number
6. WHEN an Admin_User updates an order status, THE API_Server SHALL update the order status and timestamp
7. WHEN an Authenticated_User requests order details, THE API_Server SHALL return shipping address, payment method, tracking number, and notes
8. THE API_Server SHALL validate shipping address contains all required fields before order creation
9. THE API_Server SHALL validate payment method is not empty before order creation
10. THE API_Server SHALL store shipping address as JSON for flexible schema evolution

## Technical Constraints

### Performance Requirements

1. THE API_Server SHALL respond to cached read requests within 200 milliseconds
2. THE API_Server SHALL respond to uncached read requests within 500 milliseconds
3. THE Image_Processor SHALL compress images to achieve 70-80% file size reduction
4. THE Analytics_Engine SHALL complete dashboard queries within 1 second

### Security Requirements

1. THE API_Server SHALL enforce HTTPS for all requests in production
2. THE API_Server SHALL validate JWT tokens for all authenticated endpoints
3. THE API_Server SHALL enforce admin role checks for all admin endpoints
4. THE API_Server SHALL sanitize all user inputs to prevent XSS attacks
5. THE API_Server SHALL use parameterized queries via Prisma to prevent SQL injection
6. THE Storage_Bucket SHALL enforce RLS_Policy for upload and read operations
7. THE API_Server SHALL implement rate limiting on all public endpoints (60 requests per minute)

### Data Requirements

1. THE Database SHALL use PostgreSQL with Prisma ORM
2. THE Cache_Layer SHALL use Redis for caching
3. THE Storage_Bucket SHALL use Supabase Storage with CDN
4. THE API_Server SHALL support pagination with a default of 20 items per page
5. THE API_Server SHALL support a maximum of 50 items per page

### Integration Requirements

1. THE API_Server SHALL integrate with Supabase for authentication
2. THE API_Server SHALL integrate with Supabase Storage for image hosting
3. THE API_Server SHALL integrate with Redis for caching
4. THE API_Server SHALL deploy to Vercel as serverless functions

## Database Schema Requirements

### New Tables Required

1. **cart_items**: userId (UUID, FK to profiles), productId (UUID, FK to products), quantity (integer), createdAt (timestamp), updatedAt (timestamp)
2. **favorites**: userId (UUID, FK to profiles), productId (UUID, FK to products), createdAt (timestamp), unique constraint on (userId, productId)
3. **newsletter_subscribers**: email (string, unique), subscribedAt (timestamp)
4. **product_reviews**: id (UUID, PK), userId (UUID, FK to profiles), productId (UUID, FK to products), rating (integer 1-5), comment (text), createdAt (timestamp), updatedAt (timestamp), unique constraint on (userId, productId)

### Table Modifications Required

1. **orders**: Add columns shippingAddress (JSON), paymentMethod (string), trackingNumber (string, nullable), notes (text, nullable)

### Storage Requirements

1. **product-images bucket**: Create Supabase Storage bucket with public read access and authenticated write access
2. **RLS policies**: Configure policies for authenticated uploads and public reads

## API Endpoint Summary

### Cart Endpoints
- POST /api/cart - Add item to cart (authenticated)
- GET /api/cart - Get user's cart (authenticated)
- PUT /api/cart/:itemId - Update item quantity (authenticated)
- DELETE /api/cart/:itemId - Remove item (authenticated)
- DELETE /api/cart - Clear cart (authenticated)

### Favorites Endpoints
- POST /api/favorites - Add to favorites (authenticated)
- GET /api/favorites - Get user's favorites (authenticated)
- DELETE /api/favorites/:productId - Remove from favorites (authenticated)

### Newsletter Endpoints
- POST /api/newsletter/subscribe - Subscribe (public)
- GET /api/newsletter/subscribers - List subscribers (admin)
- DELETE /api/newsletter/:email - Unsubscribe (public)

### Analytics Endpoints
- GET /api/admin/analytics - Dashboard statistics (admin)

### Category Endpoints (Admin)
- POST /api/categories - Create category (admin)
- PUT /api/categories/:id - Update category (admin)
- DELETE /api/categories/:id - Delete category (admin)

### User Management Endpoints
- GET /api/admin/users - List users (admin)
- GET /api/admin/users/:id - Get user details (admin)
- PUT /api/admin/users/:id/role - Update admin status (admin)
- GET /api/admin/users/:id/orders - Get user orders (admin)

### Review Endpoints
- POST /api/products/:id/reviews - Add review (authenticated, purchased)
- GET /api/products/:id/reviews - Get reviews (public)
- PUT /api/reviews/:id - Update review (authenticated, owner or admin)
- DELETE /api/reviews/:id - Delete review (authenticated, owner or admin)

### Advanced Product Endpoints
- GET /api/products/search/suggestions?q= - Autocomplete (public)
- GET /api/products/related/:id - Related products (public)
- GET /api/products/trending - Trending products (public)
- GET /api/products/deals - Products with discounts (public)

### Image Upload Endpoints
- POST /api/upload/image - Upload single image (admin)
- POST /api/upload/images - Upload multiple images (admin)
- DELETE /api/upload/image - Delete image (admin)

## Success Criteria

1. All 10 feature areas are fully implemented with working API endpoints
2. Database migrations are successfully applied
3. Image upload with WebP compression achieves 70-80% file size reduction
4. Cart and favorites successfully migrate from localStorage to server
5. Admin dashboard displays real-time analytics with sub-second response times
6. Review system prevents duplicate reviews and correctly calculates average ratings
7. All endpoints are properly secured with authentication and authorization
8. Performance targets are met (cached < 200ms, uncached < 500ms)
9. Rate limiting prevents abuse on public endpoints
10. All user inputs are validated and sanitized
