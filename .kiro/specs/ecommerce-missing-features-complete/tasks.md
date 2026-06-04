# Implementation Plan: E-commerce Missing Features Complete

## Overview

This implementation plan converts the comprehensive backend feature design into actionable coding tasks. The plan implements 10 major feature areas: secure image upload with compression, shopping cart API, wishlist/favorites API, newsletter subscriptions, admin analytics dashboard, category management, user administration, product reviews and ratings, advanced product discovery, and order enhancements with shipping details.

The implementation follows a layered approach: database schema and migrations first, then core business logic, followed by API endpoints, and finally integration with caching and external services. Each task builds incrementally on previous work to ensure continuous validation and early detection of issues.

## Tasks

- [ ] 1. Set up database schema and migrations
  - [ ] 1.1 Create Prisma schema for new tables
    - Add CartItem model with userId, productId, quantity, timestamps
    - Add Favorite model with userId, productId, createdAt
    - Add NewsletterSubscriber model with email, subscribedAt
    - Add ProductReview model with userId, productId, rating, comment, timestamps
    - Add unique constraints: CartItem(userId, productId), Favorite(userId, productId), ProductReview(userId, productId)
    - Add indexes for performance: CartItem(userId, productId), Favorite(userId, productId), ProductReview(productId, userId, rating)
    - _Requirements: Database Schema Requirements, 2.1, 3.1, 4.1, 8.1_

  - [ ] 1.2 Modify Order model for shipping enhancements
    - Add shippingAddress field as Json type
    - Add paymentMethod field as String
    - Add trackingNumber field as nullable String
    - Add notes field as nullable Text
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 1.3 Generate and apply database migrations
    - Run `npx prisma migrate dev --name add-missing-features`
    - Verify all tables created successfully
    - Verify all indexes created successfully
    - Test rollback and reapply to ensure migration stability
    - _Requirements: Database Schema Requirements_

  - [ ] 1.4 Write unit tests for database schema
    - Test unique constraints on CartItem, Favorite, ProductReview
    - Test cascade deletes when user or product is deleted
    - Test foreign key relationships
    - _Requirements: 2.8, 3.6_


- [ ] 2. Implement Image Processor with WebP compression
  - [ ] 2.1 Create image upload utility with Sharp
    - Install sharp library for image processing
    - Create `api/lib/imageProcessor.js` with functions: validateImageFile, compressToWebP, generateMultipleSizes
    - Implement file type validation using MIME type checking
    - Implement file size validation (max 10MB)
    - Generate unique filenames using timestamp and UUID
    - _Requirements: 1.1, 1.2_

  - [ ] 2.2 Write property test for image format validation
    - **Property 1: Image Format Validation**
    - **Validates: Requirements 1.1**
    - Test that only JPEG, PNG, GIF, WebP files are accepted
    - Test that other file types are rejected with 400 error

  - [ ] 2.3 Write property test for image size validation
    - **Property 2: Image Size Validation**
    - **Validates: Requirements 1.2**
    - Test that files ≤10MB are accepted
    - Test that files >10MB are rejected with 400 error

  - [ ] 2.4 Implement WebP compression and multi-size generation
    - Create function to compress images to WebP format with quality 80
    - Generate thumbnail (150x150), medium (500x500), large (1200x1200) sizes
    - Maintain aspect ratio using 'cover' fit mode
    - Return buffer for each size
    - _Requirements: 1.3, 1.4_

  - [ ] 2.5 Write property test for WebP output
    - **Property 3: WebP Compression Output**
    - **Validates: Requirements 1.3**
    - Test that output files are in WebP format

  - [ ] 2.6 Write property test for multi-size generation
    - **Property 4: Multi-Size Image Generation**
    - **Validates: Requirements 1.4**
    - Test that exactly three sizes are generated with correct dimensions

  - [ ] 2.7 Integrate Supabase Storage for image uploads
    - Create `api/lib/supabaseStorage.js` with uploadImage and deleteImage functions
    - Configure Supabase client with storage bucket 'product-images'
    - Implement upload function that uploads all three sizes
    - Implement delete function that removes images by path
    - Return public URLs for uploaded images
    - _Requirements: 1.5, 1.6_

  - [ ] 2.8 Write property test for secure URL generation
    - **Property 5: Secure URL Generation**
    - **Validates: Requirements 1.6**
    - Test that all returned URLs start with "https://"


