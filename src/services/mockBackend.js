import { DISTRICT_PROVINCE } from '../config/brand';
import { placeholderImg } from '../utils/format';

const DB_KEY = 'bb_mock_db_v2';

const nowStr = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const slugify = (s) =>
  String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

function seedDb() {
  const today = todayStr();
  const imgA =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="600" height="750" fill="#181818"/><text x="300" y="365" fill="#e4c280" font-family="Arial" font-size="24" text-anchor="middle" letter-spacing="6">SANDBOX GARMENT</text><text x="300" y="405" fill="#888" font-family="Arial" font-size="14" text-anchor="middle" letter-spacing="3">TEST PREVIEW ONLY</text></svg>'
    );
  const imgB =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="600" height="750" fill="#2c2a27"/><text x="300" y="365" fill="#f8f7f4" font-family="Arial" font-size="24" text-anchor="middle" letter-spacing="6">ALTERNATE VIEW</text></svg>'
    );

  return {
    categories: [
      {
        'Category ID': 'CAT-TEST01',
        'Category Name': 'Shirts',
        Slug: 'shirts',
        'Parent Category ID': '',
        Description: 'Sandbox test category for layout verification.',
        'Category Image URL': imgA,
        'Display Order': 1,
        'Category Status': 'Active',
        'Last Updated': nowStr()
      },
      {
        'Category ID': 'CAT-TEST02',
        'Category Name': 'Trousers',
        Slug: 'trousers',
        'Parent Category ID': '',
        Description: 'Sandbox tailored trousers category.',
        'Category Image URL': imgB,
        'Display Order': 2,
        'Category Status': 'Active',
        'Last Updated': nowStr()
      }
    ],
    collections: [
      {
        'Collection ID': 'COL-TEST01',
        'Collection Name': 'Sandbox Edit',
        Slug: 'sandbox-edit',
        Description: 'Local UI testing capsule.',
        'Banner Image URL': imgA,
        'Product IDs': 'PRD-TEST01,PRD-TEST02',
        'Display Order': 1,
        'Collection Status': 'Active',
        'Last Updated': nowStr()
      }
    ],
    banners: [
      {
        'Banner ID': 'BAN-TEST01',
        'Banner Title': 'DEFINE YOUR STYLE.',
        Subtitle: "Discover the New Era of Men's Fashion. Crafted in Sri Lanka for the modern gentleman who demands structural purity, effortless poise, and unyielding presence.",
        'Desktop Image URL': imgA,
        'Mobile Image URL': imgA,
        'Button Text': 'BROWSE TEST CATALOG',
        'Button URL': '#/shop',
        'Display Order': 1,
        'Start Date': '',
        'End Date': '',
        'Banner Status': 'Active'
      }
    ],
    products: [
      {
        'Product ID': 'PRD-TEST01',
        'Product Name': '[Sandbox] Architectural Linen Shirt',
        SKU: 'BB-SBX-001',
        Category: 'Shirts',
        Subcategory: 'Resort',
        Collection: 'Sandbox Edit',
        Description: 'Sample garment for local layout and checkout testing.',
        'Regular Price': 8500,
        'Sale Price': 0,
        'Cost Price': 4000,
        'Discount Percentage': 0,
        Fabric: '100% Breathable Linen (Sample)',
        'Care Instructions': 'Cold gentle wash (Sample)',
        'Main Image URL': imgA,
        'Additional Image URLs': imgB,
        'Product Status': 'Published',
        'Featured Status': 'Yes',
        'Created Date': `${today} 09:00:00`,
        'Last Updated': nowStr()
      },
      {
        'Product ID': 'PRD-TEST02',
        'Product Name': '[Sandbox] Tailored Wool-Blend Trouser',
        SKU: 'BB-SBX-002',
        Category: 'Trousers',
        Subcategory: 'Formal',
        Collection: 'Sandbox Edit',
        Description: 'Sample tailored trouser for sale & cart testing.',
        'Regular Price': 12500,
        'Sale Price': 9900,
        'Cost Price': 5500,
        'Discount Percentage': 20.8,
        Fabric: 'Tropical Wool Blend (Sample)',
        'Care Instructions': 'Dry clean (Sample)',
        'Main Image URL': imgB,
        'Additional Image URLs': imgA,
        'Product Status': 'Published',
        'Featured Status': 'Yes',
        'Created Date': `${today} 09:05:00`,
        'Last Updated': nowStr()
      }
    ],
    variants: [
      {
        'Variant ID': 'VAR-TEST01',
        'Product ID': 'PRD-TEST01',
        'Product Name': '[Sandbox] Architectural Linen Shirt',
        SKU: 'BB-SBX-001-M-BLACK',
        Size: 'M',
        Color: 'Black',
        'Variant Price': 0,
        'Stock Quantity': 12,
        'Reserved Quantity': 0,
        'Available Quantity': 12,
        'Low Stock Threshold': 5,
        'Variant Image URL': '',
        'Variant Status': 'Active',
        'Last Updated': nowStr()
      },
      {
        'Variant ID': 'VAR-TEST02',
        'Product ID': 'PRD-TEST01',
        'Product Name': '[Sandbox] Architectural Linen Shirt',
        SKU: 'BB-SBX-001-L-IVORY',
        Size: 'L',
        Color: 'Ivory',
        'Variant Price': 0,
        'Stock Quantity': 3,
        'Reserved Quantity': 0,
        'Available Quantity': 3,
        'Low Stock Threshold': 5,
        'Variant Image URL': '',
        'Variant Status': 'Active',
        'Last Updated': nowStr()
      },
      {
        'Variant ID': 'VAR-TEST03',
        'Product ID': 'PRD-TEST02',
        'Product Name': '[Sandbox] Tailored Wool-Blend Trouser',
        SKU: 'BB-SBX-002-M-CHARCOAL',
        Size: 'M',
        Color: 'Charcoal',
        'Variant Price': 0,
        'Stock Quantity': 8,
        'Reserved Quantity': 0,
        'Available Quantity': 8,
        'Low Stock Threshold': 5,
        'Variant Image URL': '',
        'Variant Status': 'Active',
        'Last Updated': nowStr()
      }
    ],
    shipping: [
      {
        'Shipping Rule ID': 'SHP-TEST01',
        District: 'All',
        Province: 'All',
        'Delivery Method': 'Standard Islandwide (Sandbox)',
        'Delivery Fee': 450,
        'Estimated Delivery Time': '2–3 business days (Test)',
        'Free Shipping Threshold': 15000,
        'Shipping Status': 'Active'
      }
    ],
    coupons: [
      {
        'Coupon ID': 'CPN-TEST01',
        'Coupon Code': 'WELCOME10',
        'Discount Type': 'Percentage',
        'Discount Value': 10,
        'Minimum Order Amount': 0,
        'Maximum Discount Amount': 5000,
        'Usage Limit': 0,
        'Used Count': 0,
        'Start Date': '',
        'Expiry Date': '',
        'Coupon Status': 'Active'
      }
    ],
    settings: [
      { 'Setting ID': 'SET-01', 'Setting Name': 'public.store_name', 'Setting Value': 'BLACK BRAND [SANDBOX]', Description: 'Test store name', 'Last Updated': nowStr() },
      { 'Setting ID': 'SET-02', 'Setting Name': 'public.contact_phone', 'Setting Value': '+94 77 049 8004', Description: 'Public contact phone', 'Last Updated': nowStr() },
      { 'Setting ID': 'SET-03', 'Setting Name': 'public.whatsapp_url', 'Setting Value': 'https://wa.me/message/IFADOYDEKWLEA1', Description: 'WhatsApp URL', 'Last Updated': nowStr() },
      { 'Setting ID': 'SET-04', 'Setting Name': 'public.bank_transfer_instructions', 'Setting Value': 'SANDBOX TEST ACCOUNT ONLY\nDo not transfer real money.', Description: 'Test bank transfer text', 'Last Updated': nowStr() },
      { 'Setting ID': 'SET-05', 'Setting Name': 'public.newsletter_coupon_code', 'Setting Value': 'WELCOME10', Description: 'Welcome voucher', 'Last Updated': nowStr() },
      { 'Setting ID': 'SET-06', 'Setting Name': 'payments.enabled_methods', 'Setting Value': 'Cash on Delivery,Bank Transfer,Cashfree', Description: 'Enabled test methods', 'Last Updated': nowStr() },
      { 'Setting ID': 'SET-07', 'Setting Name': 'tax.rate_percent', 'Setting Value': '0', Description: 'Tax rate', 'Last Updated': nowStr() }
    ],
    customers: [
      {
        'Customer ID': 'CUS-TEST01',
        'Full Name': 'Sandbox Client',
        Email: 'client@sandbox.test',
        'Phone Number': '+94770000000',
        Address: '10 Test Lane',
        City: 'Colombo',
        District: 'Colombo',
        Province: 'Western',
        'Postal Code': '00100',
        'Account Status': 'Active',
        'Registration Date': today,
        'Last Updated': nowStr()
      }
    ],
    orders: [],
    orderItems: [],
    payments: [],
    sales: [],
    stockHistory: [],
    reviews: [
      {
        'Review ID': 'REV-TEST01',
        'Product ID': 'PRD-TEST01',
        'Customer ID': 'CUS-TEST01',
        'Customer Name': 'Sandbox Client',
        Rating: 5,
        'Review Text': 'Sample approved review in sandbox mode.',
        'Verification Status': 'Verified Purchase',
        'Review Status': 'Approved',
        'Created Date': today
      }
    ],
    messages: [],
    newsletter: [],
    activity: [],
    staff: [
      { id: 'STF-TEST01', name: 'Sandbox Owner', email: 'owner@sandbox.test', password: 'SandboxOwner123!', role: 'owner', status: 'Active', totpEnabled: true, createdAt: nowStr() },
      { id: 'STF-TEST02', name: 'Sandbox Setup', email: 'setup@sandbox.test', password: 'SandboxSetup123!', role: 'manager', status: 'Active', totpEnabled: false, createdAt: nowStr() }
    ],
    idem: {}
  };
}

function getDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const fresh = seedDb();
  saveDb(fresh);
  return fresh;
}

function saveDb(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch { /* ignore */ }
}

export function resetMockDb() {
  const fresh = seedDb();
  saveDb(fresh);
  return fresh;
}

function err(code, message, details) {
  const e = new Error(message);
  e.code = code;
  e.details = details;
  return e;
}

function getSetting(db, name, dflt = '') {
  const row = db.settings.find((s) => s['Setting Name'] === name);
  return row && row['Setting Value'] !== '' ? row['Setting Value'] : dflt;
}

function effectivePrice(p, v) {
  const vp = Number(v['Variant Price'] || 0);
  if (vp > 0) return vp;
  const reg = Number(p['Regular Price']);
  const sale = Number(p['Sale Price']);
  return sale > 0 && sale < reg ? sale : reg;
}

function buildPublicCatalog(db) {
  const products = db.products
    .filter((p) => p['Product Status'] === 'Published')
    .map((p) => {
      const vs = db.variants
        .filter((v) => v['Product ID'] === p['Product ID'] && v['Variant Status'] === 'Active')
        .map((v) => ({
          variantId: v['Variant ID'],
          size: v.Size,
          color: v.Color,
          price: effectivePrice(p, v),
          availableQuantity: Math.max(0, Number(v['Available Quantity'] || 0)),
          imageUrl: v['Variant Image URL'] || ''
        }));
      if (!vs.length) return null;
      const prices = vs.map((x) => x.price);
      const reg = Number(p['Regular Price']);
      const sale = Number(p['Sale Price']);
      return {
        productId: p['Product ID'],
        name: p['Product Name'],
        sku: p.SKU,
        category: p.Category,
        subcategory: p.Subcategory,
        collection: p.Collection,
        description: p.Description,
        regularPrice: reg,
        salePrice: sale > 0 && sale < reg ? sale : 0,
        discountPercentage: Number(p['Discount Percentage'] || 0),
        priceFrom: Math.min(...prices),
        priceTo: Math.max(...prices),
        fabric: p.Fabric,
        careInstructions: p['Care Instructions'],
        mainImageUrl: p['Main Image URL'],
        additionalImageUrls: String(p['Additional Image URLs'] || '').split('|').filter(Boolean),
        featured: p['Featured Status'] === 'Yes',
        inStock: vs.some((x) => x.availableQuantity > 0),
        createdDate: p['Created Date'],
        updatedDate: p['Last Updated'],
        variants: vs
      };
    })
    .filter(Boolean);

  const settings = {};
  db.settings.forEach((s) => {
    if (s['Setting Name'].startsWith('public.')) {
      settings[s['Setting Name'].slice(7)] = s['Setting Value'];
    }
  });
  const enabledStr = getSetting(db, 'payments.enabled_methods', 'Cash on Delivery,Bank Transfer,Cashfree');
  let methods = enabledStr.split(',').map((x) => x.trim()).filter(Boolean);
  if (!String(settings.bank_transfer_instructions || '').trim()) {
    methods = methods.filter((m) => m !== 'Bank Transfer');
  }
  settings.payment_methods = methods;

  return {
    products,
    categories: db.categories
      .filter((c) => c['Category Status'] === 'Active')
      .sort((a, b) => Number(a['Display Order'] || 999) - Number(b['Display Order'] || 999))
      .map((c) => ({
        categoryId: c['Category ID'],
        name: c['Category Name'],
        slug: c.Slug,
        parentCategoryId: c['Parent Category ID'],
        description: c.Description,
        imageUrl: c['Category Image URL'],
        displayOrder: Number(c['Display Order'] || 999)
      })),
    collections: db.collections
      .filter((c) => c['Collection Status'] === 'Active')
      .sort((a, b) => Number(a['Display Order'] || 999) - Number(b['Display Order'] || 999))
      .map((c) => ({
        collectionId: c['Collection ID'],
        name: c['Collection Name'],
        slug: c.Slug,
        description: c.Description,
        bannerImageUrl: c['Banner Image URL'],
        productIds: String(c['Product IDs'] || '').split(',').map((s) => s.trim()).filter(Boolean),
        displayOrder: Number(c['Display Order'] || 999)
      })),
    banners: db.banners
      .filter((b) => b['Banner Status'] === 'Active')
      .sort((a, b) => Number(a['Display Order'] || 999) - Number(b['Display Order'] || 999))
      .map((b) => ({
        bannerId: b['Banner ID'],
        title: b['Banner Title'],
        subtitle: b.Subtitle,
        desktopImageUrl: b['Desktop Image URL'],
        mobileImageUrl: b['Mobile Image URL'],
        buttonText: b['Button Text'],
        buttonUrl: b['Button URL']
      })),
    shipping: db.shipping
      .filter((s) => s['Shipping Status'] === 'Active')
      .map((s) => ({
        district: s.District,
        province: s.Province,
        method: s['Delivery Method'],
        fee: Number(s['Delivery Fee']),
        estimatedTime: s['Estimated Delivery Time'],
        freeShippingThreshold: Number(s['Free Shipping Threshold'] || 0)
      })),
    settings
  };
}

