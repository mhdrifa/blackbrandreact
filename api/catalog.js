
const SCHEMA = 'black_brand';

const TABLES = {
  products: 'products',
  variants: 'product_variants',
  categories: 'categories',
  collections: 'collections',
  banners: 'marketing_banners',
  shipping: 'shipping',
  settings: 'store_settings'
};

const number = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const split = (value, separator) =>
  String(value || '')
    .split(separator)
    .map((x) => x.trim())
    .filter(Boolean);

const isStatus = (value, expected) =>
  String(value || '').trim().toLowerCase() === expected.toLowerCase();

const sortByOrder = (a, b) =>
  number(a.display_order || 999) - number(b.display_order || 999);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    return res.status(500).json({
      ok: false,
      error: 'Server configuration error'
    });
  }

  async function readTable(table) {
    const rows = [];
    const pageSize = 1000;

    for (let offset = 0; ; offset += pageSize) {
      const url = new URL(
        `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}`
      );

      url.searchParams.set('select', '*');
      url.searchParams.set('limit', String(pageSize));
      url.searchParams.set('offset', String(offset));

      const response = await fetch(url, {
        headers: {
          apikey: secretKey,
          'Accept-Profile': SCHEMA,
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        console.error(
          `Supabase ${table} error:`,
          response.status,
          await response.text()
        );
        throw new Error(`Unable to read ${table}`);
      }

      const page = await response.json();
      rows.push(...page);

      if (page.length < pageSize) break;
    }

    return rows;
  }

  try {
    const [
      productRows,
      variantRows,
      categoryRows,
      collectionRows,
      bannerRows,
      shippingRows,
      settingRows
    ] = await Promise.all([
      readTable(TABLES.products),
      readTable(TABLES.variants),
      readTable(TABLES.categories),
      readTable(TABLES.collections),
      readTable(TABLES.banners),
      readTable(TABLES.shipping),
      readTable(TABLES.settings)
    ]);

    const variantsByProduct = new Map();

    for (const v of variantRows) {
      if (!isStatus(v.variant_status, 'Active')) continue;

      const list = variantsByProduct.get(v.product_id) || [];
      list.push(v);
      variantsByProduct.set(v.product_id, list);
    }

    const products = productRows
      .filter((p) => isStatus(p.product_status, 'Published'))
      .map((p) => {
        const regularPrice = number(p.regular_price);
        const rawSalePrice = number(p.sale_price);

        const salePrice =
          rawSalePrice > 0 && rawSalePrice < regularPrice
            ? rawSalePrice
            : 0;

        const variants = (variantsByProduct.get(p.product_id) || [])
          .map((v) => {
            const variantPrice = number(v.variant_price);

            return {
              variantId: v.variant_id,
              size: String(v.size || '').replace(/\.0+$/, ''),
              color: v.color || '',
              price:
                variantPrice > 0
                  ? variantPrice
                  : salePrice || regularPrice,
              availableQuantity: Math.max(
                0,
                number(v.available_quantity)
              ),
              imageUrl: v.variant_image_url || ''
            };
          });

        if (!variants.length) return null;

        const prices = variants.map((v) => v.price);

        return {
          productId: p.product_id,
          name: p.product_name || '',
          sku: p.sku || '',
          category: p.category || '',
          subcategory: p.subcategory || '',
          collection: p.collection || '',
          description: p.description || '',
          regularPrice,
          salePrice,
          discountPercentage: number(p.discount_percentage),
          priceFrom: Math.min(...prices),
          priceTo: Math.max(...prices),
          fabric: p.fabric || '',
          careInstructions: p.care_instructions || '',
          mainImageUrl: p.main_image_url || '',
          additionalImageUrls: split(p.additional_image_urls, '|'),
          featured: isStatus(p.featured_status, 'Yes'),
          inStock: variants.some((v) => v.availableQuantity > 0),
          createdDate: p.created_date || '',
          updatedDate: p.last_updated || '',
          variants
        };
      })
      .filter(Boolean);

    const settings = {};

    for (const setting of settingRows) {
      const name = String(setting.setting_name || '');

      if (name.startsWith('public.')) {
        settings[name.slice(7)] = setting.setting_value || '';
      }
    }

    const enabledSetting = settingRows.find(
      (s) => s.setting_name === 'payments.enabled_methods'
    );

    const enabledMethods = enabledSetting
      ? split(enabledSetting.setting_value, ',')
      : ['Cash on Delivery', 'Bank Transfer', 'Cashfree'];

    settings.payment_methods = enabledMethods.filter(
      (method) =>
        method !== 'Bank Transfer' ||
        String(settings.bank_transfer_instructions || '').trim()
    );

    const catalog = {
      products,

      categories: categoryRows
        .filter((c) => isStatus(c.category_status, 'Active'))
        .sort(sortByOrder)
        .map((c) => ({
          categoryId: c.category_id,
          name: c.category_name || '',
          slug: c.slug || '',
          parentCategoryId: c.parent_category_id || '',
          description: c.description || '',
          imageUrl: c.category_image_url || '',
          displayOrder: number(c.display_order || 999)
        })),

      collections: collectionRows
        .filter((c) => isStatus(c.collection_status, 'Active'))
        .sort(sortByOrder)
        .map((c) => ({
          collectionId: c.collection_id,
          name: c.collection_name || '',
          slug: c.slug || '',
          description: c.description || '',
          bannerImageUrl: c.banner_image_url || '',
          productIds: split(c.product_ids, ','),
          displayOrder: number(c.display_order || 999)
        })),

      banners: bannerRows
        .filter((b) => isStatus(b.banner_status, 'Active'))
        .sort(sortByOrder)
        .map((b) => ({
          bannerId: b.banner_id,
          title: b.banner_title || '',
          subtitle: b.subtitle || '',
          desktopImageUrl: b.desktop_image_url || '',
          mobileImageUrl: b.mobile_image_url || '',
          buttonText: b.button_text || '',
          buttonUrl: b.button_url || ''
        })),

      shipping: shippingRows
        .filter((s) => isStatus(s.shipping_status, 'Active'))
        .map((s) => ({
          district: s.district || '',
          province: s.province || '',
          method: s.delivery_method || '',
          fee: number(s.delivery_fee),
          estimatedTime: s.estimated_delivery_time || '',
          freeShippingThreshold: number(
            s.free_shipping_threshold
          )
        })),

      settings
    };

    return res.status(200).json({
      ok: true,
      data: catalog
    });
  } catch (error) {
    console.error('Catalog API failed:', error.message);

    return res.status(502).json({
      ok: false,
      error: 'Unable to load catalog'
    });
  }
}