- [ ] 3. Create image upload API endpoints
  - [ ] 3.1 Implement POST /api/upload/image endpoint
    - Use multer middleware for multipart/form-data parsing
    - Validate file using imageProcessor.validateImageFile
    - Process image using imageProcessor functions
    - Upload to Supabase Storage
    - Return thumbnail, medium, large URLs
    - Require authentication and admin role
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 3.2 Implement POST /api/upload/images endpoint for multiple images
    - Accept array of image files
    - Process each image independently
    - Return array of URL sets
    - _Requirements: 1.10_

  - [ ] 3.3 Write property test for multi-image processing
    - **Property 8: Independent Multi-Image Processing**
    - **Validates: Requirements 1.10**
    - Test that N images return exactly N URL sets

  - [ ] 3.4 Implement DELETE /api/upload/image endpoint
    - Accept imageUrl in request body
    - Extract path from URL
    - Delete all three sizes (thumbnail, medium, large) from storage
    - Require authentication and admin role
    - _Requirements: 1.7, 1.8_

  - [ ] 3.5 Write unit tests for image upload endpoints
    - Test successful single image upload
    - Test successful multiple image upload
    - Test image deletion
    - Test authentication and authorization
    - Test error cases (invalid file type, file too large)

- [ ] 4. Checkpoint - Verify image upload functionality
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 5. Implement Shopping Cart API
  - [ ] 5.1 Create cart service layer
    - Create `api/services/cartService.js` with functions: addToCart, getCart, updateCartItem, removeCartItem, clearCart
    - Implement product existence validation
    - Implement stock validation
    - Implement upsert logic for adding items (create or update quantity)
    - Calculate subtotal and itemCount server-side
    - _Requirements: 2.1, 2.2, 2.3, 2.10_

  - [ ] 5.2 Write property test for product existence validation
    - **Property 9: Product Existence Validation**
    - **Validates: Requirements 2.1**
    - Test that operations succeed only when product exists

  - [ ] 5.3 Write property test for stock validation
    - **Property 10: Stock Validation**
    - **Validates: Requirements 2.2, 2.5**
    - Test that add/update operations succeed only when quantity ≤ stock

  - [ ] 5.4 Write property test for cart item upsert behavior
    - **Property 11: Cart Item Upsert Behavior**
    - **Validates: Requirements 2.3**
    - Test that multiple adds result in single cart item with summed quantity

  - [ ] 5.5 Write property test for cart total calculation
    - **Property 17: Cart Total Calculation**
    - **Validates: Requirements 2.10**
    - Test that subtotal = Σ(quantity × price) and itemCount = Σ(quantity)

  - [ ] 5.2 Implement POST /api/cart endpoint
    - Accept productId and quantity in request body
    - Validate inputs using cartService
    - Create or update cart item
    - Return cart item with product details
    - Require authentication
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 5.3 Implement GET /api/cart endpoint
    - Retrieve all cart items for authenticated user
    - Include full product details (title, price, image, stock)
    - Calculate and return subtotal and itemCount
    - Require authentication
    - _Requirements: 2.4, 2.10_

  - [ ] 5.6 Write property test for cart data completeness
    - **Property 12: Cart Data Completeness**
    - **Validates: Requirements 2.4**
    - Test that cart items include all required product fields


  - [ ] 5.4 Implement PUT /api/cart/:itemId endpoint
    - Accept quantity in request body
    - Validate stock availability
    - Update cart item quantity
    - Return updated cart item
    - Require authentication and ownership validation
    - _Requirements: 2.5_

  - [ ] 5.5 Implement DELETE /api/cart/:itemId endpoint
    - Delete specified cart item
    - Return success response
    - Require authentication and ownership validation
    - _Requirements: 2.6_

  - [ ] 5.7 Write property test for cart item deletion
    - **Property 13: Cart Item Deletion**
    - **Validates: Requirements 2.6**
    - Test that deleted items don't appear in subsequent cart retrievals

  - [ ] 5.6 Implement DELETE /api/cart endpoint
    - Delete all cart items for authenticated user
    - Return success response with deletedCount
    - Require authentication
    - _Requirements: 2.7_

  - [ ] 5.8 Write property test for cart clear operation
    - **Property 14: Cart Clear Operation**
    - **Validates: Requirements 2.7**
    - Test that clearing cart results in empty cart with itemCount = 0

  - [ ] 5.9 Write unit tests for cart API endpoints
    - Test all CRUD operations
    - Test authentication and authorization
    - Test error cases (invalid product, insufficient stock, not found)

