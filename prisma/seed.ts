import { PrismaClient, PriceType, CustomerType, DocumentType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up database catalog...');

  // Delete in order to avoid FK violations
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.price.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productDocument.deleteMany();
  await prisma.supplierProduct.deleteMany();
  await prisma.product.deleteMany();
  await prisma.model.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();

  console.log('✅ Catalog cleaned.');

  console.log('🌱 Seeding Disjoncteur différentiel Resi9...');

  // 1. Create Category
  const category = await prisma.category.create({
    data: {
      name: 'Protection Electrique',
      slug: 'protection-electrique',
      description: 'Disjoncteurs, interrupteurs différentiels et accessoires de protection.',
    },
  });

  // 2. Create Brand
  const brand = await prisma.brand.create({
    data: {
      name: 'Schneider Electric',
      slug: 'schneider-electric',
    },
  });

  // 3. Create Product
  const product = await prisma.product.create({
    data: {
      name: 'Resi9 - disjoncteur différentiel - 1P+N - 16A - 30mA - courbe C - type Fsi',
      slug: 'resi9-disjoncteur-differentiel-16a-30ma-fsi',
      sku: 'R9PDCF16',
      description: 'Disjoncteur différentiel avec protection contre les surintensités (RCBO). Gamme Resi9, Type DD, 1P+N, 16A, CA, Sensibilité 30mA, Type F.',
      categoryId: category.id,
      brandId: brand.id,
      requiresInstallation: true,
      metaTitle: 'Disjoncteur différentiel Resi9 16A 30mA Type Fsi - R9PDCF16',
      metaDescription: 'Achetez le disjoncteur différentiel Schneider Electric Resi9 16A 30mA Type Fsi au meilleur prix. Protection optimale pour votre installation électrique.',
      technicalSpecs: {
        "Gamme": "Resi9",
        "Nom du produit": "Resi9 DD",
        "Type de produit": "Disjoncteur différentiel avec protection contre les surintensités (RCBO)",
        "Application": "Distribution",
        "Description des pôles": "1P + N",
        "Position neutre": "Gauche",
        "Courant nominal [In]": "16 A à 30 °C",
        "Type de réseau": "CA",
        "Technologie du déclencheur": "Thermique-magnétique",
        "Courbe de déclenchement": "C",
        "Sensibilité du différentiel": "30 mA",
        "Classe de protection différentielle": "Type F",
        "Pouvoir de coupure": "3000 A Icn à 230 V CA 50 Hz",
        "Tension assignée d'emploi [Ue]": "230 V CA 50 Hz",
        "Fréquence": "50 Hz",
        "Dimensions": "82 x 36 x 70.5 mm",
        "Poids Net": "186 g",
        "Couleur": "Blanc (RAL 9003)",
        "Durée de vie mécanique": "20000 cycles",
        "IP": "IP20 / IP40",
      },
      images: {
        create: [
          { imageUrl: "https://api.store.nguembu.cloud/uploads/8cff531079e7fc10ab757256285eea3cb9.jpeg", isPrimary: true },
          { imageUrl: "https://api.store.nguembu.cloud/uploads/8cff531079e7fc10ab757256285eea3cb9.jpg", isPrimary: false },
          { imageUrl: "https://api.store.nguembu.cloud/uploads/10c10cb2da610b0d9fc10464768d3c8679f.jpg", isPrimary: false },
          { imageUrl: "https://api.store.nguembu.cloud/uploads/1716d6374289100fb81ed2138ab5a1501.jpg", isPrimary: false },
          { imageUrl: "https://api.store.nguembu.cloud/uploads/2407251032d0a5c3cbff672c6b710458c7.jpeg", isPrimary: false },
          { imageUrl: "https://api.store.nguembu.cloud/uploads/2407251032d0a5c3cbff672c6b714558c7.jpg", isPrimary: false },
          { imageUrl: "https://api.store.nguembu.cloud/uploads/2407251032d0d5c3cbff672c6b710458c7.jpg", isPrimary: false },
        ]
      }
    },
  });

  // 4. Create Variant
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: 'R9PDCF16-STD',
      name: 'Standard 16A',
      prices: {
        createMany: {
          data: [
            { priceType: PriceType.BASE, customerType: CustomerType.B2C, amount: 25000, minQuantity: 1 },
            { priceType: PriceType.BASE, customerType: CustomerType.B2C, amount: 22000, minQuantity: 10 },
            { priceType: PriceType.WHOLESALE, customerType: CustomerType.B2B, amount: 20000, minQuantity: 1 },
          ]
        }
      },
      stock: {
        create: { quantity: 100, alertThreshold: 10 }
      }
    },
  });

  console.log(`✅ Product "${product.name}" seeded successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
