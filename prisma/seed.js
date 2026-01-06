"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting comprehensive seed...');
    // Helper to get random UUID
    const uuid = () => crypto.randomUUID();
    const timestamp = Date.now();
    // ============================================
    // 1. CONFIGURATION & AUTH
    // ============================================
    console.log('🔹 Seeding Configuration & Auth...');
    // System Config
    const systemConfigs = [
        { key: 'site_name', value: 'Elektrik Store', description: 'Global site name' },
        { key: 'currency', value: 'XAF', description: 'Default currency' },
        { key: 'whatsapp_enabled', value: 'true', description: 'Enable WhatsApp integration' },
        { key: 'whatsapp_business_phone', value: '+237699999999', description: 'Business Phone Number' },
        {
            key: 'whatsapp_template_order_creation',
            value: `🛒 *Nouvelle Commande - #{{orderNumber}}*\n\nBonjour {{customerName}}, ...`,
            description: 'Template for new orders'
        },
    ];
    for (const config of systemConfigs) {
        await prisma.systemConfig.upsert({
            where: { key: config.key },
            update: {},
            create: config,
        });
    }
    // Admin Users
    const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex'); // Simple hash for demo
    const superAdmin = await prisma.adminUser.upsert({
        where: { email: 'admin@elektrik.com' },
        update: {},
        create: {
            id: uuid(),
            email: 'admin@elektrik.com',
            password: passwordHash,
            firstName: 'Super',
            lastName: 'Admin',
            role: client_1.AdminRole.SUPER_ADMIN,
            isActive: true,
        },
    });
    const manager = await prisma.adminUser.upsert({
        where: { email: 'manager@elektrik.com' },
        update: {},
        create: {
            id: uuid(),
            email: 'manager@elektrik.com',
            password: passwordHash,
            firstName: 'John',
            lastName: 'Manager',
            role: client_1.AdminRole.MANAGER,
            isActive: true,
        },
    });
    // Site Configuration
    await prisma.siteConfiguration.upsert({
        where: { key: 'site_branding' },
        update: {},
        create: {
            key: 'site_branding',
            value: { name: 'Elektrik Store', logoUrl: '/logo.png', theme: 'dark' },
            category: 'general',
            updatedBy: superAdmin.id,
        },
    });
    // Activity Logs
    await prisma.activityLog.create({
        data: {
            userId: superAdmin.id,
            action: 'SEED_EXECUTION',
            entityType: 'SYSTEM',
            details: { timestamp: new Date() },
            ipAddress: '127.0.0.1'
        }
    });
    // ============================================
    // 2. SUPPLY CHAIN
    // ============================================
    console.log('🔹 Seeding Supply Chain...');
    const supplier1 = await prisma.supplier.create({
        data: {
            name: 'Global Tech Suppliers',
            contactName: 'Alice Vendor',
            email: 'sales@globaltech.com',
            phone: '+1234567890',
            deliveryDelayDays: 14,
        }
    });
    const supplier2 = await prisma.supplier.create({
        data: {
            name: 'Local Electro Wholesalers',
            contactName: 'Bob Builder',
            email: 'orders@localelectro.cm',
            phone: '+237600000000',
            deliveryDelayDays: 2,
        }
    });
    // ============================================
    // 3. CATALOGUE FOUNDATION (Categories, Brands)
    // ============================================
    console.log('🔹 Seeding Categories & Brands...');
    // Categories
    const electCat = await prisma.category.upsert({
        where: { slug: 'electronics' },
        update: {},
        create: { name: 'Electronics', slug: 'electronics', orderIndex: 1 },
    });
    const phonesCat = await prisma.category.upsert({
        where: { slug: 'smartphones' },
        update: {},
        create: { name: 'Smartphones', slug: 'smartphones', parentId: electCat.id, orderIndex: 1 },
    });
    const homeCat = await prisma.category.upsert({
        where: { slug: 'home-appliances' },
        update: {},
        create: { name: 'Home Appliances', slug: 'home-appliances', orderIndex: 2 },
    });
    // Brands
    const samsung = await prisma.brand.upsert({ where: { slug: 'samsung' }, update: {}, create: { name: 'Samsung', slug: 'samsung' } });
    const apple = await prisma.brand.upsert({ where: { slug: 'apple' }, update: {}, create: { name: 'Apple', slug: 'apple' } });
    const lg = await prisma.brand.upsert({ where: { slug: 'lg' }, update: {}, create: { name: 'LG', slug: 'lg' } });
    // Models
    const modelS21 = await prisma.model.upsert({
        where: { slug: 'galaxy-s21' },
        update: {},
        create: {
            brandId: samsung.id,
            name: 'Galaxy S21',
            slug: 'galaxy-s21',
            reference: 'SM-G991',
            year: 2021
        }
    });
    // Services
    const installService = await prisma.service.upsert({
        where: { slug: 'tv-wall-mounting' },
        update: {},
        create: {
            name: 'TV Wall Mounting',
            slug: 'tv-wall-mounting',
            description: 'Professional wall mounting for TVs up to 85 inches',
        }
    });
    // Installation Pricing
    await prisma.installationPricing.create({
        data: {
            serviceType: client_1.ServiceType.SECURITY,
            hourlyRate: 15000,
            travelCostPerKm: 500,
            pricingRules: { minHours: 2, taxRate: 0.1925 },
        }
    });
    // ============================================
    // 4. PRODUCTS & VARIANTS
    // ============================================
    console.log('🔹 Seeding Products...');
    // Product 1: Samsung S21
    const productPhone = await prisma.product.create({
        data: {
            name: 'Samsung Galaxy S21 5G',
            slug: `samsung-s21-5g-${timestamp}`,
            sku: `SAM-S21-5G-${timestamp}`,
            categoryId: phonesCat.id,
            brandId: samsung.id,
            modelId: modelS21.id,
            description: 'The epic phone for epic moments.',
            images: {
                create: [
                    { imageUrl: 'https://placehold.co/600x400?text=S21+Front', isPrimary: true },
                    { imageUrl: 'https://placehold.co/600x400?text=S21+Back', isPrimary: false },
                ]
            },
            documents: {
                create: {
                    name: 'User Manual',
                    documentUrl: 'https://example.com/manual.pdf',
                    documentType: client_1.DocumentType.MANUAL
                }
            },
            dropshipSupplierId: supplier1.id,
        }
    });
    // Variant 1: S21 128GB Black
    const variantPhoneBlack = await prisma.productVariant.create({
        data: {
            productId: productPhone.id,
            sku: `SAM-S21-BLK-128-${timestamp}`,
            name: 'Phantom Black 128GB',
            attributes: { color: 'Black', storage: '128GB' },
            prices: {
                createMany: {
                    data: [
                        { priceType: client_1.PriceType.BASE, customerType: client_1.CustomerType.B2C, amount: 450000 },
                        { priceType: client_1.PriceType.WHOLESALE, customerType: client_1.CustomerType.B2B, amount: 400000 },
                    ]
                }
            },
            stock: {
                create: { quantity: 50, alertThreshold: 10 }
            }
        }
    });
    // Stock Movement (Initial IN)
    await prisma.stockMovement.create({
        data: {
            variantId: variantPhoneBlack.id,
            movementType: client_1.MovementType.IN,
            referenceType: client_1.ReferenceType.PURCHASE,
            quantity: 50,
            reason: 'Initial Stock Purchase',
            performedBy: superAdmin.id,
            supplierId: supplier1.id
        }
    });
    // Product 2: LG TV
    const productTV = await prisma.product.create({
        data: {
            name: 'LG 65" OLED 4K TV',
            slug: `lg-oled-65-${timestamp}`,
            sku: `LG-OLED-65-${timestamp}`,
            categoryId: homeCat.id,
            brandId: lg.id,
            description: 'Experience self-lit pixels.',
            requiresInstallation: true, // Interesting for services
            dropshipSupplierId: supplier2.id
        }
    });
    const variantTV = await prisma.productVariant.create({
        data: {
            productId: productTV.id,
            sku: `LG-OLED-65-STD-${timestamp}`,
            name: 'Standard',
            prices: {
                createMany: {
                    data: [
                        { priceType: client_1.PriceType.BASE, customerType: client_1.CustomerType.B2C, amount: 1200000 },
                    ]
                }
            },
            stock: {
                create: { quantity: 5, alertThreshold: 1 }
            }
        }
    });
    // ============================================
    // 5. CUSTOMERS
    // ============================================
    console.log('🔹 Seeding Customers...');
    const b2cCustomer = await prisma.customer.upsert({
        where: { email: 'john.doe@gmail.com' },
        update: {},
        create: {
            id: uuid(),
            email: 'john.doe@gmail.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+237612345678',
            customerType: client_1.CustomerType.B2C,
            addresses: {
                create: [
                    {
                        addressType: client_1.AddressType.SHIPPING,
                        fullName: 'John Doe',
                        addressLine1: '123 Main St, Akwa',
                        city: 'Douala',
                        country: 'CM',
                        isDefault: true
                    }
                ]
            }
        }
    });
    const b2bCustomer = await prisma.customer.upsert({
        where: { email: 'procurement@bigcorp.cm' },
        update: {},
        create: {
            id: uuid(),
            email: 'procurement@bigcorp.cm',
            firstName: 'Jane',
            lastName: 'Smith',
            companyName: 'Big Corp SARL',
            taxId: 'M052100000000',
            phone: '+237699999999',
            customerType: client_1.CustomerType.B2B,
            addresses: {
                create: [
                    {
                        addressType: client_1.AddressType.BILLING,
                        fullName: 'Big Corp HQ',
                        addressLine1: 'Business District',
                        city: 'Yaounde',
                        country: 'CM',
                        isDefault: true
                    }
                ]
            }
        }
    });
    // ============================================
    // 6. SALES (Orders, Carts, Quotes)
    // ============================================
    console.log('🔹 Seeding Sales Data...');
    // Cart
    await prisma.cart.create({
        data: {
            customerId: b2cCustomer.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            items: {
                create: {
                    variantId: variantPhoneBlack.id,
                    quantity: 1
                }
            }
        }
    });
    // 6a. Completed Order
    const orderCompleted = await prisma.order.create({
        data: {
            orderNumber: `ORD-${timestamp}-001`,
            customerId: b2cCustomer.id,
            status: client_1.OrderStatus.COMPLETED,
            orderType: client_1.OrderType.SALE_AND_INSTALLATION,
            totalAmount: 1215000,
            subtotal: 1200000,
            installationCost: 15000,
            items: {
                create: [
                    {
                        variantId: variantTV.id,
                        productName: 'LG 65" OLED 4K TV',
                        sku: variantTV.sku,
                        unitPrice: 1200000,
                        quantity: 1,
                        totalPrice: 1200000,
                        serviceId: installService.id,
                    }
                ]
            },
            payments: {
                create: {
                    amount: 1215000,
                    method: client_1.PaymentMethod.MOBILE_MONEY,
                    status: client_1.PaymentStatus.PAID,
                    transactionId: 'TXN-123456',
                    paidAt: new Date(),
                }
            }
        }
    });
    // 6b. Pending Order
    const orderPending = await prisma.order.create({
        data: {
            orderNumber: `ORD-${timestamp}-002`,
            customerId: b2bCustomer.id,
            status: client_1.OrderStatus.PENDING,
            orderType: client_1.OrderType.SALE_ONLY,
            totalAmount: 800000,
            subtotal: 800000,
            items: {
                create: {
                    variantId: variantPhoneBlack.id,
                    productName: 'Samsung Galaxy S21 5G',
                    sku: variantPhoneBlack.sku,
                    unitPrice: 400000, // Wholesale price
                    quantity: 2,
                    totalPrice: 800000,
                }
            }
        }
    });
    // 6c. Quote
    await prisma.quote.create({
        data: {
            quoteNumber: `QT-${timestamp}-001`,
            orderId: orderPending.id,
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: client_1.QuoteStatus.PENDING,
            calculatedInstallationCost: 0,
        }
    });
    console.log('✅ Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