- [ ] 6. Checkpoint - Verify cart functionality
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 7. Implement Wishlist/Favorites API
  - [ ] 7.1 Create favorites service layer
    - Create `api/services/favoritesService.js` with functions: addToFavorites, getFavorites, removeFromFavorites
    - Implement product existence validation
    - Implement idempotent add (return success for duplicates)
    - Sort favorites by createdAt descending
    - _Requirements: 3.1, 3.2, 3.3, 3.8_

  - [ ] 7.2 Write property test for favorite creation
    - **Property 18: Favorite Creation**
    - **Validates: Requirements 3.2**
    - Test that adding to favorites creates record with userId, productId, createdAt

  - [ ] 7.3 Write property test for idempotent favorite addition
    - **Property 19: Idempotent Favorite Addition**
    - **Validates: Requirements 3.3**
    - Test that duplicate adds don't create duplicate records

  - [ ] 7.2 Implement POST /api/favorites endpoint
    - Accept productId in request body
    - Validate product exists
    - Create favorite record (idempotent)
    - Return favorite with product details
    - Require authentication
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 7.3 Implement GET /api/favorites endpoint
    - Retrieve all favorites for authenticated user
    - Include full product details
    - Sort by most recently added first
    - Require authentication
    - _Requirements: 3.4, 3.8_

  - [ ] 7.4 Write property test for favorites data completeness
    - **Property 20: Favorites Data Completeness**
    - **Validates: Requirements 3.4**
    - Test that favorites include complete product details

  - [ ] 7.4 Implement DELETE /api/favorites/:productId endpoint
    - Delete favorite record for specified product
    - Return success response
    - Require authentication and ownership validation
    - _Requirements: 3.5_

  - [ ] 7.5 Write property test for favorite deletion
    - **Property 21: Favorite Deletion**
    - **Validates: Requirements 3.5**
    - Test that deleted favorites don't appear in subsequent retrievals

  - [ ] 7.6 Write unit tests for favorites API endpoints
    - Test all CRUD operations
    - Test authentication and authorization
    - Test error cases (invalid product, not found)


- [ ] 8. Implement cascade deletion for cart and favorites
  - [ ] 8.1 Verify Prisma cascade delete configuration
    - Ensure CartItem has onDelete: Cascade for user and product relations
    - Ensure Favorite has onDelete: Cascade for user and product relations
    - Test cascade behavior when product is deleted
    - Test cascade behavior when user is deleted
    - _Requirements: 2.8, 3.6_

  - [ ] 8.2 Write property test for cascade deletion
    - **Property 15: Cascade Deletion for Products**
    - **Validates: Requirements 2.8, 3.6**
    - Test that deleting product removes it from all carts and favorites

- [ ] 9. Checkpoint - Verify cart and favorites functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement Newsletter Subscription API
  - [ ] 10.1 Create newsletter service layer
    - Create `api/services/newsletterService.js` with functions: subscribe, getSubscribers, unsubscribe
    - Implement email format validation using regex
    - Implement idempotent subscribe (return success for duplicates)
    - Implement pagination support
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7_

  - [ ] 10.2 Write property test for email format validation
    - **Property 23: Email Format Validation**
    - **Validates: Requirements 4.1**
    - Test that only valid email formats are accepted

  - [ ] 10.3 Write property test for subscription record creation
    - **Property 24: Subscription Record Creation**
    - **Validates: Requirements 4.3**
    - Test that valid emails create records with email and subscribedAt

  - [ ] 10.2 Implement POST /api/newsletter/subscribe endpoint
    - Accept email in request body
    - Validate email format
    - Create subscription record (idempotent)
    - Return email and subscribedAt
    - Public endpoint (no authentication required)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.8_

  - [ ] 10.3 Implement GET /api/newsletter/subscribers endpoint
    - Retrieve all subscribers with pagination
    - Default page=1, limit=20, max limit=50
    - Return subscribers array and pagination metadata
    - Require authentication and admin role
    - _Requirements: 4.5, 4.7_

  - [ ] 10.4 Write property test for pagination behavior
    - **Property 25: Pagination Behavior**
    - **Validates: Requirements 4.7**
    - Test that pagination returns correct items and metadata


  - [ ] 10.4 Implement DELETE /api/newsletter/:email endpoint
    - Delete subscription record for specified email
    - Return success response
    - Public endpoint (no authentication required)
    - _Requirements: 4.6_

  - [ ] 10.5 Write property test for subscription deletion
    - **Property 26: Subscription Deletion**
    - **Validates: Requirements 4.6**
    - Test that unsubscribed emails don't appear in subscriber list

  - [ ] 10.6 Write unit tests for newsletter API endpoints
    - Test subscribe, list, and unsubscribe operations
    - Test email validation
    - Test pagination
    - Test admin authorization for list endpoint

