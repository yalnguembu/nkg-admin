-- Manual Seed Script for Admin Catalogue Prototype
-- Usage: Execute this script in your PostgreSQL database tool (pgAdmin, DBeaver, or psql)
-- NOTE: Please ensure you have applied the Prisma schema first (npx prisma db push)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    -- IDs to be captured and reused
    v_admin_id UUID;
    v_manager_id UUID;
    v_supplier1_id UUID;
    v_supplier2_id UUID;
    v_cat_elec_id UUID;
    v_cat_phones_id UUID;
    v_cat_home_id UUID;
    v_brand_samsung_id UUID;
    v_brand_lg_id UUID;
    v_model_s21_id UUID;
    v_service_install_id UUID;
    v_prod_s21_id UUID;
    v_prod_tv_id UUID;
    v_prod_solar_id UUID;
    v_var_s21_id UUID;
    v_var_tv_id UUID;
    v_cust_b2c_id UUID;
    v_cust_b2b_id UUID;
    v_order_pending_id UUID;
    v_order_completed_id UUID;
    v_ts BIGINT := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
BEGIN
    RAISE NOTICE '🌱 Starting manual seed...';

    -- ============================================
    -- 1. CONFIGURATION & AUTH
    -- ============================================
    
    -- System Config
    INSERT INTO "system_config" (id, key, value, description, "updatedAt")
    VALUES 
    (gen_random_uuid(), 'site_name', 'Elektrik Store', 'Global site name', NOW()),
    (gen_random_uuid(), 'currency', 'XAF', 'Default currency', NOW()),
    (gen_random_uuid(), 'whatsapp_enabled', 'true', 'Enable WhatsApp integration', NOW()),
    (gen_random_uuid(), 'whatsapp_business_phone', '+237699999999', 'Business Phone Number', NOW()),
    (gen_random_uuid(), 'whatsapp_template_order_creation', '🛒 *Nouvelle Commande - #{{orderNumber}}*\n\nBonjour {{customerName}}...', 'Template for new orders', NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

    -- Admin Users
    -- Password hash for 'admin123' (SHA256 of 'admin123')
    -- distinct from seed.ts which used Node crypto. calculating here: 
    -- echo -n "admin123" | sha256sum -> 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
    
    INSERT INTO "AdminUser" (id, email, password, "firstName", "lastName", role, "isActive", "updatedAt")
    VALUES (gen_random_uuid(), 'admin@elektrik.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Super', 'Admin', 'SUPER_ADMIN', true, NOW())
    ON CONFLICT (email) DO UPDATE SET "isActive" = true
    RETURNING id INTO v_admin_id;

    INSERT INTO "AdminUser" (id, email, password, "firstName", "lastName", role, "isActive", "updatedAt")
    VALUES (gen_random_uuid(), 'manager@elektrik.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'John', 'Manager', 'MANAGER', true, NOW())
    ON CONFLICT (email) DO UPDATE SET "isActive" = true
    RETURNING id INTO v_manager_id;

    -- Site Configuration
    INSERT INTO "site_configurations" (id, key, value, category, "updatedBy", "updatedAt")
    VALUES (gen_random_uuid(), 'site_branding', '{"name": "Elektrik Store", "logoUrl": "/logo.png", "theme": "dark"}', 'general', v_admin_id, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

    -- Activity Logs
    INSERT INTO "activity_logs" (id, "userId", action, "entityType", details, "ipAddress")
    VALUES (gen_random_uuid(), v_admin_id, 'SEED_EXECUTION', 'SYSTEM', '{"timestamp": "NOW()"}', '127.0.0.1');

    -- ============================================
    -- 2. SUPPLY CHAIN
    -- ============================================
    
    INSERT INTO "suppliers" (id, name, "contactName", email, phone, "deliveryDelayDays", "updatedAt")
    VALUES (gen_random_uuid(), 'Global Tech Suppliers', 'Alice Vendor', 'sales@globaltech.com', '+1234567890', 14, NOW())
    RETURNING id INTO v_supplier1_id;

    INSERT INTO "suppliers" (id, name, "contactName", email, phone, "deliveryDelayDays", "updatedAt")
    VALUES (gen_random_uuid(), 'Local Electro Wholesalers', 'Bob Builder', 'orders@localelectro.cm', '+237600000000', 2, NOW())
    RETURNING id INTO v_supplier2_id;

    -- ============================================
    -- 3. CATALOGUE FOUNDATION
    -- ============================================

    -- Categories
    INSERT INTO "categories" (id, name, slug, "orderIndex", "updatedAt")
    VALUES (gen_random_uuid(), 'Electronics', 'electronics', 1, NOW())
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_cat_elec_id;

    INSERT INTO "categories" (id, name, slug, "parentId", "orderIndex", "updatedAt")
    VALUES (gen_random_uuid(), 'Smartphones', 'smartphones', v_cat_elec_id, 1, NOW())
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_cat_phones_id;

    INSERT INTO "categories" (id, name, slug, "orderIndex", "updatedAt")
    VALUES (gen_random_uuid(), 'Home Appliances', 'home-appliances', 2, NOW())
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_cat_home_id;

    -- Brands
    INSERT INTO "brands" (id, name, slug, "updatedAt") VALUES (gen_random_uuid(), 'Samsung', 'samsung', NOW()) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_samsung_id;
    INSERT INTO "brands" (id, name, slug, "updatedAt") VALUES (gen_random_uuid(), 'LG', 'lg', NOW()) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_brand_lg_id;
    INSERT INTO "brands" (id, name, slug, "updatedAt") VALUES (gen_random_uuid(), 'Apple', 'apple', NOW()) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

    -- Models
    INSERT INTO "models" (id, "brandId", name, slug, reference, year, "updatedAt")
    VALUES (gen_random_uuid(), v_brand_samsung_id, 'Galaxy S21', 'galaxy-s21', 'SM-G991', 2021, NOW())
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_model_s21_id;

    -- Services
    INSERT INTO "services" (id, name, slug, description, "updatedAt")
    VALUES (gen_random_uuid(), 'TV Wall Mounting', 'tv-wall-mounting', 'Professional wall mounting', NOW())
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_service_install_id;

    -- Installation Pricing
    INSERT INTO "installation_pricing" (id, "serviceType", "hourlyRate", "travelCostPerKm", "pricingRules", "updatedAt")
    VALUES (gen_random_uuid(), 'SECURITY', 15000, 500, '{"minHours": 2, "taxRate": 0.1925}', NOW());

    -- ============================================
    -- 4. PRODUCTS & VARIANTS
    -- ============================================

    -- Product 1: Samsung S21
    INSERT INTO "products" (id, name, slug, sku, "categoryId", "brandId", "modelId", description, "dropshipSupplierId", "updatedAt")
    VALUES (gen_random_uuid(), 'Samsung Galaxy S21 5G', 'samsung-s21-5g-' || v_ts, 'SAM-S21-5G-' || v_ts, v_cat_phones_id, v_brand_samsung_id, v_model_s21_id, 'The epic phone.', v_supplier1_id, NOW())
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_prod_s21_id;

    INSERT INTO "supplier_products" (id, "supplierId", "productId", "supplierSku", "costPrice", "updatedAt")
    VALUES (gen_random_uuid(), v_supplier1_id, v_prod_s21_id, 'SUP-SAM-S21', 350000, NOW());

    INSERT INTO "product_images" (id, "productId", "imageUrl", "isPrimary")
    VALUES 
    (gen_random_uuid(), v_prod_s21_id, 'https://placehold.co/600x400?text=S21+Front', true),
    (gen_random_uuid(), v_prod_s21_id, 'https://placehold.co/600x400?text=S21+Back', false)
    ON CONFLICT DO NOTHING;

    INSERT INTO "product_documents" (id, "productId", name, "documentUrl", "documentType")
    VALUES (gen_random_uuid(), v_prod_s21_id, 'User Manual', 'https://example.com/manual.pdf', 'MANUAL')
    ON CONFLICT DO NOTHING;

    -- Variant 1: S21
    INSERT INTO "product_variants" (id, "productId", sku, name, attributes, "updatedAt")
    VALUES (gen_random_uuid(), v_prod_s21_id, 'SAM-S21-BLK-128-' || v_ts, 'Phantom Black 128GB', '{"color": "Black", "storage": "128GB"}', NOW())
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_var_s21_id;

    INSERT INTO "prices" (id, "variantId", "priceType", "customerType", amount, "minQuantity", "validFrom", "validTo", "updatedAt")
    VALUES 
    (gen_random_uuid(), v_var_s21_id, 'BASE', 'B2C', 450000, 1, NOW(), NULL, NOW()),
    (gen_random_uuid(), v_var_s21_id, 'BASE', 'B2C', 420000, 10, NOW(), NULL, NOW()),
    (gen_random_uuid(), v_var_s21_id, 'WHOLESALE', 'B2B', 400000, 1, NOW(), NULL, NOW()),
    (gen_random_uuid(), v_var_s21_id, 'PROMO', 'B2C', 380000, 1, NOW(), NOW() + INTERVAL '7 days', NOW())
    ON CONFLICT ("variantId", "priceType", "customerType", "validFrom", "minQuantity") DO NOTHING;

    INSERT INTO "stock" (id, "variantId", quantity, "alertThreshold", "updatedAt")
    VALUES (gen_random_uuid(), v_var_s21_id, 50, 10, NOW());

    INSERT INTO "stock_movements" (id, "variantId", "movementType", "referenceType", quantity, reason, "performedBy", "supplierId")
    VALUES (gen_random_uuid(), v_var_s21_id, 'IN', 'PURCHASE', 50, 'Initial Stock Purchase', v_admin_id, v_supplier1_id);


    -- Product 2: LG TV
    INSERT INTO "products" (id, name, slug, sku, "categoryId", "brandId", description, "requiresInstallation", "dropshipSupplierId", "updatedAt")
    VALUES (gen_random_uuid(), 'LG 65" OLED 4K TV', 'lg-oled-65-' || v_ts, 'LG-OLED-65-' || v_ts, v_cat_home_id, v_brand_lg_id, 'Experience self-lit pixels.', true, v_supplier2_id, NOW())
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_prod_tv_id;

    INSERT INTO "supplier_products" (id, "supplierId", "productId", "supplierSku", "costPrice", "updatedAt")
    VALUES (gen_random_uuid(), v_supplier2_id, v_prod_tv_id, 'SUP-LG-OLED-65', 900000, NOW());

    INSERT INTO "product_variants" (id, "productId", sku, name, "updatedAt")
    VALUES (gen_random_uuid(), v_prod_tv_id, 'LG-OLED-65-STD-' || v_ts, 'Standard', NOW())
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_var_tv_id;

    INSERT INTO "prices" (id, "variantId", "priceType", "customerType", amount, "minQuantity", "validFrom", "updatedAt")
    VALUES (gen_random_uuid(), v_var_tv_id, 'BASE', 'B2C', 1200000, 1, NOW(), NOW())
    ON CONFLICT ("variantId", "priceType", "customerType", "validFrom", "minQuantity") DO NOTHING;

    INSERT INTO "stock" (id, "variantId", quantity, "alertThreshold", "updatedAt")
    VALUES (gen_random_uuid(), v_var_tv_id, 5, 1, NOW());

    -- Product 3: Solar Panel (New)
    INSERT INTO "products" (id, name, slug, sku, "categoryId", description, "requiresInstallation", "isDropshipping", "updatedAt")
    VALUES (gen_random_uuid(), 'Solar Panel 400W Monocrystalline', 'solar-panel-400w-' || v_ts, 'SOL-400W-' || v_ts, v_cat_elec_id, 'High efficiency solar panel.', true, false, NOW())
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_prod_solar_id;

    INSERT INTO "supplier_products" (id, "supplierId", "productId", "supplierSku", "costPrice", "updatedAt")
    VALUES (gen_random_uuid(), v_supplier1_id, v_prod_solar_id, 'SUP-SOL-400W', 100000, NOW());

    INSERT INTO "product_variants" (id, "productId", sku, name, "updatedAt")
    VALUES (gen_random_uuid(), v_prod_solar_id, 'SOL-400W-V1-' || v_ts, '400W Standard', NOW())
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_var_tv_id;

    INSERT INTO "prices" (id, "variantId", "priceType", "customerType", amount, "minQuantity", "validFrom", "updatedAt")
    VALUES 
    (gen_random_uuid(), v_var_tv_id, 'BASE', 'B2C', 150000, 1, NOW(), NOW()),
    (gen_random_uuid(), v_var_tv_id, 'BASE', 'B2C', 130000, 5, NOW(), NOW())
    ON CONFLICT ("variantId", "priceType", "customerType", "validFrom", "minQuantity") DO NOTHING;

    INSERT INTO "stock" (id, "variantId", quantity, "alertThreshold", "updatedAt")
    VALUES (gen_random_uuid(), v_var_tv_id, 20, 5, NOW());

    -- ============================================
    -- 5. CUSTOMERS
    -- ============================================

    INSERT INTO "customers" (id, email, "firstName", "lastName", phone, "customerType", "updatedAt")
    VALUES (gen_random_uuid(), 'john.doe@gmail.com', 'John', 'Doe', '+237612345678', 'B2C', NOW())
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_cust_b2c_id;

    -- Fallback if already existed
    IF v_cust_b2c_id IS NULL THEN
        SELECT id INTO v_cust_b2c_id FROM "customers" WHERE email = 'john.doe@gmail.com';
    END IF;

    INSERT INTO "addresses" (id, "customerId", "addressType", "fullName", "addressLine1", city, country, "isDefault", "updatedAt")
    VALUES (gen_random_uuid(), v_cust_b2c_id, 'SHIPPING', 'John Doe', '123 Main St, Akwa', 'Douala', 'CM', true, NOW());

    INSERT INTO "customers" (id, email, "firstName", "lastName", "companyName", "taxId", phone, "customerType", "updatedAt")
    VALUES (gen_random_uuid(), 'procurement@bigcorp.cm', 'Jane', 'Smith', 'Big Corp SARL', 'M052100000000', '+237699999999', 'B2B', NOW())
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_cust_b2b_id;

    IF v_cust_b2b_id IS NULL THEN
        SELECT id INTO v_cust_b2b_id FROM "customers" WHERE email = 'procurement@bigcorp.cm';
    END IF;

    INSERT INTO "addresses" (id, "customerId", "addressType", "fullName", "addressLine1", city, country, "isDefault", "updatedAt")
    VALUES (gen_random_uuid(), v_cust_b2b_id, 'BILLING', 'Big Corp HQ', 'Business District', 'Yaounde', 'CM', true, NOW());

    -- ============================================
    -- 6. SALES
    -- ============================================

    -- Cart
    INSERT INTO "carts" (id, "customerId", "expiresAt", "updatedAt")
    VALUES (gen_random_uuid(), v_cust_b2c_id, NOW() + INTERVAL '7 days', NOW());
    -- (Skipping items for brevity or complexity of linking cart id, but totally possible)

    -- Order Completed
    INSERT INTO "orders" (id, "orderNumber", "customerId", status, "orderType", "totalAmount", subtotal, "installationCost", "updatedAt", "confirmedAt", "completedAt")
    VALUES (gen_random_uuid(), 'ORD-' || v_ts || '-001', v_cust_b2c_id, 'COMPLETED', 'SALE_AND_INSTALLATION', 1215000, 1200000, 15000, NOW(), NOW(), NOW())
    RETURNING id INTO v_order_completed_id;

    INSERT INTO "order_items" (id, "orderId", "variantId", "productName", sku, "unitPrice", quantity, "totalPrice", "serviceId")
    VALUES (gen_random_uuid(), v_order_completed_id, v_var_tv_id, 'LG 65" OLED 4K TV', 'LG-OLED-sku', 1200000, 1, 1200000, v_service_install_id);

    INSERT INTO "payments" (id, "orderId", amount, method, status, "transactionId", "paidAt", "updatedAt")
    VALUES (gen_random_uuid(), v_order_completed_id, 1215000, 'MOBILE_MONEY', 'PAID', 'TXN-123456', NOW(), NOW());

    -- Order Pending
    INSERT INTO "orders" (id, "orderNumber", "customerId", status, "orderType", "totalAmount", subtotal, "updatedAt")
    VALUES (gen_random_uuid(), 'ORD-' || v_ts || '-002', v_cust_b2b_id, 'PENDING', 'SALE_ONLY', 800000, 800000, NOW())
    RETURNING id INTO v_order_pending_id;

    INSERT INTO "order_items" (id, "orderId", "variantId", "productName", sku, "unitPrice", quantity, "totalPrice")
    VALUES (gen_random_uuid(), v_order_pending_id, v_var_s21_id, 'Samsung Galaxy S21 5G', 'SAM-sku', 400000, 2, 800000);

    -- Quote
    INSERT INTO "quotes" (id, "quoteNumber", "orderId", "validUntil", status, "calculatedInstallationCost", "updatedAt")
    VALUES (gen_random_uuid(), 'QT-' || v_ts || '-001', v_order_pending_id, NOW() + INTERVAL '30 days', 'PENDING', 0, NOW());

    RAISE NOTICE '✅ SQL Seed completed successfully!';
END $$;
