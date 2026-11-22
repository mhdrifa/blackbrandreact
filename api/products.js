
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
    console.error('Supabase environment variables are missing');
    return res.status(500).json({
      ok: false,
      error: 'Server configuration error'
    });
  }

  try {
    const url = new URL(
      `${supabaseUrl.replace(/\/$/, '')}/rest/v1/products`
    );

    url.searchParams.set(
      'select',
      'product_id,product_name,category,description,regular_price,sale_price,main_image_url,product_status'
    );
    url.searchParams.set('product_status', 'ilike.published');
    url.searchParams.set('order', 'product_name.asc');
    url.searchParams.set('limit', '100');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: secretKey,
        'Content-Profile': 'black_brand',
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error(
        'Supabase API failed:',
        response.status,
        await response.text()
      );

      return res.status(502).json({
        ok: false,
        error: 'Unable to load products'
      });
    }

    const products = await response.json();

    return res.status(200).json({
      ok: true,
      data: products
    });
  } catch (error) {
    console.error('Products API failed:', error.message);

    return res.status(500).json({
      ok: false,
      error: 'Unable to load products'
    });
  }
}