- [ ] 11. Implement Admin Analytics Dashboard
  - [ ] 11.1 Create analytics service layer
    - Create `api/services/analyticsService.js` with functions for each metric
    - Implement revenue calculations (all-time, monthly, weekly)
    - Implement order count aggregations by status
    - Implement customer and product counts
    - Implement top products query
    - Implement recent orders query
    - Implement daily revenue query
    - Use Promise.all() to execute queries in parallel
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ] 11.2 Write property test for revenue calculation
    - **Property 28: Revenue Calculation Correctness**
    - **Validates: Requirements 5.1**
    - Test that revenue calculations are correct for all time periods

  - [ ] 11.3 Write property test for order count aggregation
    - **Property 29: Order Count Aggregation**
    - **Validates: Requirements 5.2, 5.8**
    - Test that order counts by status are correct

  - [ ] 11.4 Write property test for entity count aggregation
    - **Property 30: Entity Count Aggregation**
    - **Validates: Requirements 5.3, 5.4**
    - Test that customer and product counts are correct

  - [ ] 11.2 Implement GET /api/admin/analytics endpoint
    - Call all analytics service functions in parallel
    - Return comprehensive analytics object
    - Require authentication and admin role
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_


  - [ ] 11.3 Integrate Redis caching for analytics
    - Cache analytics results with key 'analytics:dashboard'
    - Set TTL to 5 minutes (300 seconds)
    - Return cached data if available and fresh
    - Store fresh data in cache after query execution
    - _Requirements: 5.9, 5.10_

  - [ ] 11.5 Write property test for analytics cache behavior
    - **Property 34: Analytics Cache Behavior**
    - **Validates: Requirements 5.9**
    - Test that cached results are returned when fresh

  - [ ] 11.6 Write unit tests for analytics endpoint
    - Test all metrics are returned correctly
    - Test admin authorization
    - Test cache hit and miss scenarios
    - Test parallel query execution

- [ ] 12. Checkpoint - Verify newsletter and analytics functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement Category Management CRUD
  - [ ] 13.1 Create category service layer
    - Create `api/services/categoryService.js` with functions: createCategory, updateCategory, deleteCategory
    - Implement slug generation algorithm (lowercase, replace spaces with hyphens, remove special chars)
    - Implement name uniqueness validation
    - Implement product count check before deletion
    - _Requirements: 6.1, 6.2, 6.4, 6.6, 6.10_

  - [ ] 13.2 Write property test for category name uniqueness
    - **Property 35: Category Name Uniqueness**
    - **Validates: Requirements 6.1, 6.4, 6.10**
    - Test that duplicate names are rejected

  - [ ] 13.3 Write property test for slug generation
    - **Property 36: Slug Generation from Name**
    - **Validates: Requirements 6.2**
    - Test that slugs are correctly generated from names

  - [ ] 13.2 Implement POST /api/categories endpoint
    - Accept name and optional icon in request body
    - Validate name uniqueness
    - Generate slug from name
    - Create category record
    - Return category with id, name, slug, icon, createdAt
    - Require authentication and admin role
    - _Requirements: 6.1, 6.2, 6.3_


  - [ ] 13.3 Implement PUT /api/categories/:id endpoint
    - Accept optional name and icon in request body
    - Validate name uniqueness if changed
    - Regenerate slug if name changed
    - Update category record
    - Return updated category
    - Require authentication and admin role
    - _Requirements: 6.4, 6.5_

  - [ ] 13.4 Write property test for conditional slug regeneration
    - **Property 38: Conditional Slug Regeneration**
    - **Validates: Requirements 6.5**
    - Test that slug is regenerated only when name changes

  - [ ] 13.4 Implement DELETE /api/categories/:id endpoint
    - Check if category has associated products
    - Reject deletion if products exist (409 Conflict)
    - Delete category if no products
    - Return success response
    - Require authentication and admin role
    - _Requirements: 6.6, 6.7_

  - [ ] 13.5 Write property test for category deletion prevention
    - **Property 39: Category Deletion Prevention**
    - **Validates: Requirements 6.6, 6.7**
    - Test that categories with products cannot be deleted

  - [ ] 13.5 Add cache invalidation to category operations
    - Invalidate 'categories:*' and 'products:*' keys on create/update/delete
    - Use Redis DEL or pattern matching
    - _Requirements: 6.8_

  - [ ] 13.6 Write unit tests for category API endpoints
    - Test create, update, and delete operations
    - Test slug generation
    - Test name uniqueness validation
    - Test deletion prevention with products
    - Test admin authorization