function computeMockQuote(db, data) {
  const items = [];
  const issues = [];
  (data.items || []).forEach((it) => {
    const v = db.variants.find((x) => x['Variant ID'] === it.variantId);
    const p = v ? db.products.find((x) => x['Product ID'] === v['Product ID']) : null;
    if (!v || !p || v['Variant Status'] !== 'Active' || p['Product Status'] !== 'Published') {
      issues.push({ variantId: it.variantId, code: 'UNAVAILABLE', message: 'This item is no longer available.' });
      return;
    }
    const avail = Math.max(0, Number(v['Available Quantity'] || 0));
    if (avail < it.quantity) {
      issues.push({ variantId: it.variantId, code: avail ? 'LOW_STOCK' : 'OUT_OF_STOCK', message: avail ? `Only ${avail} left in ${v.Size} / ${v.Color}.` : `Sold out in ${v.Size} / ${v.Color}.` });
      return;
    }
    const unitPrice = effectivePrice(p, v);
    items.push({
      productId: p['Product ID'],
      variantId: v['Variant ID'],
      sku: v.SKU,
      name: p['Product Name'],
      size: v.Size,
      color: v.Color,
      quantity: it.quantity,
      unitPrice,
      gross: r2(unitPrice * it.quantity),
      discount: 0,
      lineTotal: r2(unitPrice * it.quantity)
    });
  });

  const subtotal = r2(items.reduce((s, i) => s + i.gross, 0));
  let discount = 0;
  let couponApplied = null;
  let couponError = '';
  let couponRow = null;
  if (data.couponCode) {
    const code = String(data.couponCode).trim().toUpperCase();
    const c = db.coupons.find((x) => x['Coupon Code'] === code && x['Coupon Status'] === 'Active');
    if (!c) couponError = 'That coupon code is not valid.';
    else if (Number(c['Usage Limit']) > 0 && Number(c['Used Count']) >= Number(c['Usage Limit'])) {
      couponError = 'That coupon has reached its usage limit.';
    } else if (Number(c['Minimum Order Amount']) > 0 && subtotal < Number(c['Minimum Order Amount'])) {
      couponError = `This coupon requires a minimum order of ${c['Minimum Order Amount']} LKR.`;
    } else {
      discount =
        c['Discount Type'] === 'Percentage'
          ? r2((subtotal * Number(c['Discount Value'])) / 100)
          : Math.min(subtotal, Number(c['Discount Value']));
      if (Number(c['Maximum Discount Amount']) > 0) {
        discount = Math.min(discount, Number(c['Maximum Discount Amount']));
      }
      discount = r2(Math.min(discount, subtotal));
      couponApplied = code;
      couponRow = c;
    }
  }
  const after = r2(subtotal - discount);
  if (discount > 0 && subtotal > 0) {
    let given = 0;
    items.forEach((it, idx) => {
      if (idx === items.length - 1) it.discount = r2(discount - given);
      else {
        it.discount = r2((discount * it.gross) / subtotal);
        given += it.discount;
      }
      it.lineTotal = r2(it.gross - it.discount);
    });
  }

  const taxRate = Number(getSetting(db, 'tax.rate_percent', '0')) || 0;
  const tax = r2((after * taxRate) / 100);

  let deliveryOptions = [];
  if (data.district) {
    if (!DISTRICT_PROVINCE[data.district]) throw err('VALIDATION', 'Please select a valid district.');
    const province = DISTRICT_PROVINCE[data.district];
    const byMethod = {};
    db.shipping.forEach((s) => {
      if (s['Shipping Status'] !== 'Active') return;
      const score = s.District === data.district ? 3 : s.Province === province && s.District === 'All' ? 2 : s.District === 'All' && s.Province === 'All' ? 1 : 0;
      if (!score) return;
      if (!byMethod[s['Delivery Method']] || score > byMethod[s['Delivery Method']].score) {
        byMethod[s['Delivery Method']] = { score, rule: s };
      }
    });
    deliveryOptions = Object.values(byMethod).map(({ rule }) => {
      const thr = Number(rule['Free Shipping Threshold'] || 0);
      const free = thr > 0 && after >= thr;
      return {
        method: rule['Delivery Method'],
        fee: free ? 0 : r2(Number(rule['Delivery Fee'])),
        free,
        estimatedTime: rule['Estimated Delivery Time']
      };
    });
  }

  const chosen = data.deliveryMethod
    ? deliveryOptions.find((o) => o.method === data.deliveryMethod)
    : deliveryOptions.length === 1
      ? deliveryOptions[0]
      : null;

  return {
    items,
    issues,
    subtotal,
    discount,
    couponApplied,
    couponRow,
    couponError,
    tax,
    deliveryFee: chosen ? chosen.fee : null,
    deliveryCalculated: !!chosen,
    deliveryOptions,
    total: r2(after + tax + (chosen ? chosen.fee : 0)),
    currency: 'LKR'
  };
}

function mockOrderView(db, o, includeAddr = false) {
  const items = db.orderItems
    .filter((i) => i['Order ID'] === o['Order ID'])
    .map((i) => ({
      productId: i['Product ID'],
      variantId: i['Variant ID'],
      name: i['Product Name'],
      sku: i.SKU,
      size: i.Size,
      color: i.Color,
      quantity: i.Quantity,
      unitPrice: i['Unit Price'],
      discount: i['Discount Amount'],
      lineTotal: i['Line Total']
    }));
  const bankText = getSetting(db, 'public.bank_transfer_instructions', '');
  const view = {
    orderId: o['Order ID'],
    orderDate: o['Order Date'],
    orderStatus: o['Order Status'],
    paymentStatus: o['Payment Status'],
    paymentMethod: o['Payment Method'],
    trackingNumber: o['Tracking Number'],
    subtotal: o.Subtotal,
    paymentInstructions: o['Payment Method'] === 'Bank Transfer' ? bankText : '',
    paymentReference: o['Order ID'],
    discount: o['Discount Amount'],
    deliveryFee: o['Delivery Fee'],
    tax: o['Tax Amount'],
    total: o['Final Total'],
    currency: 'LKR',
    city: o.City,
    district: o.District,
    items
  };
  if (includeAddr) {
    view.customerName = o['Customer Name'];
    view.email = o.Email;
    view.phone = o['Phone Number'];
    view.address = {
      line1: o['Address Line 1'],
      line2: o['Address Line 2'],
      city: o.City,
      district: o.District,
      province: o.Province,
      postalCode: o['Postal Code']
    };
    view.deliveryInstructions = o['Delivery Instructions'];
  }
  return view;
}

