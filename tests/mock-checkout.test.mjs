import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

test('sandbox quote and order creation agree on nested shipping district', async () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };

  const server = await createServer({
    configFile: false,
    plugins: [],
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'error',
    define: { __ALLOW_MOCK__: 'true' }
  });

  try {
    const { mockGet, mockPost, resetMockDb } = await server.ssrLoadModule('/src/services/mockBackend.js');
    resetMockDb();
    const catalog = await mockGet('catalog');
    const product = catalog.products[0];
    const variant = product.variants[0];
    assert.ok(product && variant, 'Seed catalog must contain a purchasable variant');
    const items = [{ productId: product.productId, variantId: variant.variantId, quantity: 1 }];
    const deliveryMethod = 'Standard Islandwide (Sandbox)';
    const quote = await mockPost('quote', { items, district: 'Kandy', deliveryMethod });
    assert.equal(quote.deliveryCalculated, true);

    const payload = {
      idempotencyKey: 'sandbox-regression-order',
      customer: { name: 'Test Customer', email: 'test@example.com', phone: '0771234567' },
      shipping: { address1: '123 Example Street', city: 'Kandy', district: 'Kandy', postalCode: '20000' },
      items,
      deliveryMethod,
      paymentMethod: 'Cash on Delivery',
      expectedTotal: quote.total
    };
    const created = await mockPost('createOrder', payload);
    assert.ok(created.order.orderId, 'Order should be created');
    const repeated = await mockPost('createOrder', payload);
    assert.equal(repeated.order.orderId, created.order.orderId, 'Repeated request must be idempotent');
  } finally {
    await server.close();
    delete globalThis.localStorage;
  }
});