- [ ] 14. Implement User Management for Admins
  - [ ] 14.1 Create user management service layer
    - Create `api/services/userService.js` with functions: listUsers, getUserDetails, updateUserRole, getUserOrders
    - Implement search functionality (email or full name, case-insensitive)
    - Implement pagination support
    - Implement self-revocation prevention
    - Calculate user statistics (order count, total spent)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7, 7.10_


  - [ ] 14.2 Write property test for user search filtering
    - **Property 42: User Search Filtering**
    - **Validates: Requirements 7.3**
    - Test that search returns users matching email or full name

  - [ ] 14.3 Write property test for self-revocation prevention
    - **Property 45: Self-Revocation Prevention**
    - **Validates: Requirements 7.7**
    - Test that admins cannot revoke their own admin privileges

  - [ ] 14.2 Implement GET /api/admin/users endpoint
    - Accept page, limit, and search query parameters
    - Return paginated user list with id, email, fullName, isAdmin, createdAt
    - Support search by email or full name
    - Sort by createdAt descending
    - Require authentication and admin role
    - _Requirements: 7.1, 7.2, 7.3, 7.9_

  - [ ] 14.3 Implement GET /api/admin/users/:id endpoint
    - Retrieve user profile by ID
    - Calculate order count and total spent
    - Return complete user details
    - Require authentication and admin role
    - _Requirements: 7.4, 7.10_

  - [ ] 14.4 Implement PUT /api/admin/users/:id/role endpoint
    - Accept isAdmin boolean in request body
    - Prevent admin from revoking own admin privileges
    - Update user's isAdmin flag
    - Return updated user
    - Require authentication and admin role
    - _Requirements: 7.5, 7.6, 7.7_

  - [ ] 14.5 Implement GET /api/admin/users/:id/orders endpoint
    - Retrieve all orders for specified user
    - Support pagination
    - Return orders with id, totalAmount, status, createdAt, itemCount
    - Require authentication and admin role
    - _Requirements: 7.8_

  - [ ] 14.4 Write unit tests for user management endpoints
    - Test list, details, role update, and orders endpoints
    - Test search functionality
    - Test pagination
    - Test self-revocation prevention
    - Test admin authorization

- [ ] 15. Checkpoint - Verify category and user management functionality
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 16. Implement Product Review System
  - [ ] 16.1 Create review service layer
    - Create `api/services/reviewService.js` with functions: createReview, getReviews, updateReview, deleteReview, recalculateProductRating
    - Implement purchase validation (check if user has completed order with product)
    - Implement rating range validation (1-5)
    - Implement comment non-empty validation
    - Implement average rating calculation
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ] 16.2 Write property test for purchase validation
    - **Property 48: Purchase Validation for Reviews**
    - **Validates: Requirements 8.1**
    - Test that only users who purchased product can review

  - [ ] 16.3 Write property test for rating range validation
    - **Property 49: Rating Range Validation**
    - **Validates: Requirements 8.2**
    - Test that only ratings 1-5 are accepted

  - [ ] 16.4 Write property test for comment validation
    - **Property 50: Comment Non-Empty Validation**
    - **Validates: Requirements 8.3**
    - Test that empty comments are rejected

  - [ ] 16.2 Implement POST /api/products/:id/reviews endpoint
    - Accept rating and comment in request body
    - Validate user has purchased the product
    - Validate rating is 1-5
    - Validate comment is non-empty
    - Create review record
    - Recalculate product average rating
    - Return review with user details
    - Require authentication
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ] 16.5 Write property test for average rating calculation
    - **Property 52: Average Rating Calculation**
    - **Validates: Requirements 8.5**
    - Test that product rating is correctly calculated after review operations

  - [ ] 16.3 Implement GET /api/products/:id/reviews endpoint
    - Retrieve all reviews for specified product
    - Support pagination (default 10 per page)
    - Include reviewer name and avatar
    - Calculate and return averageRating and totalReviews
    - Sort by createdAt descending
    - Public endpoint (no authentication required)
    - _Requirements: 8.10, 8.11_


  - [ ] 16.4 Implement PUT /api/reviews/:id endpoint
    - Accept optional rating and comment in request body
    - Validate user is review owner
    - Update review record
    - Recalculate product average rating
    - Return updated review
    - Require authentication
    - _Requirements: 8.7_

  - [ ] 16.5 Implement DELETE /api/reviews/:id endpoint
    - Validate user is review owner or admin
    - Delete review record
    - Recalculate product average rating
    - Return success response
    - Require authentication
    - _Requirements: 8.8, 8.9_

  - [ ] 16.6 Add cache invalidation to review operations
    - Invalidate 'products:${productId}', 'products:*', 'reviews:${productId}:*' keys
    - Invalidate on create, update, and delete operations
    - _Requirements: Design - Review System Cache Invalidation_

  - [ ] 16.6 Write unit tests for review API endpoints
    - Test create, list, update, and delete operations
    - Test purchase validation
    - Test rating and comment validation
    - Test average rating calculation
    - Test ownership and admin authorization

