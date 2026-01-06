// ============================================
// SHARED/COMMON SCHEMAS
// ============================================

import { z } from 'zod';

// UUID validation
export const uuidSchema = z.string().uuid('ID invalide');

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationDto = z.infer<typeof paginationSchema>;

// ============================================
// MODULE 1: CATALOGUE - DTOs
// ============================================

// ---------- CATEGORY ----------
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide (ex: materiel-electrique)'),
  parentId: uuidSchema.nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  imageUrl: z.string().url('URL invalide').nullable().optional(),
  orderIndex: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const queryCategoriesSchema = paginationSchema.extend({
  search: z.string().optional(),
  parentId: uuidSchema.nullable().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type QueryCategoriesDto = z.infer<typeof queryCategoriesSchema>;

// ---------- BRAND ----------
export const createBrandSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide'),
  logoUrl: z.string().url('URL invalide').nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = createBrandSchema.partial();

export const queryBrandsSchema = paginationSchema.extend({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateBrandDto = z.infer<typeof createBrandSchema>;
export type UpdateBrandDto = z.infer<typeof updateBrandSchema>;
export type QueryBrandsDto = z.infer<typeof queryBrandsSchema>;

// ---------- PRODUCT ----------
export const createProductSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide'),
  sku: z
    .string()
    .min(1, 'Le SKU est requis')
    .max(100)
    .regex(/^[A-Z0-9-_]+$/, 'SKU invalide (ex: ELEC-001)'),
  description: z.string().max(10000).nullable().optional(),
  technicalSpecs: z.record(z.string(), z.any()).nullable().optional(),
  categoryId: uuidSchema,
  brandId: uuidSchema.nullable().optional(),
  isActive: z.boolean().default(true),
  requiresInstallation: z.boolean().default(false),
  isDropshipping: z.boolean().default(false),
  dropshipSupplierId: uuidSchema.nullable().optional(),
  metaTitle: z.string().max(255).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const queryProductsSchema = paginationSchema.extend({
  search: z.string().optional(),
  categoryId: uuidSchema.optional(),
  brandId: uuidSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  requiresInstallation: z.coerce.boolean().optional(),
  isDropshipping: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type QueryProductsDto = z.infer<typeof queryProductsSchema>;

// ---------- PRODUCT VARIANT ----------
export const createProductVariantSchema = z.object({
  productId: uuidSchema,
  sku: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[A-Z0-9-_]+$/, 'SKU invalide'),
  name: z.string().max(255).nullable().optional(),
  attributes: z.record(z.string(), z.any()).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateProductVariantSchema = createProductVariantSchema.partial().omit({ productId: true });

export type CreateProductVariantDto = z.infer<typeof createProductVariantSchema>;
export type UpdateProductVariantDto = z.infer<typeof updateProductVariantSchema>;

// ---------- PRODUCT IMAGE ----------
export const createProductImageSchema = z.object({
  productId: uuidSchema,
  imageUrl: z.string().url('URL invalide'),
  altText: z.string().max(255).nullable().optional(),
  orderIndex: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
});

export const updateProductImageSchema = createProductImageSchema.partial().omit({ productId: true });

export type CreateProductImageDto = z.infer<typeof createProductImageSchema>;
export type UpdateProductImageDto = z.infer<typeof updateProductImageSchema>;

// ---------- PRODUCT DOCUMENT ----------
export const createProductDocumentSchema = z.object({
  productId: uuidSchema,
  documentUrl: z.string().url('URL invalide'),
  documentType: z.enum(['TECHNICAL_SHEET', 'MANUAL', 'CERTIFICATE']),
  name: z.string().min(1).max(255),
});

export type CreateProductDocumentDto = z.infer<typeof createProductDocumentSchema>;

// ---------- PRICE ----------
export const createPriceSchema = z.object({
  variantId: uuidSchema,
  customerType: z.enum(['B2C', 'B2B']),
  amount: z.number().positive('Le prix doit être positif').multipleOf(0.01),
  currency: z.string().length(3).default('XAF'),
  validFrom: z.coerce.date().default(() => new Date()),
  validTo: z.coerce.date().nullable().optional(),
  isPromo: z.boolean().default(false),
  minQuantity: z.number().int().positive().default(1),
});

export const updatePriceSchema = createPriceSchema.partial().omit({ variantId: true });

export const queryPricesSchema = z.object({
  variantId: uuidSchema.optional(),
  customerType: z.enum(['B2C', 'B2B']).optional(),
  isPromo: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(), // Prix actuellement valides
});

export type CreatePriceDto = z.infer<typeof createPriceSchema>;
export type UpdatePriceDto = z.infer<typeof updatePriceSchema>;
export type QueryPricesDto = z.infer<typeof queryPricesSchema>;

// ---------- SUPPLIER ----------
export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255),
  contactName: z.string().max(255).nullable().optional(),
  email: z.string().email('Email invalide').nullable().optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-()]+$/, 'Numéro de téléphone invalide')
    .nullable()
    .optional(),
  address: z.string().max(500).nullable().optional(),
  deliveryDelayDays: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const querySuppliersSchema = paginationSchema.extend({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierDto = z.infer<typeof updateSupplierSchema>;
export type QuerySuppliersDto = z.infer<typeof querySuppliersSchema>;

// ============================================
// MODULE 2: STOCK - DTOs
// ============================================

// ---------- STOCK ----------
export const createStockSchema = z.object({
  variantId: uuidSchema,
  quantity: z.number().int().nonnegative('La quantité doit être positive ou nulle'),
  alertThreshold: z.number().int().positive().default(5),
});

export const updateStockSchema = z.object({
  quantity: z.number().int().nonnegative().optional(),
  reservedQuantity: z.number().int().nonnegative().optional(),
  alertThreshold: z.number().int().positive().optional(),
});

export const adjustStockSchema = z.object({
  variantId: uuidSchema,
  quantity: z.number().int(), // Peut être négatif pour ajustement
  reason: z.string().min(1, 'La raison est requise').max(500),
});

export type CreateStockDto = z.infer<typeof createStockSchema>;
export type UpdateStockDto = z.infer<typeof updateStockSchema>;
export type AdjustStockDto = z.infer<typeof adjustStockSchema>;

// ---------- STOCK MOVEMENT ----------
export const createStockMovementSchema = z.object({
  variantId: uuidSchema,
  movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RESERVATION', 'RELEASE']),
  quantity: z.number().int(),
  reason: z.string().max(500).nullable().optional(),
  referenceType: z.enum(['ORDER', 'PURCHASE', 'INVENTORY', 'RETURN']).nullable().optional(),
  referenceId: uuidSchema.nullable().optional(),
  performedBy: uuidSchema,
});

export const queryStockMovementsSchema = paginationSchema.extend({
  variantId: uuidSchema.optional(),
  movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RESERVATION', 'RELEASE']).optional(),
  referenceType: z.enum(['ORDER', 'PURCHASE', 'INVENTORY', 'RETURN']).optional(),
  referenceId: uuidSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateStockMovementDto = z.infer<typeof createStockMovementSchema>;
export type QueryStockMovementsDto = z.infer<typeof queryStockMovementsSchema>;

// ---------- STOCK ALERTS ----------
export const queryStockAlertsSchema = z.object({
  threshold: z.coerce.number().int().positive().optional(),
  categoryId: uuidSchema.optional(),
});

export type QueryStockAlertsDto = z.infer<typeof queryStockAlertsSchema>;

// ============================================
// MODULE 3: CLIENTS - DTOs
// ============================================

// ---------- CUSTOMER ----------
export const createCustomerSchema = z.object({
  id: uuidSchema, // Supabase auth.users.id
  customerType: z.enum(['B2C', 'B2B']).default('B2C'),
  companyName: z.string().max(255).nullable().optional(),
  taxId: z.string().max(100).nullable().optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-()]+$/, 'Numéro de téléphone invalide')
    .nullable()
    .optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().omit({ id: true });

export const queryCustomersSchema = paginationSchema.extend({
  search: z.string().optional(),
  customerType: z.enum(['B2C', 'B2B']).optional(),
  phone: z.string().optional(),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type QueryCustomersDto = z.infer<typeof queryCustomersSchema>;

// ---------- ADDRESS ----------
export const createAddressSchema = z.object({
  customerId: uuidSchema,
  addressType: z.enum(['BILLING', 'SHIPPING']),
  fullName: z.string().min(1, 'Le nom complet est requis').max(255),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-()]+$/, 'Numéro de téléphone invalide')
    .nullable()
    .optional(),
  addressLine1: z.string().min(1, 'L\'adresse est requise').max(255),
  addressLine2: z.string().max(255).nullable().optional(),
  city: z.string().min(1, 'La ville est requise').max(100),
  region: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  country: z.string().length(2).default('CM'),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial().omit({ customerId: true });

export const queryAddressesSchema = z.object({
  customerId: uuidSchema.optional(),
  addressType: z.enum(['BILLING', 'SHIPPING']).optional(),
  isDefault: z.coerce.boolean().optional(),
});

export type CreateAddressDto = z.infer<typeof createAddressSchema>;
export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;
export type QueryAddressesDto = z.infer<typeof queryAddressesSchema>;

// ============================================
// MODULE 4: COMMANDES & DEVIS - DTOs
// ============================================

// ---------- ORDER ----------
export const createOrderItemSchema = z.object({
  variantId: uuidSchema,
  quantity: z.number().int().positive('La quantité doit être positive'),
});

export const createOrderSchema = z.object({
  customerId: uuidSchema,
  orderType: z.enum(['SALE_ONLY', 'INSTALLATION_ONLY', 'SALE_AND_INSTALLATION']),
  items: z.array(createOrderItemSchema).min(1, 'Au moins un produit est requis'),
  billingAddressId: uuidSchema.nullable().optional(),
  shippingAddressId: uuidSchema.nullable().optional(),
  customerNotes: z.string().max(1000).nullable().optional(),
  installationConfig: z.record(z.string(), z.any()).nullable().optional(), // Pour le configurateur
});

export const updateOrderSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  billingAddressId: uuidSchema.nullable().optional(),
  shippingAddressId: uuidSchema.nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  customerNotes: z.string().max(1000).nullable().optional(),
});

export const queryOrdersSchema = paginationSchema.extend({
  customerId: uuidSchema.optional(),
  status: z.enum(['DRAFT', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  orderType: z.enum(['SALE_ONLY', 'INSTALLATION_ONLY', 'SALE_AND_INSTALLATION']).optional(),
  search: z.string().optional(), // Recherche par orderNumber
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateOrderItemDto = z.infer<typeof createOrderItemSchema>;
export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type UpdateOrderDto = z.infer<typeof updateOrderSchema>;
export type QueryOrdersDto = z.infer<typeof queryOrdersSchema>;

// ---------- QUOTE ----------
export const createQuoteSchema = z.object({
  orderId: uuidSchema,
  installationConfig: z.record(z.string(), z.any()), // Configuration du questionnaire installation
  validityDays: z.number().int().positive().default(30),
});

export const updateQuoteSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  installationConfig: z.record(z.string(), z.any()).optional(),
  calculatedInstallationCost: z.number().positive().multipleOf(0.01).optional(),
  validUntil: z.coerce.date().optional(),
  pdfUrl: z.string().url().nullable().optional(),
});

export const queryQuotesSchema = paginationSchema.extend({
  orderId: uuidSchema.optional(),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  search: z.string().optional(), // Recherche par quoteNumber
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateQuoteDto = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteDto = z.infer<typeof updateQuoteSchema>;
export type QueryQuotesDto = z.infer<typeof queryQuotesSchema>;

// ---------- INSTALLATION PRICING ----------
export const createInstallationPricingSchema = z.object({
  serviceType: z.enum(['ELECTRICAL', 'SECURITY']),
  pricingRules: z.record(z.string(), z.any()), // Configuration flexible (JSON)
  hourlyRate: z.number().positive().multipleOf(0.01),
  travelCostPerKm: z.number().positive().multipleOf(0.01),
  isActive: z.boolean().default(true),
});

export const updateInstallationPricingSchema = createInstallationPricingSchema.partial();

export const queryInstallationPricingSchema = z.object({
  serviceType: z.enum(['ELECTRICAL', 'SECURITY']).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateInstallationPricingDto = z.infer<typeof createInstallationPricingSchema>;
export type UpdateInstallationPricingDto = z.infer<typeof updateInstallationPricingSchema>;
export type QueryInstallationPricingDto = z.infer<typeof queryInstallationPricingSchema>;

// ---------- INSTALLATION CONFIG (Frontend) ----------
export const electricalInstallationConfigSchema = z.object({
  surface: z.number().positive('La surface doit être positive'),
  roomCount: z.number().int().positive('Le nombre de pièces doit être positif'),
  housingType: z.enum(['apartment', 'house', 'commercial']),
  distanceKm: z.number().positive('La distance doit être positive'),
  hasExistingWiring: z.boolean().default(false),
  additionalNotes: z.string().max(500).optional(),
});

export const securityInstallationConfigSchema = z.object({
  cameraCount: z.number().int().positive('Le nombre de caméras doit être positif'),
  installationType: z.enum(['indoor', 'outdoor', 'both']),
  height: z.number().positive('La hauteur doit être positive'),
  hasExistingCabling: z.boolean().default(false),
  distanceKm: z.number().positive('La distance doit être positive'),
  recordingStorage: z.enum(['cloud', 'local', 'both']).optional(),
  additionalNotes: z.string().max(500).optional(),
});

export type ElectricalInstallationConfigDto = z.infer<typeof electricalInstallationConfigSchema>;
export type SecurityInstallationConfigDto = z.infer<typeof securityInstallationConfigSchema>;

// ============================================
// MODULE 5: ADMIN - DTOs
// ============================================

// ---------- ADMIN USER ----------
export const createAdminUserSchema = z.object({
  id: uuidSchema, // Supabase auth.users.id
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER']).default('ADMIN'),
  permissions: z.record(z.string(), z.any()).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateAdminUserSchema = createAdminUserSchema.partial().omit({ id: true });

export const queryAdminUsersSchema = paginationSchema.extend({
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER']).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateAdminUserDto = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserDto = z.infer<typeof updateAdminUserSchema>;
export type QueryAdminUsersDto = z.infer<typeof queryAdminUsersSchema>;

// ---------- SITE CONFIGURATION ----------
export const createSiteConfigurationSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.record(z.string(), z.any()),
  category: z.string().min(1).max(100),
  updatedBy: uuidSchema,
});

export const updateSiteConfigurationSchema = z.object({
  value: z.record(z.string(), z.any()),
  updatedBy: uuidSchema,
});

export const querySiteConfigurationsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
});

export type CreateSiteConfigurationDto = z.infer<typeof createSiteConfigurationSchema>;
export type UpdateSiteConfigurationDto = z.infer<typeof updateSiteConfigurationSchema>;
export type QuerySiteConfigurationsDto = z.infer<typeof querySiteConfigurationsSchema>;

// ---------- ACTIVITY LOG ----------
export const createActivityLogSchema = z.object({
  userId: uuidSchema,
  action: z.string().min(1).max(255),
  entityType: z.string().min(1).max(100),
  entityId: uuidSchema.nullable().optional(),
  details: z.record(z.string(), z.any()).nullable().optional(),
  ipAddress: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Invalid IP address').nullable().optional(),
});

export const queryActivityLogsSchema = paginationSchema.extend({
  userId: uuidSchema.optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateActivityLogDto = z.infer<typeof createActivityLogSchema>;
export type QueryActivityLogsDto = z.infer<typeof queryActivityLogsSchema>;

// ============================================
// BULK OPERATIONS DTOs
// ============================================

export const bulkDeleteSchema = z.object({
  ids: z.array(uuidSchema).min(1, 'Au moins un ID est requis'),
});

export const bulkUpdateStatusSchema = z.object({
  ids: z.array(uuidSchema).min(1, 'Au moins un ID est requis'),
  isActive: z.boolean(),
});

export type BulkDeleteDto = z.infer<typeof bulkDeleteSchema>;
export type BulkUpdateStatusDto = z.infer<typeof bulkUpdateStatusSchema>;

// ============================================
// FILE UPLOAD DTOs
// ============================================

export const uploadImageSchema = z.object({
  file: z.any(),
  entityType: z.enum(['product', 'category', 'brand']),
  entityId: uuidSchema,
});

export const uploadDocumentSchema = z.object({
  file: z.any(),
  documentType: z.enum(['TECHNICAL_SHEET', 'MANUAL', 'CERTIFICATE']),
  productId: uuidSchema,
});

export type UploadImageDto = z.infer<typeof uploadImageSchema>;
export type UploadDocumentDto = z.infer<typeof uploadDocumentSchema>;

// ============================================
// EXPORT UTILITY
// ============================================

// Fonction helper pour valider avec Zod dans NestJS
export function createZodDto<T extends z.ZodType<any, any, any>>(schema: T) {
  return class {
    constructor(data: z.infer<T>) {
      Object.assign(this, schema.parse(data));
    }
  };
}