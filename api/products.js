
/**
 * BLACK BRAND - Products API
 * Backend: Vercel Serverless Function
 * Database: Supabase PostgreSQL
 * Schema: black_brand
 */

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // Allow GET requests only
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });
  }

  // Server-side environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  // Check configuration
  if (!supabaseUrl || !secretKey) {
    console.error(
      'Products API: Supabase environment variables are missing'
    );

    return res.status(500).json({
      ok: false,
      error: 'Server configuration error'
    });
  }

  try {
    // Supabase REST API URL
    const baseUrl = supabaseUrl.replace(/\/+$/, '');

    const url = new URL(`${baseUrl}/rest/v1/products`);

    // Select only public storefront fields
    url.searchParams.set(
      'select',
      [
        'product_id',
        'product_name',
        'category',
        'description',
        'regular_price',
        'sale_price',
        'main_image_url',
        'product_status'
      ].join(',')
    );

    // Only published products
    url.searchParams.set(
      'product_status',
      'ilike.published'
    );

    // Sort alphabetically
    url.searchParams.set(
      'order',
      'product_name.asc'
    );

    // Limit results
    url.searchParams.set('limit', '100');

    // Fetch products from Supabase
    const response = await fetch(url.toString(), {
      method: 'GET',

      headers: {
        apikey: secretKey,

        // IMPORTANT: Select the correct schema for GET
        'Accept-Profile': 'black_brand',

        Accept: 'application/json'
      },

      signal: AbortSignal.timeout(10000)
    });

    // Handle Supabase errors
    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        'Supabase API failed:',
        response.status,
        errorText
      );

      return res.status(502).json({
        ok: false,
        error: 'Unable to load products'
      });
    }

    // Parse Supabase response
    const products = await response.json();

    // Return products to React
    return res.status(200).json({
      ok: true,
      data: products
    });

  } catch (error) {
    console.error(
      'Products API failed:',
      error.message
    );

    return res.status(500).json({
      ok: false,
      error: 'Unable to load products'
    });
  }
}