- [ ] 17. Implement Advanced Product Discovery
  - [ ] 17.1 Create search service layer
    - Create `api/services/searchService.js` with functions: getSearchSuggestions, getRelatedProducts, getTrendingProducts, getDeals
    - Implement autocomplete query (prefix match on title)
    - Implement related products query (same category, exclude current)
    - Implement trending products query (sort by orders, rating)
    - Implement deals query (filter oldPrice > price, sort by discount %)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.9_

  - [ ] 17.2 Write property test for search autocomplete matching
    - **Property 56: Search Autocomplete Matching**
    - **Validates: Requirements 9.1, 9.9**
    - Test that search returns products with titles starting with query

  - [ ] 17.3 Write property test for related products filtering
    - **Property 57: Related Products Filtering**
    - **Validates: Requirements 9.2**
    - Test that related products are from same category and exclude current product


  - [ ] 17.2 Implement GET /api/products/search/suggestions endpoint
    - Accept query parameter 'q'
    - Return up to 10 products matching query prefix
    - Sort by orders DESC, rating DESC
    - Return id, title, price, image
    - Public endpoint (no authentication required)
    - _Requirements: 9.1, 9.9, 9.10_

  - [ ] 17.3 Implement GET /api/products/related/:id endpoint
    - Retrieve up to 8 products from same category
    - Exclude the current product
    - Sort by rating DESC, orders DESC
    - Return full product details
    - Public endpoint (no authentication required)
    - _Requirements: 9.2, 9.10_

  - [ ] 17.4 Implement GET /api/products/trending endpoint
    - Accept optional limit parameter (default 10, max 50)
    - Return products sorted by orders DESC, rating DESC
    - Return full product details
    - Public endpoint (no authentication required)
    - _Requirements: 9.3, 9.10_

  - [ ] 17.5 Implement GET /api/products/deals endpoint
    - Accept optional limit parameter (default 10, max 50)
    - Filter products where oldPrice > price
    - Sort by discount percentage DESC
    - Return full product details
    - Public endpoint (no authentication required)
    - _Requirements: 9.4, 9.10_

  - [ ] 17.6 Integrate Redis caching for search endpoints
    - Cache search suggestions with TTL 1 hour, key 'search:suggestions:${query}'
    - Cache related products with TTL 2 hours, key 'products:related:${productId}'
    - Cache trending products with TTL 30 minutes, key 'products:trending:${limit}'
    - Cache deals with TTL 1 hour, key 'products:deals:${limit}'
    - _Requirements: 9.5, 9.6, 9.7, 9.8_

  - [ ] 17.4 Write property test for search cache behavior
    - **Property 60: Search Cache Behavior**
    - **Validates: Requirements 9.5, 9.6, 9.7, 9.8**
    - Test that cached results are returned when within TTL

  - [ ] 17.5 Write unit tests for search endpoints
    - Test all search endpoints
    - Test query parameters and limits
    - Test cache hit and miss scenarios
    - Test sorting and filtering logic

- [ ] 18. Checkpoint - Verify review and search functionality
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 19. Enhance Order System with Shipping Details
  - [ ] 19.1 Update order service layer
    - Modify `api/services/orderService.js` to accept shipping details
    - Implement shipping address validation (all fields required)
    - Implement payment method validation (non-empty string)
    - Store shipping address as JSON
    - Store payment method, tracking number, and notes
    - _Requirements: 10.1, 10.2, 10.3, 10.8, 10.9, 10.10_

  - [ ] 19.2 Write property test for shipping address validation
    - **Property 68: Shipping Address Validation**
    - **Validates: Requirements 10.8**
    - Test that all shipping address fields are required

  - [ ] 19.3 Write property test for payment method validation
    - **Property 69: Payment Method Validation**
    - **Validates: Requirements 10.9**
    - Test that payment method is required and non-empty

  - [ ] 19.2 Modify POST /api/orders endpoint
    - Accept shippingAddress object with street, city, state, postalCode, country
    - Accept paymentMethod string
    - Accept optional notes string
    - Validate all required fields
    - Store shipping details in order record
    - Return order with all new fields
    - Require authentication
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.8, 10.9_

  - [ ] 19.3 Implement PUT /api/admin/orders/:id endpoint
    - Accept optional status and trackingNumber in request body
    - Update order record
    - Update updatedAt timestamp
    - Return updated order
    - Require authentication and admin role
    - _Requirements: 10.5, 10.6_

  - [ ] 19.4 Modify GET /api/orders/:id endpoint
    - Include shippingAddress, paymentMethod, trackingNumber, and notes in response
    - Return complete order details
    - Require authentication and ownership validation
    - _Requirements: 10.7_

  - [ ] 19.4 Write unit tests for order enhancements
    - Test order creation with shipping details
    - Test shipping address validation
    - Test payment method validation
    - Test order update with tracking number
    - Test order retrieval with all fields


