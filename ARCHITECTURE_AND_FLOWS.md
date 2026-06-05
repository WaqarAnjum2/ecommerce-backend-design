# E-Commerce Platform - Technical Architecture Guide

## Overview

Complete documentation for the full-stack e-commerce application including:
- Complete tech stack details
- Database schema and relationships
- Backend API endpoints and functions
- Frontend components and structure
- System architecture and data flows
- Deployment information
- Performance optimization strategies

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER LAYER                               │
│                     (Web Browser)                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    HTTP/HTTPS (CORS)
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼──────────────────┐      ┌──────────▼──────────────┐
│  FRONTEND (React/Vite)   │      │  Supabase Auth          │
│  ┌──────────────────────┐│      │  ┌────────────────────┐ │
│  │ React Components     ││      │  │ JWT Authentication │ │
│  │ - Header             ││      │  │ - Login/Register   │ │
│  │ - ProductListing     ││      │  │ - Session Mgmt     │ │
│  │ - Cart               ││      │  │ - User Profiles    │ │
│  │ - Admin Portal       ││      │  └────────────────────┘ │
│  └──────────────────────┘│      └─────────────────────────┘
│  ┌──────────────────────┐│
│  │ Context State        ││
│  │ - AuthContext        ││
│  │ - CartContext        ││
│  └──────────────────────┘│
│  Vite (Dev Server)       │
│  Port: 5173              │
└───────┬──────────────────┘
        │ API Calls (/api/*)
        │ JWT Authorization
        │
┌───────▼──────────────────────────────────────────────────────┐
│         BACKEND API LAYER (Express.js)                        │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Middleware Pipeline                                      │ │
│  │ ┌─────────────┬──────────────┬──────────────┐            │ │
│  │ │ CORS        │ Helmet       │ Logging      │            │ │
│  │ │ Headers     │ Security     │ Diagnostic   │            │ │
│  │ └─────────────┴──────────────┴──────────────┘            │ │
│  │                                                            │ │
│  │ ┌──────────────────────────────────────────────────────┐ │ │
│  │ │ Routes                                               │ │ │
│  │ │ - /api/auth (Login, Register)                        │ │ │
│  │ │ - /api/products (CRUD, Filtering, Search)            │ │ │
│  │ │ - /api/categories (Browse categories)                │ │ │
│  │ │ - /api/orders (Order management)                     │ │ │
│  │ │ - /api/inquiries (B2B inquiries)                     │ │ │
│  │ │ - /api/profiles (User profile management)            │ │ │
│  │ │ - /api/health (Diagnostics)                          │ │ │
│  │ └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │ ┌──────────┬─────────────┬──────────────┐               │ │
│  │ │ Auth     │ Rate Limit  │ Cache        │               │ │
│  │ │ Token    │ Redis       │ Redis        │               │ │
│  │ │ Verify   │ Tracking    │ Storage      │               │ │
│  │ └──────────┴─────────────┴──────────────┘               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Vercel Serverless Functions                                  │
│  Port: 3001 (Local Development)                               │
└──────────┬─────────────────────────────────────┬──────────────┘
           │                                     │
           │ Prisma ORM                          │
           │ SQL Queries                         │ Redis Operations
           │                                     │
     ┌─────▼──────────────┐             ┌───────▼─────────────┐
     │ PostgreSQL DB      │             │ Redis Cache         │
     │ (Supabase)         │             │ (Upstash)           │
     │                    │             │                     │
     │ ┌────────────────┐ │             │ TTL: 1h - 24h       │
     │ │ Schema: auth   │ │             │ Key Prefix:         │
     │ │ - users        │ │             │ - cache:products    │
     │ │ - identities   │ │             │ - cache:categories  │
     │ │ - sessions     │ │             │ - ratelimit:*       │
     │ │ - mfa_factors  │ │             │                     │
     │ └────────────────┘ │             └─────────────────────┘
     │                    │
     │ ┌────────────────┐ │
     │ │ Schema: public │ │
     │ │ - profile      │ │
     │ │ - category     │ │
     │ │ - product      │ │
     │ │ - order        │ │
     │ │ - orderItem    │ │
     │ └────────────────┘ │
     │                    │
     │ Max Connections: 20│
     └────────────────────┘
```

---

## 2. REQUEST FLOW DIAGRAMS

### 2.1 User Authentication Flow

```
User Browser                          Backend API                        Supabase

   │                                     │                                 │
   │──────────────────────────────────→  │                                 │
   │  POST /api/auth/login               │                                 │
   │  {email, password}                  │                                 │
   │                                     │                                 │
   │                                     │──────────────────────────────→  │
   │                                     │  Verify credentials              │
   │                                     │  against auth schema             │
   │                                     │                                 │
   │                                     │←──────────────────────────────  │
   │                                     │  access_token, refresh_token    │
   │                                     │  user data                      │
   │                                     │                                 │
   │←──────────────────────────────────  │                                 │
   │  {access_token, refresh_token, user}│                                 │
   │                                     │                                 │
   │  Store tokens in localStorage       │                                 │
   │  Update AuthContext                 │                                 │
   │                                     │                                 │
   │──────────────────────────────────→  │                                 │
   │  GET /api/profiles/me               │                                 │
   │  Authorization: Bearer {token}      │                                 │
   │                                     │                                 │
   │                                     │  Query profile from DB          │
   │                                     │  (with user.id from JWT claim)  │
   │                                     │                                 │
   │←──────────────────────────────────  │                                 │
   │  {id, email, fullName, isAdmin}     │                                 │
   │                                     │                                 │
   │  User authenticated ✓               │                                 │
   │  Show dashboard/admin based on role │                                 │
```

### 2.2 Product Browsing and Filtering Flow

```
User Browser              Frontend React            Backend API           Redis Cache

   │                           │                         │                    │
   │ Click "Products"          │                         │                    │
   │──────────────────→         │                         │                    │
   │                    Render ProductListing            │                    │
   │                    Fetch products                   │                    │
   │                           │                         │                    │
   │                           │─────────────────────→   │                    │
   │                           │  GET /api/products      │                    │
   │                           │  ?category=electronics  │                    │
   │                           │  &sort=price_asc        │                    │
   │                           │                         │                    │
   │                           │                    Check cache key            │
   │                           │                    `cache:products:query:hash`│
   │                           │                         │───────────→        │
   │                           │                         │  Cache hit?         │
   │                           │                         │←────────────       │
   │                           │                         │  YES: Return        │
   │                           │                         │  cached data        │
   │                           │←─────────────────────   │                    │
   │                           │ {products, total, ...}  │                    │
   │←──────────────────────     │                         │                    │
   │  Render ProductCard list   │                         │                    │
   │  Display filters/sort UI   │                         │                    │
   │                           │                         │                    │
   │ User adjusts filter        │                         │                    │
   │ (e.g., minPrice=500)       │                         │                    │
   │──────────────────→         │                         │                    │
   │                    New query with updated params     │                    │
   │                           │──────────────────────→   │                    │
   │                           │  GET /api/products      │                    │
   │                           │  ?minPrice=500...       │                    │
   │                           │                         │                    │
   │                           │                    Build new cache key       │
   │                           │                         │─────────────→      │
   │                           │                         │  Cache miss?        │
   │                           │                         │←─────────────      │
   │                           │                         │  NO: Query DB       │
   │                           │                         │  Apply filters      │
   │                           │                         │                    │
   │                           │                         │  Store in cache    │
   │                           │                         │  TTL: 3600s        │
   │                           │                         │─────────────→      │
   │                           │←─────────────────────   │                    │
   │                           │ Filtered products        │                    │
   │←──────────────────────     │                         │                    │
   │  Update product list       │                         │                    │
```

### 2.3 Order Placement Flow

```
User Browser              Frontend              Backend API            PostgreSQL

   │                          │                      │                      │
   │ Add item to cart         │                      │                      │
   │──────────────────→        │                      │                      │
   │                   Update CartContext            │                      │
   │                   Store in localStorage         │                      │
   │                          │                      │                      │
   │ Click "Checkout"         │                      │                      │
   │──────────────────→        │                      │                      │
   │                   Check if authenticated?       │                      │
   │                   NO → Show AuthModal           │                      │
   │                   User logs in                  │                      │
   │                          │                      │                      │
   │                   POST /api/orders              │                      │
   │                   {items: [{productId, qty}]}  │                      │
   │                   Authorization: Bearer token   │                      │
   │                          │──────────────────→   │                      │
   │                          │                 Verify JWT token            │
   │                          │                 Extract user.id             │
   │                          │                                             │
   │                          │                 Validate each item:         │
   │                          │                 - Product exists?           │
   │                          │                 - Sufficient stock?         │
   │                          │─────────────────────────────────→           │
   │                          │  SELECT * FROM product               │
   │                          │  WHERE id IN (...)                  │
   │                          │←────────────────────────────────────       │
   │                          │  Product records with stock info            │
   │                          │                                             │
   │                          │  Stock validation passes ✓                  │
   │                          │                                             │
   │                          │  Create order transaction:                  │
   │                          │─────────────────────────────────→           │
   │                          │  INSERT INTO order (userId, ...)   │
   │                          │  INSERT INTO orderItem (...)        │
   │                          │  UPDATE product SET stock=...       │
   │                          │←────────────────────────────────────       │
   │                          │  Order created successfully                 │
   │                          │                                             │
   │                          │  Invalidate related caches                  │
   │                          │                                             │
   │←─────────────────────────│                      │                      │
   │ {orderId, status: pending}                     │                      │
   │                          │                      │                      │
   │ Clear cart               │                      │                      │
   │ Redirect to confirmation │                      │                      │
```

### 2.4 Admin Operations Flow

```
Admin Browser          Frontend              Backend API           PostgreSQL

   │                       │                      │                     │
   │ Login with admin      │                      │                     │
   │ email/password        │                      │                     │
   │──────────────→         │                      │                     │
   │                 POST /api/auth/login         │                     │
   │                       │──────────────────→   │                     │
   │                       │                 Verify credentials          │
   │                       │                 Return JWT + user data      │
   │                       │←──────────────────   │                     │
   │←─────────────────────  │                     │                     │
   │ {access_token, user}   │                     │                     │
   │                       │                      │                     │
   │                 GET /api/profiles/me        │                     │
   │                       │──────────────────→   │                     │
   │                       │                      │                     │
   │                       │                 Query profile               │
   │                       │────────────────────────────────→            │
   │                       │ SELECT * FROM profile WHERE id=user_id │
   │                       │←──────────────────────────────            │
   │                       │ {isAdmin: true, ...}                       │
   │                       │←──────────────────   │                     │
   │ Profile with          │                      │                     │
   │ isAdmin=true detected  │                      │                     │
   │                       │                      │                     │
   │ Redirect to AdminPortal
   │──────────────→         │                      │                     │
   │                 Render admin dashboard       │                     │
   │                       │                      │                     │
   │ Click "Create Product"                      │                     │
   │──────────────→         │                      │                     │
   │                 Show product form            │                     │
   │                       │                      │                     │
   │ Fill form and submit   │                      │                     │
   │──────────────→         │                      │                     │
   │                 POST /api/products           │                     │
   │                 {title, price, ...}         │                     │
   │                 Authorization: Bearer token  │                     │
   │                       │──────────────────→   │                     │
   │                       │                 Verify token               │
   │                       │                 Check if user is admin      │
   │                       │                 Validate input             │
   │                       │                                             │
   │                       │                 INSERT INTO product        │
   │                       │ ────────────────────────────→               │
   │                       │                 New product created         │
   │                       │ ←──────────────────────────               │
   │                       │                                             │
   │                       │ Invalidate cache:                           │
   │                       │ - cache:products:*                         │
   │                       │ - cache:categories:*                       │
   │                       │                      │                     │
   │←────────────────────── │                      │                     │
   │ {success, productId}   │                      │                     │
   │                       │                      │                     │
   │ Show success message   │                      │                     │
```

---

## 3. CACHING STRATEGY FLOW

```
Request comes in
        │
        ▼
Is Redis available?
    ├─ NO → Skip cache, query database
    │
    └─ YES
        │
        ▼
    Build cache key
    (route + params hash)
        │
        ▼
    redis.get(key)
        │
        ├─ HIT (data exists)
        │  │
        │  ▼
        │  Return cached response
        │  (Fast! ~1-5ms)
        │
        └─ MISS (no data)
           │
           ▼
        Query database
           │
           ▼
        Store in cache with TTL
        redis.set(key, data, {ex: ttlSeconds})
           │
           ▼
        Return response to client
        (Slower, but now cached)

Cache Invalidation:
    ├─ On product create/update/delete
    │  └─ redis.del('cache:products:*')
    │
    ├─ On order creation
    │  └─ redis.del('cache:orders:' + userId)
    │
    └─ Automatic expiration on TTL
       └─ 1 hour: Product queries
       └─ 24 hours: Categories
       └─ No cache: User-specific data
```

---

## 4. RATE LIMITING FLOW

```
API Request arrives
        │
        ▼
Extract client identifier
(IP address from req.ip)
        │
        ▼
Build Redis key
"ratelimit:{prefix}:{identifier}"
        │
        ▼
redis.incr(key)
        │
        ├─ First call in window?
        │  │
        │  ▼
        │  Set key expiration (window duration)
        │  Counter = 1
        │
        └─ Subsequent calls
           │
           ▼
        Increment counter
        │
        ├─ Counter ≤ max?
        │  │
        │  ▼
        │  ALLOW request
        │  Set 429 headers
        │
        └─ Counter > max?
           │
           ▼
        BLOCK request
        │
        ▼
        Return 429 Too Many Requests
        With Retry-After header

Rate Limit Windows:
    ├─ Public endpoints: 60 req/min
    ├─ Auth endpoints: 5 req/min
    ├─ Category queries: 60 req/min
    └─ Order creation: Auth required (no global limit)
```

---

## 5. DATA FLOW IN PRODUCT SEARCH

```
User enters search query "laptop"
        │
        ▼
Frontend builds query:
GET /api/products?search=laptop&page=1&limit=10
        │
        ▼
Backend receives request
        │
        ▼
Build where clause:
{
  OR: [
    { title: { contains: "laptop", mode: "insensitive" } },
    { desc: { contains: "laptop", mode: "insensitive" } },
    { brand: { contains: "laptop", mode: "insensitive" } },
    { category: { is: { 
        name: { contains: "laptop", mode: "insensitive" } 
    } } }
  ]
}
        │
        ▼
Apply pagination:
skip = (page - 1) * limit = 0
take = limit = 10
        │
        ▼
Execute Prisma query:
prisma.product.findMany({
  where: whereClause,
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0,
  include: { category: true }
})
        │
        ▼
Database executes SQL query
SELECT * FROM product
WHERE title ILIKE '%laptop%'
  OR description ILIKE '%laptop%'
  OR brand ILIKE '%laptop%'
  OR category_id IN (SELECT id FROM category 
                     WHERE name ILIKE '%laptop%')
LIMIT 10 OFFSET 0
        │
        ▼
Results returned
        │
        ▼
Count total matches:
prisma.product.count({where: whereClause})
        │
        ▼
Store in cache:
redis.set(cacheKey, JSON.stringify(results), {ex: 3600})
        │
        ▼
Return to frontend:
{
  products: [...],
  total: 45,
  page: 1,
  limit: 10,
  pages: 5
}
        │
        ▼
Frontend renders ProductCard list
with pagination controls
```

---

## 6. BACKEND API FUNCTION MATRIX

### Authentication Functions

```
┌─────────────────────────────────────────────────┐
│ POST /api/auth/login                            │
├─────────────────────────────────────────────────┤
│ Input:  { email, password }                     │
│ Output: { access_token, refresh_token, user }   │
│ Rate:   5 req/min                               │
│ Auth:   None (public)                           │
│ Steps:  1. Validate input format                │
│         2. Call Supabase auth endpoint          │
│         3. Return tokens on success             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ POST /api/auth/register                         │
├─────────────────────────────────────────────────┤
│ Input:  { email, password, fullName }           │
│ Output: { access_token, refresh_token, user }   │
│ Rate:   5 req/min                               │
│ Auth:   None (public)                           │
│ Steps:  1. Validate email format                │
│         2. Validate password (≥8 chars)         │
│         3. Check fullName not empty             │
│         4. Call Supabase signup endpoint        │
│         5. Create profile in DB (auto)          │
│         6. Return tokens                        │
└─────────────────────────────────────────────────┘
```

### Product Functions

```
┌─────────────────────────────────────────────────┐
│ GET /api/products                               │
├─────────────────────────────────────────────────┤
│ Params: category, search, minPrice, maxPrice    │
│         rating, brand, sort, page, limit        │
│ Output: { products[], total, page, pages }      │
│ Cache:  1 hour (by query hash)                  │
│ Auth:   None (public)                           │
│ Steps:  1. Parse and validate query params      │
│         2. Build Prisma where clause            │
│         3. Apply sorting                        │
│         4. Calculate pagination                 │
│         5. Query database with include          │
│         6. Count total results                  │
│         7. Cache and return                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ GET /api/products/:id                           │
├─────────────────────────────────────────────────┤
│ Input:  productId (UUID)                        │
│ Output: { id, title, price, ... }               │
│ Cache:  1 hour (by product ID)                  │
│ Auth:   None (public)                           │
│ Steps:  1. Validate UUID format                 │
│         2. Check cache                          │
│         3. Query by ID with includes            │
│         4. Return 404 if not found              │
│         5. Cache result                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ POST /api/products (Admin only)                 │
├─────────────────────────────────────────────────┤
│ Input:  { title, categoryId, price, stock, ... }│
│ Output: { id, ... } (new product)               │
│ Auth:   Required + Admin role                   │
│ Steps:  1. Verify JWT token                     │
│         2. Check if user is admin               │
│         3. Validate input fields                │
│         4. Check category exists                │
│         5. Create product in DB                 │
│         6. Invalidate cache                     │
│         7. Return created product               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ PUT /api/products/:id (Admin only)              │
├─────────────────────────────────────────────────┤
│ Input:  { title, price, stock, ... }            │
│ Output: { updated product }                     │
│ Auth:   Required + Admin role                   │
│ Steps:  1. Verify JWT and admin role            │
│         2. Validate product exists              │
│         3. Validate input fields                │
│         4. Update product in DB                 │
│         5. Invalidate related cache             │
│         6. Return updated product               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ DELETE /api/products/:id (Admin only)           │
├─────────────────────────────────────────────────┤
│ Input:  productId                               │
│ Output: { success: true }                       │
│ Auth:   Required + Admin role                   │
│ Steps:  1. Verify JWT and admin role            │
│         2. Check if product exists              │
│         3. Check for active orders with product │
│         4. Delete product (cascade delete items)│
│         5. Invalidate cache                     │
│         6. Return success                       │
└─────────────────────────────────────────────────┘
```

### Category Functions

```
┌─────────────────────────────────────────────────┐
│ GET /api/categories                             │
├─────────────────────────────────────────────────┤
│ Output: [{ id, name, slug, image, desc }, ...]  │
│ Cache:  24 hours (long-lived)                   │
│ Auth:   None (public)                           │
│ Steps:  1. Check Redis cache                    │
│         2. If miss: Query all categories        │
│         3. Order by name ascending              │
│         4. Store in cache                       │
│         5. Return category list                 │
└─────────────────────────────────────────────────┘
```

### Order Functions

```
┌─────────────────────────────────────────────────┐
│ GET /api/orders                                 │
├─────────────────────────────────────────────────┤
│ Output: [{ id, status, totalPrice, items[] }]   │
│ Auth:   Required (user sees own orders)         │
│ Steps:  1. Verify JWT token                     │
│         2. Extract user.id from token           │
│         3. Query orders where userId = user.id  │
│         4. Include orderItems and products      │
│         5. Order by createdAt DESC              │
│         6. Return user's orders only            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ POST /api/orders (Create order)                 │
├─────────────────────────────────────────────────┤
│ Input:  { items: [{productId, quantity}, ...] } │
│ Output: { id, status, totalPrice, ... }         │
│ Auth:   Required                                │
│ Steps:  1. Verify JWT token                     │
│         2. Validate items array                 │
│         3. Validate each item exists            │
│         4. Check stock availability             │
│         5. Calculate total price                │
│         6. Begin transaction:                   │
│            a. Insert order record               │
│            b. Insert orderItem records          │
│            c. Update product stock              │
│         7. Commit transaction                   │
│         8. Invalidate cache                     │
│         9. Return created order                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ GET /api/orders/:id                             │
├─────────────────────────────────────────────────┤
│ Input:  orderId                                 │
│ Output: { id, status, items[], totalPrice, ... }│
│ Auth:   Required                                │
│ Steps:  1. Verify JWT                           │
│         2. Query order by ID                    │
│         3. Verify ownership (userId = user.id)  │
│         4. Include full orderItem data          │
│         5. Return 403 if not owner              │
│         6. Return order details                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ PUT /api/orders/:id (Update status)             │
├─────────────────────────────────────────────────┤
│ Input:  { status: "shipped" | "delivered" }     │
│ Output: { updated order }                       │
│ Auth:   Required + Admin role                   │
│ Steps:  1. Verify JWT + admin                   │
│         2. Check order exists                   │
│         3. Validate status value                │
│         4. Update order status                  │
│         5. Return updated order                 │
└─────────────────────────────────────────────────┘
```

### Profile Functions

```
┌─────────────────────────────────────────────────┐
│ GET /api/profiles/me                            │
├─────────────────────────────────────────────────┤
│ Output: { id, email, fullName, isAdmin, ... }   │
│ Auth:   Required                                │
│ Steps:  1. Verify JWT token                     │
│         2. Extract user.id from claims          │
│         3. Query profile by user.id             │
│         4. Auto-create if doesn't exist         │
│         5. Return profile object                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ PUT /api/profiles/me (Update profile)           │
├─────────────────────────────────────────────────┤
│ Input:  { fullName, avatarUrl }                 │
│ Output: { updated profile }                     │
│ Auth:   Required                                │
│ Steps:  1. Verify JWT token                     │
│         2. Extract user.id                      │
│         3. Update profile fields                │
│         4. Return updated profile               │
└─────────────────────────────────────────────────┘
```

### Inquiry Functions

```
┌─────────────────────────────────────────────────┐
│ POST /api/inquiries                             │
├─────────────────────────────────────────────────┤
│ Input:  { subject, details, quantity, unit }    │
│ Output: { success: true }                       │
│ Auth:   Optional (can be anonymous)             │
│ Steps:  1. Validate subject + details           │
│         2. Extract user info if authenticated   │
│         3. Create inquiry object                │
│         4. Store in inquiries.json file         │
│         5. Return success                       │
│ Note:   Future: Migrate to database             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ GET /api/inquiries (Admin only)                 │
├─────────────────────────────────────────────────┤
│ Output: [{ id, subject, details, status, ... }] │
│ Auth:   Required + Admin role                   │
│ Steps:  1. Verify JWT + admin                   │
│         2. Read inquiries.json file             │
│         3. Return all inquiries                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ PUT /api/inquiries/:id (Update status)          │
├─────────────────────────────────────────────────┤
│ Input:  { status: "new" | "pending" | "resolved"}
│ Output: { updated inquiry }                     │
│ Auth:   Required + Admin role                   │
│ Steps:  1. Verify JWT + admin                   │
│         2. Find inquiry in file                 │
│         3. Update status                        │
│         4. Write back to file                   │
│         5. Return updated                       │
└─────────────────────────────────────────────────┘
```

### Health Check

```
┌─────────────────────────────────────────────────┐
│ GET /api/health                                 │
├─────────────────────────────────────────────────┤
│ Output: { status: "ok", timestamp, environment }│
│ Auth:   None (public)                           │
│ Rate:   60 req/min                              │
│ Steps:  1. Return current status                │
│         2. Include server timestamp             │
│         3. Include environment (prod/dev)       │
│ Usage:  Uptime monitoring, healthchecks         │
└─────────────────────────────────────────────────┘
```

---

## 7. MIDDLEWARE EXECUTION ORDER

```
┌──────────────────────┐
│ HTTP Request arrives │
└──────────┬───────────┘
           │
           ▼
    ┌─────────────────┐
    │ body parser     │ Parse JSON body (10MB limit)
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ diagnostic log  │ Log method + URL for debugging
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Helmet headers  │ Add security headers (CSP, X-Frame-Options, etc)
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ CORS middleware │ Check origin, handle preflight
    └────────┬────────┘
             │
             ▼
  ┌──────────────────────┐
  │ Route-specific middleware:
  │  (depends on route)   │
  │
  │ ├─ Public routes:
  │ │  - cacheMiddleware
  │ │  - rateLimit
  │ │  - optional auth
  │ │
  │ ├─ Protected routes:
  │ │  - verifyToken (required)
  │ │  - noCacheHeaders
  │ │  - optional: requireAdmin
  │ │
  │ └─ Admin routes:
  │    - verifyToken (required)
  │    - requireAdmin (required)
  │    - noCacheHeaders
  │
  └─────────────┬────────┘
                │
                ▼
         ┌────────────────┐
         │ Route handler  │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ Response sent  │
         └────────────────┘
```

---

## 8. FRONTEND COMPONENT HIERARCHY

```
App.jsx (Main)
│
├─ AuthContext.Provider
│  └─ CartContext.Provider
│     └─ Header
│        ├─ Search
│        ├─ CartIcon
│        ├─ UserMenu
│        │  ├─ Profile link
│        │  ├─ Orders link
│        │  ├─ Favorites link
│        │  ├─ Admin link (if admin)
│        │  └─ Logout
│        └─ AuthModal
│
├─ Content Router (based on currentPage state)
│  │
│  ├─ "home" page
│  │  ├─ Hero
│  │  ├─ Deals
│  │  ├─ CategorySection
│  │  ├─ ProductCardCarousel (homeItems)
│  │  ├─ ProductCardCarousel (electronicsItems)
│  │  ├─ RecommendedItems
│  │  ├─ Services
│  │  ├─ RegionSuppliers
│  │  ├─ InquiryForm
│  │  └─ Newsletter
│  │
│  ├─ "listing" page
│  │  └─ ProductListing
│  │     ├─ Filters
│  │     ├─ ProductCard (multiple)
│  │     └─ Pagination
│  │
│  ├─ "details" page
│  │  └─ ProductDetails
│  │     ├─ Images
│  │     ├─ Price/Stock
│  │     ├─ Add to Cart button
│  │     ├─ Add to Favorites button
│  │     └─ Description
│  │
│  ├─ "cart" page
│  │  └─ Cart
│  │     ├─ CartItem (multiple)
│  │     ├─ Quantity adjuster
│  │     ├─ Remove button
│  │     ├─ Subtotal
│  │     └─ Checkout button
│  │
│  ├─ "profile" page
│  │  └─ Profile
│  │     ├─ User info form
│  │     ├─ Avatar upload
│  │     └─ Save changes
│  │
│  ├─ "messages" page
│  │  └─ Messages
│  │     ├─ MessageList
│  │     └─ MessageDetail
│  │
│  ├─ "orders" page
│  │  └─ Orders
│  │     ├─ OrderList
│  │     ├─ OrderCard (multiple)
│  │     └─ Track order link
│  │
│  ├─ "favorites" page
│  │  └─ Favorites
│  │     ├─ FavoriteItem (multiple)
│  │     └─ Remove button
│  │
│  ├─ "myinquiries" page
│  │  └─ MyInquiries
│  │     ├─ InquiryList
│  │     └─ InquiryCard (multiple)
│  │
│  ├─ "shipping" page
│  │  └─ ShippingAddress
│  │     ├─ Address form
│  │     ├─ Add address
│  │     └─ Set default
│  │
│  ├─ "payment" page
│  │  └─ PaymentMethods
│  │     ├─ PaymentCard (multiple)
│  │     ├─ Add payment
│  │     └─ Set default
│  │
│  └─ "admin" page
│     └─ AdminPortal
│        ├─ Stats dashboard
│        ├─ Product management
│        ├─ Category management
│        ├─ Order management
│        ├─ Inquiry management
│        └─ User management
│
└─ Footer
   ├─ Links
   ├─ Company info
   ├─ Newsletter signup
   └─ Social media
```

---

## 9. STATE MANAGEMENT ARCHITECTURE

```
Global State (Context)
├─ AuthContext
│  ├─ user: {id, email, ...} | null
│  ├─ session: {access_token, refresh_token} | null
│  ├─ profile: {id, fullName, isAdmin, ...} | null
│  ├─ loading: boolean
│  ├─ signUp: (email, password, name) => Promise
│  ├─ signIn: (email, password) => Promise
│  ├─ signOut: () => Promise
│  └─ refetchProfile: () => Promise
│
└─ CartContext
   ├─ items: [{id, productId, quantity, price}, ...]
   ├─ addItem: (product, quantity) => void
   ├─ removeItem: (productId) => void
   ├─ updateQuantity: (productId, qty) => void
   ├─ clearCart: () => void
   ├─ total: number (computed)
   └─ itemCount: number (computed)

Local Component State (useState)
├─ currentPage: string (home, listing, cart, etc)
├─ selectedProductId: string | null
├─ showAuthModal: boolean
├─ searchQuery: string
├─ homeItems: ProductItem[]
├─ electronicsItems: ProductItem[]
├─ isLoading: boolean
├─ error: string | null
└─ formData: {[key]: value}

Browser Storage
├─ localStorage
│  ├─ access_token (from Supabase)
│  ├─ refresh_token (from Supabase)
│  ├─ cart (backup of CartContext)
│  └─ user_preferences
│
└─ sessionStorage
   └─ temporaryFormState
```

---

## 10. ERROR HANDLING STRATEGY

```
Error Flow

API Call Made
    │
    ├─ Network Error
    │  └─ Display: "Network connection failed"
    │     Action: Retry button, offline indicator
    │
    ├─ 4xx Client Error
    │  │
    │  ├─ 400 Bad Request
    │  │  └─ Display: "Invalid input: {field description}"
    │  │
    │  ├─ 401 Unauthorized
    │  │  └─ Display: "Please log in to continue"
    │  │     Action: Redirect to auth, redirect to login
    │  │
    │  ├─ 403 Forbidden
    │  │  └─ Display: "You don't have permission"
    │  │
    │  └─ 404 Not Found
    │     └─ Display: "Resource not found"
    │
    ├─ 5xx Server Error
    │  └─ Display: "Server error. Please try again later"
    │     Action: Auto-retry with exponential backoff
    │
    └─ Timeout
       └─ Display: "Request timed out"
          Action: Retry button
```

---

## 11. DATABASE INDEXING STRATEGY

```
Indexes for Performance Optimization

Product Table
├─ INDEX (categoryId) - Fast category filtering
├─ INDEX (brand) - Fast brand filtering
├─ INDEX (price) - Fast price range queries
├─ INDEX (rating) - Fast rating filtering
├─ INDEX (createdAt DESC) - Fast sorting
├─ INDEX (title) - For text search (consider FULLTEXT)
└─ COMPOSITE INDEX (categoryId, price) - Combined filter

Order Table
├─ INDEX (userId) - Fast user order lookup
├─ INDEX (createdAt DESC) - Fast chronological sorting
└─ INDEX (status) - Fast order status filtering

OrderItem Table
├─ INDEX (orderId) - Fast order detail lookup
├─ INDEX (productId) - Fast product queries
└─ COMPOSITE INDEX (orderId, productId)

Category Table
├─ UNIQUE INDEX (slug) - Unique slug constraint
└─ UNIQUE INDEX (name) - Category uniqueness

Profile Table
└─ UNIQUE INDEX (email) - Email uniqueness for queries
```

---

## 12. DEPLOYMENT PIPELINE

```
Code Commit
    │
    ▼
GitHub Webhook → Vercel
    │
    ├─ Trigger build for /frontend
    │  ├─ npm install
    │  ├─ npm run build
    │  ├─ Output: dist/ (static files)
    │  ├─ Deploy to Vercel CDN
    │  └─ URL: ecommerce-app.vercel.app
    │
    ├─ Trigger build for /api
    │  ├─ npm install (api/)
    │  ├─ Generate Prisma client
    │  ├─ Wrap Express app with serverless-http
    │  └─ Deploy as serverless functions
    │
    └─ Run tests (if configured)
       ├─ Unit tests
       ├─ Integration tests
       └─ E2E tests

Post-deployment
    ├─ Run database migrations (if needed)
    ├─ Monitor error rates
    ├─ Check health endpoint
    └─ Smoke tests
```

---

## 13. REPOSITORY STRUCTURE

```
ecommerce-frontend-design/
│
├─ README.md (Setup instructions)
├─ package.json (Frontend dependencies)
├─ package-lock.json
├─ vite.config.js (Vite configuration)
├─ tailwind.config.js (Tailwind configuration)
├─ postcss.config.js (PostCSS configuration)
├─ .gitignore
├─ .env.example (Template for env vars)
├─ vercel.json (Vercel configuration)
│
├─ api/
│  ├─ package.json (Backend dependencies)
│  ├─ package-lock.json
│  ├─ index.js (Express server entry point)
│  ├─ .gitignore
│  │
│  ├─ config/
│  │  └─ env.js (Load environment variables)
│  │
│  ├─ lib/
│  │  ├─ prisma.js (Prisma client singleton)
│  │  └─ redis.js (Redis client singleton)
│  │
│  ├─ middleware/
│  │  ├─ auth.js (JWT verification)
│  │  ├─ cache.js (Redis caching)
│  │  └─ rateLimit.js (Rate limiting)
│  │
│  ├─ routes/
│  │  ├─ auth.js (Login, register)
│  │  ├─ products.js (Product CRUD + search)
│  │  ├─ categories.js (Category browsing)
│  │  ├─ orders.js (Order management)
│  │  ├─ inquiries.js (B2B inquiries)
│  │  └─ profiles.js (User profiles)
│  │
│  ├─ prisma/
│  │  ├─ schema.prisma (Database schema)
│  │  ├─ migrations/ (Database migrations)
│  │  └─ seed.js (Optional data seeding)
│  │
│  └─ data/
│     └─ inquiries.json (Inquiry storage - temp)
│
├─ src/
│  ├─ main.jsx (React entry point)
│  ├─ App.jsx (Main application component)
│  ├─ index.css (Global styles)
│  │
│  ├─ components/
│  │  ├─ Header.jsx
│  │  ├─ Hero.jsx
│  │  ├─ Footer.jsx
│  │  ├─ AuthModal.jsx
│  │  ├─ ProductListing.jsx
│  │  ├─ ProductDetails.jsx
│  │  ├─ ProductCardCarousel.jsx
│  │  ├─ Cart.jsx
│  │  ├─ Orders.jsx
│  │  ├─ Profile.jsx
│  │  ├─ Favorites.jsx
│  │  ├─ MyInquiries.jsx
│  │  ├─ ShippingAddress.jsx
│  │  ├─ PaymentMethods.jsx
│  │  ├─ InquiryForm.jsx
│  │  ├─ Messages.jsx
│  │  ├─ AdminPortal.jsx
│  │  ├─ CategorySection.jsx
│  │  ├─ Deals.jsx
│  │  ├─ Services.jsx
│  │  ├─ RegionSuppliers.jsx
│  │  ├─ RecommendedItems.jsx
│  │  └─ Newsletter.jsx
│  │
│  ├─ context/
│  │  ├─ AuthContext.jsx (User authentication state)
│  │  └─ CartContext.jsx (Shopping cart state)
│  │
│  ├─ lib/
│  │  ├─ supabase.js (Supabase client)
│  │  └─ favorites.js (Favorite items management)
│  │
│  └─ assets/
│     ├─ Image/
│     │  ├─ backgrounds/
│     │  ├─ interior/
│     │  └─ tech/
│     └─ Layout/
│        ├─ alibaba/
│        ├─ Brand/
│        ├─ Form/
│        ├─ Misc/
│        └─ Layout1/
│
└─ public/
   └─ (Static assets served as-is)
```

---

## 14. KEY ENDPOINTS QUICK REFERENCE

```
PREFIX: /api (all endpoints)

PUBLIC ENDPOINTS
├─ GET  /health - Health check
├─ GET  /categories - List categories
├─ GET  /products - List products (with filters)
├─ GET  /products/:id - Product details
├─ POST /auth/login - User login
├─ POST /auth/register - User registration
└─ POST /inquiries - Submit inquiry

PROTECTED ENDPOINTS
├─ GET    /profiles/me - Current user profile
├─ PUT    /profiles/me - Update profile
├─ GET    /orders - User's orders
├─ GET    /orders/:id - Order details
├─ POST   /orders - Create order
└─ PUT    /orders/:id - Update order status

ADMIN ENDPOINTS
├─ POST   /products - Create product
├─ PUT    /products/:id - Update product
├─ DELETE /products/:id - Delete product
├─ GET    /inquiries - List all inquiries
└─ PUT    /inquiries/:id - Update inquiry status
```

---

## 15. INSTALLATION AND SETUP GUIDE

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (or Supabase account)
- Redis (or Upstash account)
- Supabase account for authentication

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone [REPOSITORY_URL]
cd ecommerce-frontend-design

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd api
npm install
cd ..

# 4. Create environment file
cp .env.example .env

# 5. Edit .env with your configuration
# Add: DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, etc.

# 6. Run database migrations
cd api
npm run migrate
npm run generate
cd ..

# 7. Start frontend dev server (Terminal 1)
npm run dev
# Runs on http://localhost:5173

# 8. Start backend dev server (Terminal 2)
cd api
npm run dev
# Runs on http://localhost:3001

# 9. Open http://localhost:5173 in browser
# Frontend proxy redirects /api calls to localhost:3001
```

---

## Repository Link Placeholder

**ADD YOUR REPOSITORY URL HERE**
- GitHub: [Your Repository URL]
- Live Demo: [Your Deployment URL]
- Documentation: [This Report]

---

*Generated: Technical Report for E-Commerce Full-Stack Platform*
*Version: 1.0.0*