function applyMockStock(db, variantId, dTotal, dReserved, type, reason, orderId, who) {
  const v = db.variants.find((x) => x['Variant ID'] === variantId);
  if (!v) return;
  const prevTotal = Number(v['Stock Quantity'] || 0);
  const prevRes = Number(v['Reserved Quantity'] || 0);
  const nt = Math.max(0, prevTotal + dTotal);
  const nr = Math.max(0, prevRes + dReserved);
  v['Stock Quantity'] = nt;
  v['Reserved Quantity'] = nr;
  v['Available Quantity'] = Math.max(0, nt - nr);
  v['Last Updated'] = nowStr();
  db.stockHistory.unshift({
    Timestamp: nowStr(),
    'Movement ID': uid('MOV'),
    'Product ID': v['Product ID'],
    'Variant ID': variantId,
    SKU: v.SKU,
    Size: v.Size,
    Color: v.Color,
    'Movement Type': type,
    'Quantity Changed': dTotal !== 0 ? dTotal : -dReserved,
    'Previous Stock': dTotal !== 0 ? prevTotal : prevTotal - prevRes,
    'Updated Stock': dTotal !== 0 ? nt : v['Available Quantity'],
    Reason: reason,
    'Related Order ID': orderId || '',
    'Updated By': who || 'Sandbox'
  });
}

function recordMockSales(db, order, sign) {
  const items = db.orderItems.filter((i) => i['Order ID'] === order['Order ID']);
  items.forEach((i) => {
    const p = db.products.find((x) => x['Product ID'] === i['Product ID']);
    const gross = r2(Number(i['Unit Price']) * Number(i.Quantity) * sign);
    const disc = r2(Number(i['Discount Amount']) * sign);
    db.sales.unshift({
      Timestamp: nowStr(),
      'Sale ID': uid('SAL'),
      'Order ID': order['Order ID'],
      'Product ID': i['Product ID'],
      'Variant ID': i['Variant ID'],
      'Product Name': i['Product Name'],
      Category: p?.Category || '',
      'Quantity Sold': Number(i.Quantity) * sign,
      'Unit Price': Number(i['Unit Price']),
      'Discount Amount': disc,
      'Gross Revenue': gross,
      'Net Revenue': r2(gross - disc),
      'Payment Status': order['Payment Status'],
      'Sale Date': todayStr()
    });
  });
}

