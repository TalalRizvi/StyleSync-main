-- Demo brand: Street Star
INSERT INTO brands (
    id,
    name,
    slug,
    api_key,
    status,
    plan,
    monthly_try_on_limit
) VALUES (
    'brand_streetstar_001',
    'Street Star',
    'street-star',
    'ss_test_' || lower(hex(randomblob(16))),
    'trial',
    'growth',
    2500
);

-- Sample upper garments
INSERT INTO garments (id, brand_id, name, type, category, color, image_url, price, size_chart, active)
VALUES
('gmt_ss_tshirt_001', 'brand_streetstar_001', 'Classic Crew Neck Tee', 'T-shirt', 'upper', 'Black',
 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 29.99,
 '{"S":{"chest":"34-36","length":"28"},"M":{"chest":"38-40","length":"29"},"L":{"chest":"42-44","length":"30"},"XL":{"chest":"46-48","length":"31"}}', 1),
 
('gmt_ss_hoodie_001', 'brand_streetstar_001', 'Oversized Hoodie', 'Hoodie', 'upper', 'Navy Blue',
 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400', 59.99,
 '{"S":{"chest":"40-42","length":"26"},"M":{"chest":"44-46","length":"27"},"L":{"chest":"48-50","length":"28"},"XL":{"chest":"52-54","length":"29"}}', 1);

-- Sample lower garments  
INSERT INTO garments (id, brand_id, name, type, category, color, image_url, price, size_chart, active)
VALUES
('gmt_ss_jeans_001', 'brand_streetstar_001', 'Slim Fit Jeans', 'Jeans', 'lower', 'Dark Indigo',
 'https://images.unsplash.com/photo-1542272604-787c3e3f3b28?w=400', 69.99,
 '{"28":{"waist":"28-29","inseam":"30"},"30":{"waist":"30-31","inseam":"30"},"32":{"waist":"32-33","inseam":"32"},"34":{"waist":"34-35","inseam":"32"}}', 1),
 
('gmt_ss_chinos_001', 'brand_streetstar_001', 'Tapered Chinos', 'Pants', 'lower', 'Khaki',
 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400', 54.99,
 '{"28":{"waist":"28-29","inseam":"30"},"30":{"waist":"30-31","inseam":"32"},"32":{"waist":"32-33","inseam":"32"},"34":{"waist":"34-35","inseam":"32"}}', 1);

-- Show the API key
SELECT 'Demo data created!' as status, name, api_key FROM brands WHERE slug = 'street-star';
