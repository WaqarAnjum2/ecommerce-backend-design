-- ==============================================================
-- SQL UPDATE SCRIPT FOR E-COMMERCE DATABASE (SUPABASE EDITOR)
-- Run this script in the Supabase SQL Editor to apply database changes.
-- ==============================================================

-- 1. ALTER PRODUCTS TABLE TO ADD MULTIPLE IMAGES SUPPORT
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}'::TEXT[] NOT NULL;

-- 2. CREATE ORDER HISTORY TABLE AND RLS POLICIES
CREATE TABLE IF NOT EXISTS public.order_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT DEFAULT 'Delivered'::TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent errors
DROP POLICY IF EXISTS "Users can view their own order history or admins all" ON public.order_history;
DROP POLICY IF EXISTS "Only admins can manage order history" ON public.order_history;

-- Create policies for order_history
CREATE POLICY "Users can view their own order history or admins all" 
ON public.order_history FOR SELECT 
TO authenticated
USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.is_admin = TRUE
    )
);

CREATE POLICY "Only admins can manage order history" 
ON public.order_history FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.is_admin = TRUE
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.is_admin = TRUE
    )
);

-- ==============================================================
-- 3. UPDATE EACH SPECIFIC PRODUCT WITH 4 UNIQUE UNSPLASH IMAGES
-- ==============================================================

-- 1. Soft chairs
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Soft chairs';

-- 2. Sofa & chair
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Sofa & chair';

-- 3. Kitchen dishes
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1535690590664-e5b9af9db0ce?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Kitchen dishes';

-- 4. Smart watches (Home & Outdoor Category)
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Smart watches' AND category_id = (SELECT id FROM public.categories WHERE slug = 'home-outdoor');

-- 5. Kitchen mixer
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1600789125438-c68e1858a74e?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Kitchen mixer';

-- 6. Blenders
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1570222094114-b054a817cfdd?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1626803775151-61d756612f97?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Blenders';

-- 7. Home appliance
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1604335399105-a0c5e5fd90f1?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Home appliance';

-- 8. Coffee maker
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1518057111178-44a106bad636?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Coffee maker';

-- 9. Smart watches (Consumer Electronics Category)
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Smart watches' AND category_id = (SELECT id FROM public.categories WHERE slug = 'electronics');

-- 10. Cameras
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1502920917128-1da500764c6d?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1510127852285-5b8d57919d35?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Cameras';

-- 11. Headphones
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Headphones';

-- 12. Smartphones (Apple)
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1565849906461-0965d33a70eb?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1573148195900-7845dcb9b127?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Smartphones' AND brand = 'Apple';

-- 13. Gaming set
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Gaming set';

-- 14. Laptop & PC
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Laptop & PC';

-- 15. Smartphones (Pocco)
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1525598912003-663126343e1f?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1533228893-a40597abb64b?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Smartphones' AND brand = 'Pocco';

-- 16. Electric kettle
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1594385208974-2e75f9d3ab28?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1594056263599-5282496a798b?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Electric kettle';

-- 17. GoPro HERO6 4K Action Camera - Black
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1513077202514-c511b1fbd42b?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'GoPro HERO6 4K Action Camera - Black';

-- 18. Canon EOS 200D DSLR Camera - Silver
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1554941068-a252680d25d9?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Canon EOS 200D DSLR Camera - Silver';

-- 19. Apple MacBook Pro 16-inch M3 Max
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Apple MacBook Pro 16-inch M3 Max';

-- 20. Samsung Galaxy Watch Ultra
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1530641042574-60b3780362f6?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1617625802912-c6f10f2de37e?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Samsung Galaxy Watch Ultra';

-- 21. Sony WH-1000XM5 Headphones
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE title = 'Sony WH-1000XM5 Headphones';

-- Fallback for any product that has less than 4 image URLs
UPDATE public.products 
SET image_urls = ARRAY[
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80&fm=webp',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80&fm=webp'
]
WHERE array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) < 4;

-- Align the main image field with the first array element if it is empty or custom
UPDATE public.products 
SET image_url = image_urls[1] 
WHERE image_url IS NULL OR image_url = '';

-- ==============================================================
-- 4. REGISTER DEFAULT ADMIN USER (SUPABASE AUTH & APP PROFILE)
-- ==============================================================

-- Enable pgcrypto extension for password encryption hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert the default admin credentials directly into Supabase native Auth table (auth.users)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
SELECT
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333'::UUID,
    'authenticated',
    'authenticated',
    'forlaptop71r172@gmail.com',
    crypt('@Waqar111111', gen_salt('bf', 10)),
    NOW(),
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Waqar Admin"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'forlaptop71r172@gmail.com'
);

-- Ensure a profile record matches the admin account and has is_admin = true
INSERT INTO public.profiles (id, email, full_name, is_admin, created_at, updated_at)
SELECT 
    id,
    email,
    'Waqar Admin',
    TRUE,
    created_at,
    updated_at
FROM auth.users
WHERE email = 'forlaptop71r172@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET is_admin = TRUE, full_name = 'Waqar Admin';

-- Make sure the trigger handles making them an admin automatically on future signs ups just in case
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, is_admin)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
        new.raw_user_meta_data->>'avatar_url',
        CASE 
            WHEN new.email = 'forlaptop71r172@gmail.com' THEN TRUE
            ELSE COALESCE((new.raw_user_meta_data->>'is_admin')::BOOLEAN, FALSE)
        END
    )
    ON CONFLICT (id) DO UPDATE
    SET is_admin = CASE WHEN EXCLUDED.email = 'forlaptop71r172@gmail.com' THEN TRUE ELSE public.profiles.is_admin END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