- [ ] 20. Implement localStorage migration for cart and favorites
  - [ ] 20.1 Create migration utility
    - Create `api/utils/localStorageMigration.js` with mergeCart and mergeFavorites functions
    - Implement merge logic: combine unique products, sum quantities for duplicates
    - Handle conflicts (e.g., stock validation during merge)
    - _Requirements: 2.9, 3.7_

  - [ ] 20.2 Write property test for localStorage merge
    - **Property 16: LocalStorage Merge on First Login**
    - **Validates: Requirements 2.9, 3.7**
    - Test that localStorage items are correctly merged with server items

  - [ ] 20.2 Add migration endpoints
    - Create POST /api/cart/merge endpoint to accept localStorage cart items
    - Create POST /api/favorites/merge endpoint to accept localStorage favorites
    - Validate and merge items
    - Return merged cart/favorites
    - Require authentication
    - _Requirements: 2.9, 3.7_

  - [ ] 20.3 Write unit tests for migration endpoints
    - Test cart merge with duplicates
    - Test favorites merge with duplicates
    - Test stock validation during merge
    - Test authentication

- [ ] 21. Add comprehensive error handling and validation
  - [ ] 21.1 Create centralized error handler middleware
    - Create `api/middleware/errorHandler.js`
    - Handle Prisma errors (unique constraint, foreign key, not found)
    - Handle validation errors (400)
    - Handle authentication errors (401)
    - Handle authorization errors (403)
    - Handle not found errors (404)
    - Handle conflict errors (409)
    - Handle server errors (500)
    - Return consistent error response format
    - _Requirements: Technical Constraints - Security Requirements_

  - [ ] 21.2 Add input validation middleware
    - Create `api/middleware/validation.js` with validation schemas
    - Use express-validator or joi for request validation
    - Validate request body, query, and params
    - Return 400 errors for invalid inputs
    - _Requirements: Technical Constraints - Security Requirements_

  - [ ] 21.3 Write unit tests for error handling
    - Test all error types and status codes
    - Test error response format
    - Test validation middleware


- [ ] 22. Implement rate limiting and security middleware
  - [ ] 22.1 Configure rate limiting
    - Use express-rate-limit middleware
    - Set public endpoints to 60 requests/minute per IP
    - Set authenticated endpoints to 120 requests/minute per user
    - Set admin endpoints to 300 requests/minute per admin
    - Return 429 Too Many Requests when limit exceeded
    - _Requirements: Technical Constraints - Security Requirements_

  - [ ] 22.2 Add security headers with Helmet
    - Configure helmet middleware for security headers
    - Enable CORS with appropriate origins
    - Set Content-Security-Policy
    - Enable HSTS in production
    - _Requirements: Technical Constraints - Security Requirements_

  - [ ] 22.3 Write unit tests for rate limiting
    - Test rate limit enforcement
    - Test different limits for different endpoint types
    - Test 429 error response

- [ ] 23. Checkpoint - Verify all features integrated
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Set up testing infrastructure
  - [ ] 24.1 Configure Vitest for unit and integration tests
    - Install vitest, @vitest/ui, and supertest
    - Create vitest.config.js with test environment configuration
    - Set up test database connection
    - Configure test coverage reporting
    - _Requirements: Testing Strategy_

  - [ ] 24.2 Configure fast-check for property-based tests
    - Install fast-check library
    - Create test utilities for generating domain objects
    - Create arbitraries for products, users, orders, reviews, etc.
    - Set minimum 100 iterations per property test
    - _Requirements: Testing Strategy - Property-Based Testing Configuration_

  - [ ] 24.3 Create test utilities and helpers
    - Create test database setup/teardown functions
    - Create test user creation helpers
    - Create test data generators
    - Create authentication token helpers
    - _Requirements: Testing Strategy_


- [ ] 25. Write integration tests for complete workflows
  - [ ] 25.1 Write integration test for cart workflow
    - Test complete cart flow: add items, update quantities, view cart, clear cart
    - Test stock validation throughout workflow
    - Test cart persistence across requests

  - [ ] 25.2 Write integration test for favorites workflow
    - Test complete favorites flow: add products, view favorites, remove products
    - Test idempotent additions
    - Test favorites persistence

  - [ ] 25.3 Write integration test for review workflow
    - Test complete review flow: purchase product, submit review, update review, delete review
    - Test purchase validation
    - Test average rating updates

  - [ ] 25.4 Write integration test for order workflow with shipping
    - Test complete order flow: add to cart, create order with shipping details, track order
    - Test shipping address validation
    - Test order status updates

  - [ ] 25.5 Write integration test for admin workflows
    - Test analytics dashboard access
    - Test category management (create, update, delete)
    - Test user management (list, search, role updates)
    - Test image upload and deletion