function transitionMockOrder(db, o, to, trackingNumber, who) {
  const committed = ['Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const from = o['Order Status'];
  const items = db.orderItems.filter((i) => i['Order ID'] === o['Order ID']);
  const cFrom = committed.includes(from);
  const cTo = committed.includes(to);
  o['Order Status'] = to;
  if (trackingNumber) o['Tracking Number'] = trackingNumber;
  o['Last Updated'] = nowStr();

  if (!cFrom && cTo) {
    items.forEach((i) => applyMockStock(db, i['Variant ID'], -i.Quantity, -i.Quantity, 'Sale Committed', `Order ${to}`, o['Order ID'], who));
    recordMockSales(db, o, 1);
  } else if (from === 'Pending' && to === 'Cancelled') {
    items.forEach((i) => applyMockStock(db, i['Variant ID'], 0, -i.Quantity, 'Reservation Released', 'Order cancelled', o['Order ID'], who));
    if (o['Payment Status'] === 'Pending') o['Payment Status'] = 'Cancelled';
  } else if (cFrom && (to === 'Cancelled' || to === 'Returned')) {
    items.forEach((i) => applyMockStock(db, i['Variant ID'], i.Quantity, 0, 'Restock', `Order ${to}`, o['Order ID'], who));
    recordMockSales(db, o, -1);
  }
}

function sheetRows(db, sheet) {
  const map = {
    Customers: db.customers,
    Products: db.products,
    'Product Variants': db.variants,
    Orders: db.orders,
    'Order Items': db.orderItems,
    Payments: db.payments,
    Inventory: db.variants.map((v) => {
      const thr = Number(v['Low Stock Threshold'] ?? 5);
      const av = Number(v['Available Quantity'] || 0);
      return {
        'Inventory ID': v['Variant ID'].replace('VAR', 'INV'),
        'Product ID': v['Product ID'],
        'Variant ID': v['Variant ID'],
        'Product Name': v['Product Name'],
        SKU: v.SKU,
        Size: v.Size,
        Color: v.Color,
        'Total Stock': v['Stock Quantity'],
        'Reserved Stock': v['Reserved Quantity'],
        'Available Stock': av,
        'Low Stock Threshold': thr,
        'Stock Status': av <= 0 ? 'Out of Stock' : av <= thr ? 'Low Stock' : 'In Stock',
        'Last Updated': v['Last Updated']
      };
    }),
    'Stock History': db.stockHistory,
    Sales: db.sales,
    Coupons: db.coupons,
    'Customers Messages': db.messages,
    Newsletter: db.newsletter,
    Reviews: db.reviews,
    'Admin Activity': db.activity,
    Categories: db.categories,
    Collections: db.collections,
    Shipping: db.shipping,
    'Store Settings': db.settings,
    'Marketing Banners': db.banners
  };
  return map[sheet] || [];
}

export async function mockGet(action, params = {}) {
  const db = getDb();
  if (action === 'ping') {
    return { service: 'BLACK BRAND SANDBOX API', version: '1.6.1-mock', time: nowStr() };
  }
  if (action === 'catalog') return buildPublicCatalog(db);
  if (action === 'product') {
    const prod = buildPublicCatalog(db).products.find((p) => p.productId === params.id);
    if (!prod) throw err('NOT_FOUND', 'Product not found.');
    return prod;
  }
  if (action === 'reviews') {
    return db.reviews
      .filter((r) => r['Product ID'] === params.productId && r['Review Status'] === 'Approved')
      .map((r) => ({
        reviewId: r['Review ID'],
        name: r['Customer Name'],
        rating: Number(r.Rating),
        text: r['Review Text'],
        verified: r['Verification Status'] === 'Verified Purchase',
        date: r['Created Date']
      }));
  }
  const cat = buildPublicCatalog(db);
  if (action in cat) return cat[action];
  throw err('METHOD_NOT_ALLOWED', 'Unknown GET action.');
}

export async function mockPost(action, data = {}, auth = {}) {
  const db = getDb();

  if (action === 'quote') {
    const q = computeMockQuote(db, data);
    return {
      items: q.items,
      issues: q.issues,
      subtotal: q.subtotal,
      discount: q.discount,
      couponApplied: q.couponApplied,
      couponError: q.couponError,
      tax: q.tax,
      deliveryFee: q.deliveryFee,
      deliveryCalculated: q.deliveryCalculated,
      deliveryOptions: q.deliveryOptions,
      total: q.total,
      currency: q.currency
    };
  }

  if (action === 'createOrder') {
    if (db.idem[data.idempotencyKey]) {
      const ex = db.orders.find((o) => o['Order ID'] === db.idem[data.idempotencyKey]);
      if (ex) {
        return {
          order: mockOrderView(db, ex),
          duplicate: true,
          payment:
            ex['Payment Method'] === 'Cashfree'
              ? { method: 'Cashfree', status: ex['Payment Status'], mockSandboxPayment: true, environment: 'sandbox' }
              : { method: ex['Payment Method'], status: ex['Payment Status'] }
        };
      }
    }
    // Checkout sends the destination under shipping; quote uses a flat district.
    // Normalize only for pricing, retaining the createOrder API payload shape.
    const q = computeMockQuote(db, {
      ...data,
      district: data.shipping?.district || data.district || ''
    });
    if (q.issues.length) throw err('ITEM_UNAVAILABLE', 'Some items are no longer available in the requested quantity.', q.issues);
    if (data.couponCode && q.couponError) throw err('COUPON_INVALID', q.couponError);
    if (!q.deliveryCalculated) throw err('DELIVERY_UNAVAILABLE', 'Delivery is not available for that selection.');
    if (data.expectedTotal !== undefined && Math.abs(Number(data.expectedTotal) - q.total) > 0.009) {
      throw err('TOTAL_CHANGED', 'Prices or fees changed. Please review your updated total.', { total: q.total });
    }

    const orderId = `BB-SBX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const order = {
      'Order ID': orderId,
      'Customer ID': auth.idToken ? 'CUS-TEST01' : 'GUEST',
      'Customer Name': data.customer.name,
      Email: data.customer.email,
      'Phone Number': data.customer.phone,
      'Address Line 1': data.shipping.address1,
      'Address Line 2': data.shipping.address2 || '',
      City: data.shipping.city,
      District: data.shipping.district,
      Province: DISTRICT_PROVINCE[data.shipping.district] || '',
      'Postal Code': data.shipping.postalCode,
      'Delivery Instructions': data.shipping.instructions || '',
      Subtotal: q.subtotal,
      'Discount Amount': q.discount,
      'Delivery Fee': q.deliveryFee || 0,
      'Tax Amount': q.tax,
      'Final Total': q.total,
      'Payment Method': data.paymentMethod,
      'Payment Status': 'Pending',
      'Order Status': 'Pending',
      'Tracking Number': '',
      'Order Date': nowStr(),
      'Last Updated': nowStr(),
      'Coupon Code': q.couponApplied || '',
      'Delivery Method': data.deliveryMethod
    };
    db.orders.unshift(order);
    q.items.forEach((it) => {
      db.orderItems.push({
        'Order Item ID': uid('OIT'),
        'Order ID': orderId,
        'Product ID': it.productId,
        'Variant ID': it.variantId,
        'Product Name': it.name,
        SKU: it.sku || '',
        Size: it.size,
        Color: it.color,
        Quantity: it.quantity,
        'Unit Price': it.unitPrice,
        'Discount Amount': it.discount,
        'Line Total': it.lineTotal
      });
      applyMockStock(db, it.variantId, 0, it.quantity, 'Reservation', 'Order placed', orderId, 'Sandbox');
    });
    if (q.couponRow) q.couponRow['Used Count'] = Number(q.couponRow['Used Count'] || 0) + 1;
    db.payments.unshift({
      'Payment ID': uid('PAY'),
      'Order ID': orderId,
      'Customer ID': order['Customer ID'],
      'Customer Name': order['Customer Name'],
      'Payment Method': data.paymentMethod,
      'Payment Provider': data.paymentMethod === 'Cashfree' ? 'Cashfree (Sandbox)' : data.paymentMethod === 'Bank Transfer' ? 'Bank' : 'Cash',
      'Transaction Reference': '',
      'Payment Amount': q.total,
      Currency: 'LKR',
      'Payment Status': 'Pending',
      'Payment Date': '',
      'Refund Amount': 0,
      'Refund Status': 'None',
      'Verification Status': 'Unverified'
    });
    db.idem[data.idempotencyKey] = orderId;
    saveDb(db);
    return {
      order: mockOrderView(db, order),
      duplicate: false,
      payment:
        data.paymentMethod === 'Cashfree'
          ? { method: 'Cashfree', status: 'Pending', mockSandboxPayment: true, environment: 'sandbox' }
          : { method: data.paymentMethod, status: 'Pending' }
    };
  }

  if (action === 'trackOrder') {
    const o = db.orders.find(
      (x) =>
        x['Order ID'] === data.orderId &&
        String(x.Email).toLowerCase() === String(data.email).toLowerCase()
    );
    if (!o) throw err('NOT_FOUND', 'We could not find an order matching those details.');
    return mockOrderView(db, o);
  }

  if (action === 'verifyPayment' || action === 'initiatePayment') {
    const o = db.orders.find(
      (x) =>
        x['Order ID'] === data.orderId &&
        String(x.Email).toLowerCase() === String(data.email).toLowerCase()
    );
    if (!o) throw err('NOT_FOUND', 'Order not found.');
    if (action === 'verifyPayment' && o['Payment Method'] === 'Cashfree' && o['Payment Status'] === 'Pending') {
      o['Payment Status'] = 'Paid';
      const p = db.payments.find((x) => x['Order ID'] === o['Order ID']);
      if (p) {
        p['Payment Status'] = 'Paid';
        p['Verification Status'] = 'Verified';
        p['Transaction Reference'] = uid('CF-SBX');
        p['Payment Date'] = nowStr();
      }
      if (o['Order Status'] === 'Pending') transitionMockOrder(db, o, 'Confirmed', '', 'Sandbox');
      saveDb(db);
    }
    return { paymentStatus: o['Payment Status'], orderStatus: o['Order Status'], mockSandboxPayment: true };
  }

  if (action === 'subscribeNewsletter') {
    if (data.website) return { subscribed: true };
    const ex = db.newsletter.find((x) => String(x.Email).toLowerCase() === String(data.email).toLowerCase());
    if (!ex) {
      db.newsletter.push({ 'Subscriber ID': uid('SUB'), Email: data.email, 'Subscription Status': 'Subscribed', 'Subscription Date': todayStr() });
      saveDb(db);
    }
    return { subscribed: true, alreadySubscribed: !!ex, voucherCode: ex ? '' : getSetting(db, 'public.newsletter_coupon_code', 'WELCOME10') };
  }

  if (action === 'submitContact') {
    if (data.website) return { submitted: true };
    const id = uid('MSG');
    db.messages.unshift({
      'Message ID': id,
      'Customer Name': data.name,
      Email: data.email,
      'Phone Number': data.phone || '',
      Subject: data.subject,
      Message: data.message,
      'Message Status': 'New',
      'Assigned Staff': '',
      Timestamp: nowStr()
    });
    saveDb(db);
    return { submitted: true, messageId: id };
  }

  // Customer Auth (sandbox)
  if (action === 'custRegister' || action === 'custForgot') {
    console.info('[SANDBOX] Test OTP verification code is: 123456');
    return { sent: true, expiresInMinutes: 30 };
  }
  if (action === 'custVerify' || action === 'custReset' || action === 'custLogin') {
    if ((action === 'custVerify' || action === 'custReset') && String(data.code) !== '123456') {
      throw err('CODE_INVALID', 'Sandbox verification code is 123456.');
    }
    const c = db.customers[0];
    return {
      token: 'mock-cust-token',
      profile: {
        customerId: c['Customer ID'],
        fullName: c['Full Name'],
        email: data.email || c.Email,
        phone: c['Phone Number'],
        address: c.Address,
        city: c.City,
        district: c.District,
        province: c.Province,
        postalCode: c['Postal Code'],
        accountStatus: c['Account Status']
      }
    };
  }
  if (action === 'custLogout') return { signedOut: true };
  if (action === 'myProfile') {
    const c = db.customers[0];
    return {
      customerId: c['Customer ID'],
      fullName: c['Full Name'],
      email: c.Email,
      phone: c['Phone Number'],
      address: c.Address,
      city: c.City,
      district: c.District,
      province: c.Province,
      postalCode: c['Postal Code'],
      accountStatus: c['Account Status']
    };
  }
  if (action === 'updateMyProfile') {
    const c = db.customers[0];
    if (data.fullName !== undefined) c['Full Name'] = data.fullName;
    if (data.phone !== undefined) c['Phone Number'] = data.phone;
    if (data.address !== undefined) c.Address = data.address;
    if (data.city !== undefined) c.City = data.city;
    if (data.district !== undefined) {
      c.District = data.district;
      c.Province = DISTRICT_PROVINCE[data.district] || '';
    }
    if (data.postalCode !== undefined) c['Postal Code'] = data.postalCode;
    saveDb(db);
    return mockPost('myProfile', {}, auth);
  }
  if (action === 'myOrders') return db.orders.map((o) => mockOrderView(db, o));
  if (action === 'myOrder') {
    const o = db.orders.find((x) => x['Order ID'] === data.orderId);
    if (!o) throw err('NOT_FOUND', 'Order not found.');
    return mockOrderView(db, o, true);
  }
  if (action === 'submitReview') {
    db.reviews.push({
      'Review ID': uid('REV'),
      'Product ID': data.productId,
      'Customer ID': 'CUS-TEST01',
      'Customer Name': 'Sandbox Client',
      Rating: data.rating,
      'Review Text': data.text,
      'Verification Status': 'Verified Purchase',
      'Review Status': 'Pending',
      'Created Date': todayStr()
    });
    saveDb(db);
    return { submitted: true, message: 'Thanks! Your sandbox review is pending approval.' };
  }

  // Admin Auth (sandbox)
  if (action === 'adminLogin') {
    const em = String(data.email || '').trim().toLowerCase();
    const s = db.staff.find((x) => x.email.toLowerCase() === em && x.status === 'Active');
    if (!s || (s.password && data.password !== s.password)) {
      throw err('INVALID_CREDENTIALS', 'Incorrect sandbox email or password.');
    }
    if (s.totpEnabled) {
      return { token: `mock-admin-${s.id}`, expiresAt: Date.now() + 28800000, scope: 'full', staff: s };
    }
    return { token: `mock-admin-${s.id}`, expiresAt: Date.now() + 28800000, scope: 'setup', staff: s };
  }
  if (action === 'adminMe') {
    const sid = String(auth.token || '').replace('mock-admin-', '');
    const s = db.staff.find((x) => x.id === sid) || db.staff[0];
    return { staff: s, scope: s.totpEnabled ? 'full' : 'setup' };
  }
  if (action === 'adminTotpSetup') {
    return { secret: 'SANDBOXSECRET2FA', otpauthUri: 'otpauth://totp/BLACKBRAND:sandbox?secret=SANDBOXSECRET2FA' };
  }
  if (action === 'adminTotpConfirm') {
    if (String(data.code || '') !== '123456') throw err('INVALID_CODE', 'Sandbox 2FA setup code is 123456.');
    const sid = String(auth.token || '').replace('mock-admin-', '');
    const s = db.staff.find((x) => x.id === sid) || db.staff[0];
    s.totpEnabled = true;
    saveDb(db);
    return { token: `mock-admin-${s.id}`, staff: s, scope: 'full' };
  }
  if (action === 'adminChangePassword') {
    const sid = String(auth.token || '').replace('mock-admin-', '');
    const s = db.staff.find((x) => x.id === sid) || db.staff[0];
    if (data.newPassword) s.password = data.newPassword;
    saveDb(db);
    return { token: `mock-admin-${s.id}`, staff: s, scope: 'full' };
  }
  if (action === 'list') {
    let rows = sheetRows(db, data.sheet);
    if (data.where) {
      Object.entries(data.where).forEach(([k, v]) => {
        rows = rows.filter((r) => String(r[k] || '').toLowerCase() === String(v).toLowerCase());
      });
    }
    return { headers: Object.keys(rows[0] || {}), rows, total: rows.length };
  }
  if (action === 'exportCsv') {
    const rows = sheetRows(db, data.sheet);
    return { filename: `sandbox-${slugify(data.sheet)}.csv`, csv: 'Sandbox,Export\r\n', rows: rows.length };
  }
  if (action === 'dashboard' || action === 'analytics') {
    const recognized = ['Paid', 'Partially Refunded', 'Refunded'];
    const paidOrders = db.orders.filter((o) => recognized.includes(o['Payment Status']));
    const refunds = db.payments.reduce((a, p) => a + Number(p['Refund Amount'] || 0), 0);
    const gross = db.sales.reduce((a, s) => (recognized.includes(s['Payment Status']) ? a + Number(s['Gross Revenue'] || 0) : a), 0);
    const disc = db.sales.reduce((a, s) => (recognized.includes(s['Payment Status']) ? a + Number(s['Discount Amount'] || 0) : a), 0);
    const net = r2(gross - disc - refunds);
    const byProd = {};
    const byCat = {};
    db.sales.forEach((s) => {
      if (!recognized.includes(s['Payment Status'])) return;
      (byProd[s['Product ID']] = byProd[s['Product ID']] || { label: s['Product Name'], quantity: 0, revenue: 0 }).quantity += Number(s['Quantity Sold'] || 0);
      byProd[s['Product ID']].revenue = r2(byProd[s['Product ID']].revenue + Number(s['Net Revenue'] || 0));
      const cat = s.Category || 'Uncategorised';
      (byCat[cat] = byCat[cat] || { label: cat, quantity: 0, revenue: 0 }).quantity += Number(s['Quantity Sold'] || 0);
      byCat[cat].revenue = r2(byCat[cat].revenue + Number(s['Net Revenue'] || 0));
    });
    const payMap = {};
    db.orders.forEach((o) => {
      const m = (payMap[o['Payment Method']] = payMap[o['Payment Method']] || { method: o['Payment Method'], orders: 0, paidAmount: 0 });
      m.orders++;
      if (recognized.includes(o['Payment Status'])) m.paidAmount = r2(m.paidAmount + Number(o['Final Total'] || 0));
    });
    const analytics = {
      range: { from: data.from || todayStr(), to: data.to || todayStr() },
      summary: {
        grossRevenue: r2(gross),
        totalDiscounts: r2(disc),
        refunds: r2(refunds),
        netRevenue: net,
        totalOrders: db.orders.length,
        completedOrders: db.orders.filter((o) => o['Order Status'] === 'Delivered').length,
        cancelledOrders: db.orders.filter((o) => o['Order Status'] === 'Cancelled').length,
        productsSold: db.sales.reduce((a, s) => (recognized.includes(s['Payment Status']) ? a + Number(s['Quantity Sold'] || 0) : a), 0),
        averageOrderValue: paidOrders.length ? r2(paidOrders.reduce((a, o) => a + Number(o['Final Total'] || 0), 0) / paidOrders.length) : 0,
        newCustomers: db.customers.length,
        returningCustomers: 0,
        pendingPayments: db.orders.filter((o) => o['Payment Status'] === 'Pending' && !['Cancelled', 'Returned'].includes(o['Order Status'])).length,
        pendingPaymentsAmount: db.orders.filter((o) => o['Payment Status'] === 'Pending' && !['Cancelled', 'Returned'].includes(o['Order Status'])).reduce((a, o) => a + Number(o['Final Total'] || 0), 0)
      },
      topProducts: Object.values(byProd),
      byCategory: Object.values(byCat),
      bySize: [],
      byColor: [],
      paymentMethods: Object.values(payMap),
      orderStatus: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'].map((s) => ({
        status: s,
        count: db.orders.filter((o) => o['Order Status'] === s).length
      })),
      isEmpty: db.orders.length === 0,
      daily: [{ date: todayStr(), orders: db.orders.length, gross: r2(gross), discounts: r2(disc), net }],
      weekly: [{ period: todayStr(), orders: db.orders.length, gross: r2(gross), discounts: r2(disc), net }],
      monthly: [{ period: todayStr().slice(0, 7), orders: db.orders.length, gross: r2(gross), discounts: r2(disc), net }]
    };
    if (action === 'analytics') return analytics;
    return {
      kpis: {
        todaysSales: net,
        totalRevenue: net,
        totalOrders: db.orders.length,
        pendingOrders: db.orders.filter((o) => o['Order Status'] === 'Pending').length,
        completedOrders: db.orders.filter((o) => o['Order Status'] === 'Delivered').length,
        cancelledOrders: db.orders.filter((o) => o['Order Status'] === 'Cancelled').length,
        totalProducts: db.products.filter((p) => p['Product Status'] !== 'Archived').length,
        totalCustomers: db.customers.length,
        lowStockProducts: db.variants.filter((v) => Number(v['Available Quantity'] || 0) <= Number(v['Low Stock Threshold'] ?? 5)).length,
        averageOrderValue: analytics.summary.averageOrderValue
      },
      analytics
    };
  }
  if (action === 'saveEntity') {
    const rec = data.record || {};
    const cfg = {
      category: { arr: db.categories, idKey: 'Category ID', prefix: 'CAT', slugFrom: 'Category Name' },
      collection: { arr: db.collections, idKey: 'Collection ID', prefix: 'COL', slugFrom: 'Collection Name' },
      banner: { arr: db.banners, idKey: 'Banner ID', prefix: 'BAN' },
      coupon: { arr: db.coupons, idKey: 'Coupon ID', prefix: 'CPN' },
      shipping: { arr: db.shipping, idKey: 'Shipping Rule ID', prefix: 'SHP' }
    }[data.entity];
    if (!cfg) throw err('VALIDATION', 'Unknown entity.');
    const existing = rec.id ? cfg.arr.find((x) => x[cfg.idKey] === rec.id) : null;
    const cleanRec = { ...rec };
    delete cleanRec.id;
    if (cfg.slugFrom && !cleanRec.Slug && cleanRec[cfg.slugFrom]) cleanRec.Slug = slugify(cleanRec[cfg.slugFrom]);
    if (data.entity === 'coupon' && cleanRec['Coupon Code']) cleanRec['Coupon Code'] = String(cleanRec['Coupon Code']).toUpperCase();
    if (existing) {
      Object.assign(existing, cleanRec, { 'Last Updated': nowStr() });
      saveDb(db);
      return existing;
    }
    const created = { [cfg.idKey]: uid(cfg.prefix), ...cleanRec, 'Last Updated': nowStr() };
    if (data.entity === 'coupon') created['Used Count'] = 0;
    cfg.arr.push(created);
    saveDb(db);
    return created;
  }
  if (action === 'getProduct') {
    const product = db.products.find((p) => p['Product ID'] === data.productId);
    if (!product) throw err('NOT_FOUND', 'Product not found.');
    return { product, variants: db.variants.filter((v) => v['Product ID'] === product['Product ID']) };
  }
  if (action === 'saveProduct') {
    const pi = data.product || {};
    const pid = pi.productId || uid('PRD');
    let prod = db.products.find((p) => p['Product ID'] === pid);
    const patch = {
      'Product ID': pid,
      'Product Name': pi.name,
      SKU: pi.sku,
      Category: pi.category,
      Subcategory: pi.subcategory || '',
      Collection: pi.collection || '',
      Description: pi.description || '',
      'Regular Price': Number(pi.regularPrice),
      'Sale Price': Number(pi.salePrice || 0),
      'Cost Price': Number(pi.costPrice || 0),
      'Discount Percentage': Number(pi.discountPercentage || 0),
      Fabric: pi.fabric || '',
      'Care Instructions': pi.careInstructions || '',
      'Main Image URL': pi.mainImageUrl || placeholderImg,
      'Additional Image URLs': (pi.additionalImageUrls || []).join('|'),
      'Product Status': pi.status || 'Draft',
      'Featured Status': pi.featured ? 'Yes' : 'No',
      'Created Date': prod ? prod['Created Date'] : nowStr(),
      'Last Updated': nowStr()
    };
    if (prod) Object.assign(prod, patch);
    else { prod = patch; db.products.unshift(prod); }
    (data.variants || []).forEach((v) => {
      const existing = v.variantId ? db.variants.find((x) => x['Variant ID'] === v.variantId) : null;
      if (existing) {
        existing['Product Name'] = pi.name;
        existing['Stock Quantity'] = Number(v.stock || 0);
        existing['Available Quantity'] = Math.max(0, existing['Stock Quantity'] - existing['Reserved Quantity']);
        existing['Variant Price'] = Number(v.price || 0);
        existing['Variant Status'] = v.status || 'Active';
      } else {
        db.variants.push({
          'Variant ID': uid('VAR'),
          'Product ID': pid,
          'Product Name': pi.name,
          SKU: `${pi.sku}-${v.size}-${v.color}`.toUpperCase(),
          Size: v.size,
          Color: v.color,
          'Variant Price': Number(v.price || 0),
          'Stock Quantity': Number(v.stock || 0),
          'Reserved Quantity': 0,
          'Available Quantity': Number(v.stock || 0),
          'Low Stock Threshold': 5,
          'Variant Image URL': '',
          'Variant Status': v.status || 'Active',
          'Last Updated': nowStr()
        });
      }
    });
    saveDb(db);
    return { product: prod, variants: db.variants.filter((v) => v['Product ID'] === pid) };
  }
  if (action === 'duplicateProduct') {
    const src = db.products.find((p) => p['Product ID'] === data.productId);
    if (!src) throw err('NOT_FOUND', 'Product not found.');
    const pid = uid('PRD');
    const copy = { ...src, 'Product ID': pid, 'Product Name': data.newName || `${src['Product Name']} (Copy)`, SKU: String(data.newSku).toUpperCase(), 'Product Status': 'Draft', 'Created Date': nowStr(), 'Last Updated': nowStr() };
    db.products.unshift(copy);
    db.variants.filter((v) => v['Product ID'] === src['Product ID']).forEach((v) => {
      db.variants.push({ ...v, 'Variant ID': uid('VAR'), 'Product ID': pid, 'Product Name': copy['Product Name'], SKU: `${copy.SKU}-${v.Size}-${v.Color}`.toUpperCase(), 'Stock Quantity': 0, 'Reserved Quantity': 0, 'Available Quantity': 0 });
    });
    saveDb(db);
    return { product: copy, variants: [] };
  }
  if (action === 'storefrontStatus') {
    return { visible: true, reasons: [], productId: data.productId, storefrontPath: `#/product/${data.productId}` };
  }
  if (action === 'uploadImage') {
    return { fileId: uid('IMG'), url: placeholderImg };
  }
  if (action === 'setProductStatus') {
    const p = db.products.find((x) => x['Product ID'] === data.productId);
    if (p) p['Product Status'] = data.status;
    saveDb(db);
    return { product: p };
  }
  if (action === 'saveSetting') {
    const ex = db.settings.find((s) => s['Setting Name'] === data.name);
    if (ex) { ex['Setting Value'] = data.value; if (data.description !== undefined) ex.Description = data.description; ex['Last Updated'] = nowStr(); }
    else db.settings.push({ 'Setting ID': uid('SET'), 'Setting Name': data.name, 'Setting Value': data.value, Description: data.description || '', 'Last Updated': nowStr() });
    saveDb(db);
    return { name: data.name, value: data.value };
  }
  if (action === 'getOrder') {
    const o = db.orders.find((x) => x['Order ID'] === data.orderId);
    if (!o) throw err('NOT_FOUND', 'Order not found.');
    const pay = db.payments.find((x) => x['Order ID'] === o['Order ID']) || null;
    const transitions = { Pending: ['Confirmed', 'Cancelled'], Confirmed: ['Processing', 'Shipped', 'Cancelled'], Processing: ['Shipped', 'Cancelled'], Shipped: ['Delivered', 'Returned'], Delivered: ['Returned'], Cancelled: [], Returned: [] };
    return { order: mockOrderView(db, o, true), payment: pay, allowedNextStatuses: transitions[o['Order Status']] || [] };
  }
  if (action === 'updateOrderStatus') {
    const o = db.orders.find((x) => x['Order ID'] === data.orderId);
    if (!o) throw err('NOT_FOUND', 'Order not found.');
    transitionMockOrder(db, o, data.status, data.trackingNumber, 'Sandbox');
    saveDb(db);
    return { order: mockOrderView(db, o, true), refundDue: 0 };
  }
  if (action === 'recordPayment') {
    const o = db.orders.find((x) => x['Order ID'] === data.orderId);
    const p = db.payments.find((x) => x['Order ID'] === data.orderId);
    if (o) o['Payment Status'] = 'Paid';
    if (p) { p['Payment Status'] = 'Paid'; p['Transaction Reference'] = data.reference || ''; p['Verification Status'] = 'Manually Verified'; p['Payment Date'] = nowStr(); }
    saveDb(db);
    return mockOrderView(db, o, true);
  }
  if (action === 'recordRefund') {
    const o = db.orders.find((x) => x['Order ID'] === data.orderId);
    const p = db.payments.find((x) => x['Order ID'] === data.orderId);
    if (!p) throw err('NOT_FOUND', 'Payment not found.');
    const tot = r2(Number(p['Refund Amount'] || 0) + Number(data.amount || 0));
    const full = tot >= Number(p['Payment Amount']) - 0.01;
    const st = full ? 'Refunded' : 'Partially Refunded';
    p['Refund Amount'] = tot;
    p['Refund Status'] = full ? 'Refunded' : 'Partial';
    p['Payment Status'] = st;
    if (o) o['Payment Status'] = st;
    saveDb(db);
    return { orderId: data.orderId, refundedTotal: tot, paymentStatus: st };
  }
  if (action === 'adjustStock') {
    const v = db.variants.find((x) => x['Variant ID'] === data.variantId);
    if (!v) throw err('NOT_FOUND', 'Variant not found.');
    const cur = Number(v['Stock Quantity'] || 0);
    const delta = data.mode === 'add' ? data.quantity : data.mode === 'reduce' ? -data.quantity : data.quantity - cur;
    applyMockStock(db, data.variantId, delta, 0, data.mode === 'add' ? 'Stock Added' : data.mode === 'reduce' ? 'Stock Reduced' : 'Adjustment', data.reason, '', 'Sandbox');
    saveDb(db);
    return { total: v['Stock Quantity'] };
  }
  if (action === 'setLowStockThreshold') {
    const v = db.variants.find((x) => x['Variant ID'] === data.variantId);
    if (v) v['Low Stock Threshold'] = Number(data.threshold);
    saveDb(db);
    return { ok: true };
  }
  if (action === 'updateCustomerStatus') {
    const c = db.customers.find((x) => x['Customer ID'] === data.customerId);
    if (c) c['Account Status'] = data.status;
    saveDb(db);
    return c;
  }
  if (action === 'setReviewStatus') {
    const r = db.reviews.find((x) => x['Review ID'] === data.reviewId);
    if (r) r['Review Status'] = data.status;
    saveDb(db);
    return r;
  }
  if (action === 'updateMessage') {
    const m = db.messages.find((x) => x['Message ID'] === data.messageId);
    if (m) { m['Message Status'] = data.status; m['Assigned Staff'] = data.assignedStaff || ''; }
    saveDb(db);
    return m;
  }
  if (action === 'listStaff') return db.staff.map(({ password, ...pub }) => pub);
  if (action === 'createStaff') {
    const st = { id: uid('STF'), name: data.name, email: data.email, password: data.password, role: data.role, status: 'Active', totpEnabled: false, createdAt: nowStr() };
    db.staff.push(st);
    saveDb(db);
    return st;
  }
  if (action === 'updateStaff') {
    const st = db.staff.find((x) => x.id === data.id);
    if (st) { st.name = data.name; st.role = data.role; st.status = data.status; }
    saveDb(db);
    return st;
  }
  if (action === 'resetStaffPassword') {
    const st = db.staff.find((x) => x.id === data.id);
    if (st) { st.password = data.password; if (data.reset2fa === 'true') st.totpEnabled = false; }
    saveDb(db);
    return st;
  }
  if (action === 'syncPayments') return { corrected: 0 };
  if (action === 'invoice') {
    const o = db.orders.find((x) => x['Order ID'] === data.orderId);
    return { store: { name: 'BLACK BRAND [SANDBOX]', location: 'Kalpitiya', phone: '+94 77 049 8004' }, order: mockOrderView(db, o, true), invoiceNumber: `INV-${data.orderId}`, generatedAt: nowStr() };
  }

  throw err('UNKNOWN_ACTION', `Action "${action}" is not supported in mock mode.`);
}
