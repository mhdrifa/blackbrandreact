
import pg from 'pg';

const { Pool } = pg;

let pool;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
      max: 3,
      connectionTimeoutMillis: 5000
    });
  }

  return pool;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });
  }

  try {
    const result = await getPool().query(`
      SELECT
        product_id,
        product_name,
        category,
        description,
        regular_price,
        sale_price,
        main_image_url,
        product_status
      FROM black_brand.products
      WHERE LOWER(product_status) = 'published'
      ORDER BY product_name
      LIMIT 100
    `);

    return res.status(200).json({
      ok: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Products API failed:', error.message);

    return res.status(500).json({
      ok: false,
      error: 'Unable to load products'
    });
  }
}