- [ ] 26. Performance testing and optimization
  - [ ] 26.1 Add database indexes
    - Verify indexes exist on: cart_items(user_id, product_id), favorites(user_id, product_id)
    - Verify indexes exist on: product_reviews(product_id, user_id, rating)
    - Verify indexes exist on: orders(status, created_at), products(orders, old_price, price)
    - Test query performance with EXPLAIN ANALYZE
    - _Requirements: Data Models - Database Indexes_

  - [ ] 26.2 Optimize analytics queries
    - Test analytics query performance
    - Ensure all queries use indexes
    - Ensure parallel execution with Promise.all()
    - Verify response time < 1 second for fresh queries
    - Verify response time < 200ms for cached queries
    - _Requirements: Technical Constraints - Performance Requirements_

  - [ ] 26.3 Write performance tests
    - Test API response times for cached and uncached requests
    - Test image processing time
    - Test analytics query execution time
    - Verify all performance requirements are met


- [ ] 27. Documentation and deployment preparation
  - [ ] 27.1 Create API documentation
    - Document all endpoints with request/response examples
    - Document authentication requirements
    - Document rate limits
    - Document error codes and messages
    - Create Postman collection or OpenAPI spec
    - _Requirements: API Endpoint Summary_

  - [ ] 27.2 Create deployment guide
    - Document environment variables required
    - Document database migration steps
    - Document Redis configuration
    - Document Supabase Storage setup
    - Document Vercel deployment configuration
    - _Requirements: Technical Constraints - Integration Requirements_

  - [ ] 27.3 Create monitoring and logging setup
    - Configure logging for errors and slow queries
    - Set up error tracking (e.g., Sentry)
    - Configure performance monitoring
    - Document metrics to track
    - _Requirements: Implementation Notes - Monitoring and Observability_

- [ ] 28. Final checkpoint - Complete system verification
  - Run all unit tests and verify 80%+ coverage
  - Run all property-based tests (100 iterations each)
  - Run all integration tests
  - Verify all 69 correctness properties are tested
  - Test all API endpoints manually
  - Verify performance requirements are met
  - Ensure all tests pass, ask the user if questions arise.


## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and early error detection
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and integration points
- The implementation uses JavaScript/TypeScript with Express.js backend
- Database operations use Prisma ORM with PostgreSQL
- Caching uses Redis (Upstash) for performance optimization
- Image storage uses Supabase Storage with CDN
- Authentication uses Supabase Auth with JWT tokens
- All 69 correctness properties from the design document are covered by property tests
- Testing framework: Vitest for unit/integration tests, fast-check for property-based tests
- Minimum test coverage target: 80% overall, 90% for business logic
- Performance targets: cached requests < 200ms, uncached requests < 500ms
- Security: All sensitive operations require authentication, admin operations require role verification
- Rate limiting: 60 req/min for public endpoints, 120 req/min for authenticated, 300 req/min for admin

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["1.4", "2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["2.5", "2.6", "2.7", "2.8", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "3.5", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9"] },
    { "id": 6, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "8.1"] },
    { "id": 7, "tasks": ["8.2", "10.1", "10.2", "10.3", "10.4", "10.5", "10.6"] },
    { "id": 8, "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5", "11.6"] },
    { "id": 9, "tasks": ["13.1", "13.2", "13.3", "13.4", "13.5", "13.6"] },
    { "id": 10, "tasks": ["14.1", "14.2", "14.3", "14.4", "14.5", "14.4"] },
    { "id": 11, "tasks": ["16.1", "16.2", "16.3", "16.4", "16.5", "16.6", "16.6"] },
    { "id": 12, "tasks": ["17.1", "17.2", "17.3", "17.4", "17.5"] },
    { "id": 13, "tasks": ["17.2", "17.3", "17.4", "17.5", "17.6"] },
    { "id": 14, "tasks": ["19.1", "19.2", "19.3", "19.4", "19.4"] },
    { "id": 15, "tasks": ["20.1", "20.2", "20.3"] },
    { "id": 16, "tasks": ["21.1", "21.2", "21.3"] },
    { "id": 17, "tasks": ["22.1", "22.2", "22.3"] },
    { "id": 18, "tasks": ["24.1", "24.2", "24.3"] },
    { "id": 19, "tasks": ["25.1", "25.2", "25.3", "25.4", "25.5"] },
    { "id": 20, "tasks": ["26.1", "26.2", "26.3"] },
    { "id": 21, "tasks": ["27.1", "27.2", "27.3"] }
  ]
}
```
