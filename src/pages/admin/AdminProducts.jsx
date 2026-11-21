import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { isVideoUrl, money, uniq } from '../../utils/format';
import { Modal, Spinner } from '../../components/ui/Primitives';
import { AdminBtn, DataTable, FormModal, StatusPill } from '../../components/admin/AdminPrimitives';

export function AdminProductsListPage({ call, list, toast }) {
  const navigate = useNavigate();
  const [prods, setProds] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [applied, setApplied] = useState({ q: '', status: '' });
  const [dupTarget, setDupTarget] = useState(null);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const [pr, vr] = await Promise.all([list('Products'), list('Product Variants')]);
      setProds(pr.rows || []);
      setVariants(vr.rows || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => { load(); }, [load]);

  if (loading && !prods.length) return <Spinner className="my-20" />;
  if (err && !prods.length) return <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-xs text-[#8a1a14]">{err}</div>;

  const cnt = {};
  const stock = {};
  variants.forEach((v) => {
    cnt[v['Product ID']] = (cnt[v['Product ID']] || 0) + 1;
    stock[v['Product ID']] = (stock[v['Product ID']] || 0) + Number(v['Available Quantity'] || 0);
  });

  const term = applied.q.trim().toLowerCase();
  const rows = prods.filter((p) => {
    if (applied.status && p['Product Status'] !== applied.status) return false;
    if (!term) return true;
    return ['Product Name', 'SKU', 'Category', 'Product ID'].some((k) =>
      String(p[k] || '').toLowerCase().includes(term)
    );
  });

  const changeStatus = async (productId, nextStatus) => {
    if (nextStatus === 'Archived' && !window.confirm('Archive this product? It will disappear from the storefront.')) {
      return;
    }
    setBusyId(productId);
    try {
      await call('setProductStatus', { productId, status: nextStatus });
      toast(`Product ${nextStatus.toLowerCase()}`);
      await load();
    } catch (e) {
      toast(e.message, true);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl">Products</h1>
      <p className="mb-4 text-xs text-slate">
        Published products appear on the storefront; archived products cannot be purchased.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setApplied({ q, status });
        }}
        className="mb-4 flex flex-wrap items-end gap-2 border border-hairline bg-white p-3"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, SKU, category"
            className="h-9 min-w-[160px] border border-[#cfcfcd] px-2.5 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 min-w-[130px] border border-[#cfcfcd] bg-white px-2 text-xs"
          >
            <option value="">All</option>
            <option>Draft</option>
            <option>Published</option>
            <option>Archived</option>
          </select>
        </div>
        <AdminBtn type="submit" variant="outline">Filter</AdminBtn>
        <div className="flex-1" />
        <Link
          to="/product/new"
          className="inline-flex h-9 items-center border border-champagne-soft bg-champagne-soft px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#261900] hover:bg-champagne"
        >
          + Add Product
        </Link>
      </form>

      <DataTable
        empty="No products yet — click “Add Product”."
        rows={rows}
        cols={[
          {
            h: 'Image',
            f: (p) =>
              p['Main Image URL'] ? (
                <img src={p['Main Image URL']} alt="" className="h-12 w-10 bg-[#eee] object-cover" />
              ) : null
          },
          {
            h: 'Product',
            f: (p) => (
              <div>
                <b>{p['Product Name']}</b>
                <div className="text-slate">{p['SKU']} · {p['Product ID']}</div>
              </div>
            )
          },
          { h: 'Category', k: 'Category' },
          {
            h: 'Price',
            f: (p) =>
              Number(p['Sale Price']) > 0 ? (
                <div>
                  {money(p['Sale Price'])}
                  <div><s className="text-slate">{money(p['Regular Price'])}</s></div>
                </div>
              ) : (
                money(p['Regular Price'])
              )
          },
          {
            h: 'Variants / stock',
            f: (p) => `${cnt[p['Product ID']] || 0} / ${stock[p['Product ID']] || 0}`
          },
          {
            h: 'Status',
            f: (p) => (
              <span>
                <StatusPill status={p['Product Status']} />
                {p['Featured Status'] === 'Yes' ? ' ★' : ''}
              </span>
            )
          },
          { h: 'Updated', k: 'Last Updated' },
          {
            h: '',
            f: (p) => {
              const id = p['Product ID'];
              const s = p['Product Status'];
              const isBusy = busyId === id;
              return (
                <div className="flex flex-wrap gap-1">
                  <Link
                    to={`/product/${encodeURIComponent(id)}`}
                    className="inline-flex h-7 items-center border border-[#bdbdbb] bg-white px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] hover:bg-ivory"
                  >
                    Edit
                  </Link>
                  <AdminBtn size="sm" variant="outline" disabled={isBusy} onClick={() => setDupTarget(id)}>
                    Duplicate
                  </AdminBtn>
                  {s === 'Published' ? (
                    <AdminBtn size="sm" variant="outline" disabled={isBusy} onClick={() => changeStatus(id, 'Draft')}>
                      Unpublish
                    </AdminBtn>
                  ) : (
                    <AdminBtn size="sm" variant="gold" disabled={isBusy} onClick={() => changeStatus(id, 'Published')}>
                      Publish
                    </AdminBtn>
                  )}
                  {s === 'Archived' ? (
                    <AdminBtn size="sm" variant="outline" disabled={isBusy} onClick={() => changeStatus(id, 'Draft')}>
                      Restore
                    </AdminBtn>
                  ) : (
                    <AdminBtn size="sm" variant="danger" disabled={isBusy} onClick={() => changeStatus(id, 'Archived')}>
                      Archive
                    </AdminBtn>
                  )}
                </div>
              );
            }
          }
        ]}
      />

      <FormModal
        open={!!dupTarget}
        title="Duplicate product"
        onClose={() => setDupTarget(null)}
        fields={[
          { n: 'newSku', l: 'New SKU', req: 1 },
          { n: 'newName', l: 'New name (optional)' }
        ]}
        onSubmit={async (o) => {
          const r = await call('duplicateProduct', {
            productId: dupTarget,
            newSku: o.newSku,
            newName: o.newName
          });
          toast('Duplicated as draft');
          navigate(`/product/${encodeURIComponent(r.product['Product ID'])}`);
        }}
      />
    </div>
  );
}

export function AdminProductEditorPage({ call, list, toast }) {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [cats, setCats] = useState([]);
  const [cols, setCols] = useState([]);

  const [productId, setProductId] = useState('');
  const [status, setStatus] = useState('Draft');
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    subcategory: '',
    collection: '',
    description: '',
    fabric: '',
    careInstructions: '',
    featured: false,
    regularPrice: '',
    salePrice: '',
    costPrice: '',
    discountPercentage: '',
    mainImageUrl: '',
    additionalText: ''
  });

  const [sizesInput, setSizesInput] = useState('S, M, L, XL, XXL');
  const [colorsInput, setColorsInput] = useState('');
  const [variants, setVariants] = useState([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveErrs, setSaveErrs] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [visibilityModal, setVisibilityModal] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadErr('');
    Promise.all([
      list('Categories'),
      list('Collections'),
      isNew ? Promise.resolve(null) : call('getProduct', { productId: decodeURIComponent(id) })
    ])
      .then(([catRes, colRes, data]) => {
        if (!alive) return;
        setCats((catRes.rows || []).filter((c) => c['Category Status'] === 'Active'));
        setCols(colRes.rows || []);

        if (data) {
          const p = data.product;
          setProductId(p['Product ID']);
          setStatus(p['Product Status']);
          setForm({
            name: p['Product Name'] || '',
            sku: p['SKU'] || '',
            category: p['Category'] || '',
            subcategory: p['Subcategory'] || '',
            collection: p['Collection'] || '',
            description: p['Description'] || '',
            fabric: p['Fabric'] || '',
            careInstructions: p['Care Instructions'] || '',
            featured: p['Featured Status'] === 'Yes',
            regularPrice: p['Regular Price'] ?? '',
            salePrice: Number(p['Sale Price']) > 0 ? p['Sale Price'] : '',
            costPrice: p['Cost Price'] ?? '',
            discountPercentage: p['Discount Percentage'] ?? '',
            mainImageUrl: p['Main Image URL'] || '',
            additionalText: String(p['Additional Image URLs'] || '').split('|').filter(Boolean).join('\n')
          });

          const szs = ['S', 'M', 'L', 'XL', 'XXL'];
          const clrs = [];
          const mappedVars = (data.variants || []).map((v) => {
            if (szs.indexOf(v['Size']) < 0) szs.push(v['Size']);
            if (clrs.indexOf(v['Color']) < 0) clrs.push(v['Color']);
            return {
              variantId: v['Variant ID'],
              size: v['Size'],
              color: v['Color'],
              stock: Number(v['Stock Quantity']),
              price: Number(v['Variant Price']) || '',
              status: v['Variant Status'],
              reserved: Number(v['Reserved Quantity']),
              available: Number(v['Available Quantity']),
              image: v['Variant Image URL'] || ''
            };
          });
          setSizesInput(szs.join(', '));
          setColorsInput(clrs.join(', '));
          setVariants(mappedVars);
        } else {
          setProductId('');
          setStatus('Draft');
          setVariants([]);
        }
      })
      .catch((e) => { if (alive) setLoadErr(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id, isNew, call, list]);

  if (loading) return <Spinner className="my-20" />;
  if (loadErr) return <div className="border border-[#f3c1bd] bg-[#fff1f0] p-4 text-xs text-[#8a1a14]">{loadErr}</div>;

  const parseCommaList = (s) =>
    uniq(String(s || '').split(',').map((x) => x.trim()).filter(Boolean));

  const generateVariants = () => {
    const szs = parseCommaList(sizesInput);
    const clrs = parseCommaList(colorsInput);
    if (!szs.length || !clrs.length) {
      toast('Enter at least one size and one colour.', true);
      return;
    }
    setVariants((prev) => {
      const next = [...prev];
      szs.forEach((s) => {
        clrs.forEach((c) => {
          const exists = next.some(
            (v) => v.size.toLowerCase() === s.toLowerCase() && v.color.toLowerCase() === c.toLowerCase()
          );
          if (!exists) {
            next.push({
              variantId: '',
              size: s,
              color: c,
              stock: 0,
              price: '',
              status: 'Active',
              reserved: 0,
              available: 0
            });
          }
        });
      });
      return next;
    });
  };

  const onRegularOrSaleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      const reg = Number(next.regularPrice) || 0;
      const sale = Number(next.salePrice) || 0;
      next.discountPercentage = sale > 0 && reg > 0 ? (((reg - sale) / reg) * 100).toFixed(2) : '';
      return next;
    });
  };

  const onDiscountChange = (value) => {
    setForm((prev) => {
      const reg = Number(prev.regularPrice) || 0;
      const dp = Number(value) || 0;
      return {
        ...prev,
        discountPercentage: value,
        salePrice: dp > 0 && reg > 0 ? (reg * (1 - dp / 100)).toFixed(2) : ''
      };
    });
  };

  const reg = Number(form.regularPrice) || 0;
  const sale = Number(form.salePrice) || 0;
  const cost = Number(form.costPrice) || 0;
  const activePrice = sale > 0 ? sale : reg;
  const marginText =
    activePrice && cost
      ? `${(((activePrice - cost) / activePrice) * 100).toFixed(1)}% (Rs. ${(activePrice - cost).toFixed(2)})`
      : '—';

  const additionalUrls = form.additionalText
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const uploadFiles = async (files, target) => {
    if (!files?.length) return;
    setUploadingCount((c) => c + 1);
    toast('Uploading…');
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB.');
        const base64 = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result).split(',')[1]);
          r.onerror = () => rej(new Error('Could not read file.'));
          r.readAsDataURL(file);
        });
        const uploaded = await call('uploadImage', { fileName: file.name, base64 });
        if (target === 'main') {
          setForm((s) => ({ ...s, mainImageUrl: uploaded.url }));
        } else {
          setForm((s) => ({
            ...s,
            additionalText: s.additionalText ? `${s.additionalText}\n${uploaded.url}` : uploaded.url
          }));
        }
      }
      toast('Uploaded');
    } catch (e) {
      toast(e.message, true);
    } finally {
      setUploadingCount((c) => Math.max(0, c - 1));
    }
  };

  const removeAdditionalAt = (idx) => {
    const next = additionalUrls.filter((_, i) => i !== idx);
    setForm((s) => ({ ...s, additionalText: next.join('\n') }));
  };

  const handleSave = async (targetStatus) => {
    if (uploadingCount > 0) {
      toast('Please wait for image upload to finish.', true);
      return;
    }
    const errs = [];
    if (!form.name.trim()) errs.push('Product name is required.');
    if (!form.sku.trim()) errs.push('SKU is required.');
    if (!form.category) errs.push('Choose a category.');
    if (!(Number(form.regularPrice) > 0)) errs.push('Regular price must be greater than 0.');
    if (Number(form.salePrice) > 0 && Number(form.salePrice) >= Number(form.regularPrice)) {
      errs.push('Sale price must be lower than the regular price.');
    }
    variants.forEach((v) => {
      const stk = Number(v.stock);
      if (!Number.isInteger(stk) || stk < 0) {
        errs.push(`Stock for ${v.size}/${v.color} must be a whole number >= 0.`);
      } else if (stk < (v.reserved || 0)) {
        errs.push(`Stock for ${v.size}/${v.color} cannot be below reserved quantity (${v.reserved}).`);
      }
    });
    if (targetStatus === 'Published') {
      if (!form.mainImageUrl.trim()) errs.push('A main image is required to publish.');
      if (!variants.some((v) => v.status === 'Active')) errs.push('Add at least one active variant to publish.');
    }
    if (errs.length) {
      setSaveErrs(errs);
      return;
    }

    setSaveErrs([]);
    setSaving(true);
    try {
      const payload = {
        product: {
          ...(productId ? { productId } : {}),
          name: form.name,
          sku: form.sku,
          category: form.category,
          subcategory: form.subcategory,
          collection: form.collection,
          description: form.description,
          fabric: form.fabric,
          careInstructions: form.careInstructions,
          regularPrice: form.regularPrice,
          salePrice: form.salePrice,
          costPrice: form.costPrice,
          discountPercentage: form.discountPercentage,
          mainImageUrl: form.mainImageUrl.trim(),
          additionalImageUrls: additionalUrls,
          featured: form.featured,
          status: targetStatus
        },
        variants: variants.map((v) => ({
          variantId: v.variantId,
          size: v.size,
          color: v.color,
          stock: Number(v.stock) || 0,
          price: v.price,
          status: v.status
        }))
      };

      const saved = await call('saveProduct', payload);
      const savedId = saved.product['Product ID'];
      setProductId(savedId);

      const sf = await call('storefrontStatus', { productId: savedId });
      if (sf.visible && !(sf.reasons || []).length) {
        toast('Saved. The product is live on the storefront.');
        navigate('/products');
      } else {
        setVisibilityModal(sf);
      }
    } catch (e) {
      setSaveErrs([e.message]);
    } finally {
      setSaving(false);
    }
  };

  const isUploading = uploadingCount > 0;

  return (
    <div>
      <h1 className="font-display text-3xl">{productId ? 'Edit Product' : 'Add Product'}</h1>
      <p className="mb-5 text-xs text-slate">
        {productId ? (
          <>
            {form.name} · <StatusPill status={status} />
          </>
        ) : (
          'Create a garment master record, its size/colour variants and opening stock.'
        )}
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-3 border border-hairline bg-white p-5">
            <h3 className="font-display text-base">Core information</h3>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                Product name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="h-10 w-full border border-[#cfcfcd] px-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                  Product ID
                </label>
                <input
                  readOnly
                  value={productId || 'Auto-generated'}
                  className="h-10 w-full border border-[#cfcfcd] bg-[#f3f3f1] px-2.5 text-xs text-slate"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                  SKU *
                </label>
                <input
                  readOnly={!!productId}
                  value={form.sku}
                  onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
                  className={`h-10 w-full border border-[#cfcfcd] px-2.5 text-xs ${
                    productId ? 'bg-[#f3f3f1] text-slate' : 'bg-white'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                className="h-10 w-full border border-[#cfcfcd] bg-white px-2.5 text-xs"
              >
                <option value="">Select category</option>
                {cats.map((c) => <option key={c['Category ID']}>{c['Category Name']}</option>)}
              </select>
              {!cats.length && (
                <small className="text-[11px] text-slate">Add an active category first (Categories page).</small>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                  Subcategory
                </label>
                <input
                  value={form.subcategory}
                  onChange={(e) => setForm((s) => ({ ...s, subcategory: e.target.value }))}
                  className="h-10 w-full border border-[#cfcfcd] px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                  Collection
                </label>
                <select
                  value={form.collection}
                  onChange={(e) => setForm((s) => ({ ...s, collection: e.target.value }))}
                  className="h-10 w-full border border-[#cfcfcd] bg-white px-2.5 text-xs"
                >
                  <option value="" />
                  {cols.map((c) => <option key={c['Collection ID']}>{c['Collection Name']}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                className="h-24 w-full border border-[#cfcfcd] p-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                  Fabric information
                </label>
                <input
                  value={form.fabric}
                  onChange={(e) => setForm((s) => ({ ...s, fabric: e.target.value }))}
                  className="h-10 w-full border border-[#cfcfcd] px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                  Care instructions
                </label>
                <input
                  value={form.careInstructions}
                  onChange={(e) => setForm((s) => ({ ...s, careInstructions: e.target.value }))}
                  className="h-10 w-full border border-[#cfcfcd] px-2.5 text-xs"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))}
              />
              <span>Featured product (shown in Best Sellers)</span>
            </label>
          </div>

          <div className="space-y-3 border border-hairline bg-white p-5">
            <h3 className="font-display text-base">Pricing (LKR)</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                  Regular price *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.regularPrice}
                  onChange={(e) => onRegularOrSaleChange('regularPrice', e.target.value)}
                  className="h-10 w-full border border-[#cfcfcd] px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                  Sale price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) => onRegularOrSaleChange('salePrice', e.target.value)}
                  className="h-10 w-full border border-[#cfcfcd] px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                  Cost price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) => setForm((s) => ({ ...s, costPrice: e.target.value }))}
                  className="h-10 w-full border border-[#cfcfcd] px-2.5 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                  Discount % (auto)
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  step="0.01"
                  value={form.discountPercentage}
                  onChange={(e) => onDiscountChange(e.target.value)}
                  className="h-10 w-full border border-[#cfcfcd] px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                  Margin (live)
                </label>
                <input
                  readOnly
                  value={marginText}
                  className="h-10 w-full border border-[#cfcfcd] bg-[#f3f3f1] px-2.5 text-xs text-slate"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3 border border-hairline bg-white p-5">
            <h3 className="font-display text-base">Media</h3>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                Main image URL (https) *
              </label>
              <div className="flex gap-2">
                <input
                  value={form.mainImageUrl}
                  onChange={(e) => setForm((s) => ({ ...s, mainImageUrl: e.target.value }))}
                  className="h-10 flex-1 border border-[#cfcfcd] px-2.5 text-xs"
                />
                {form.mainImageUrl && (
                  <AdminBtn
                    type="button"
                    variant="danger"
                    onClick={() => setForm((s) => ({ ...s, mainImageUrl: '' }))}
                  >
                    Remove
                  </AdminBtn>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="inline-flex h-7 cursor-pointer items-center border border-[#bdbdbb] bg-white px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] hover:bg-ivory">
                Upload main image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => {
                    uploadFiles(e.target.files, 'main');
                    e.target.value = '';
                  }}
                />
              </label>
              <label className="inline-flex h-7 cursor-pointer items-center border border-[#bdbdbb] bg-white px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] hover:bg-ivory">
                Upload more
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => {
                    uploadFiles(e.target.files, 'more');
                    e.target.value = '';
                  }}
                />
              </label>
              {isUploading && <span className="self-center text-[11px] text-slate">Uploading…</span>}
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                Additional images / video URLs (one per line)
              </label>
              <textarea
                value={form.additionalText}
                onChange={(e) => setForm((s) => ({ ...s, additionalText: e.target.value }))}
                className="h-24 w-full border border-[#cfcfcd] p-2.5 text-xs"
              />
              <small className="text-[11px] text-slate">Video: paste an https .mp4 link.</small>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.mainImageUrl && (
                <div className="relative">
                  <img src={form.mainImageUrl} alt="" className="h-14 w-11 border border-obsidian object-cover" />
                </div>
              )}
              {additionalUrls.map((u, idx) => (
                <div key={idx} className="relative">
                  {isVideoUrl(u) ? (
                    <span className="inline-flex h-14 items-center border border-hairline bg-[#efefed] px-2 text-[10px]">
                      ▶ video
                    </span>
                  ) : (
                    <img src={u} alt="" className="h-14 w-11 border border-hairline object-cover" />
                  )}
                  <button
                    type="button"
                    aria-label="Remove media"
                    onClick={() => removeAdditionalAt(idx)}
                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-obsidian text-white"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 border border-hairline bg-white p-5">
            <h3 className="font-display text-base">Sizes &amp; colours</h3>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                Sizes (comma separated)
              </label>
              <input
                value={sizesInput}
                onChange={(e) => setSizesInput(e.target.value)}
                className="h-10 w-full border border-[#cfcfcd] px-2.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#444748]">
                Colours (comma separated)
              </label>
              <input
                value={colorsInput}
                onChange={(e) => setColorsInput(e.target.value)}
                placeholder="Black, Sand Ecru"
                className="h-10 w-full border border-[#cfcfcd] px-2.5 text-xs"
              />
            </div>
            <AdminBtn type="button" variant="outline" onClick={generateVariants}>
              Generate variant grid
            </AdminBtn>
          </div>
        </div>
      </div>

      <div className="mt-4 border border-hairline bg-white p-5">
        <h3 className="mb-3 font-display text-base">Variant stock matrix</h3>
        {variants.length ? (
          <>
            <div className="overflow-x-auto border border-hairline">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-hairline bg-[#fafaf8] text-[10px] uppercase tracking-[0.08em] text-slate">
                    <th className="px-3 py-2">Size</th>
                    <th className="px-3 py-2">Colour</th>
                    <th className="px-3 py-2">Total stock</th>
                    <th className="px-3 py-2">Reserved</th>
                    <th className="px-3 py-2">Available</th>
                    <th className="px-3 py-2">Price override</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {variants.map((v, i) => (
                    <tr key={`${v.size}-${v.color}-${i}`}>
                      <td className="px-3 py-2">{v.size}</td>
                      <td className="px-3 py-2">{v.color}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={v.reserved || 0}
                          value={v.stock}
                          onChange={(e) =>
                            setVariants((prev) =>
                              prev.map((x, idx) => (idx === i ? { ...x, stock: e.target.value } : x))
                            )
                          }
                          className="h-8 w-20 border border-[#cfcfcd] px-2 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">{v.reserved || 0}</td>
                      <td className="px-3 py-2">{v.available || 0}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={v.price}
                          placeholder="—"
                          onChange={(e) =>
                            setVariants((prev) =>
                              prev.map((x, idx) => (idx === i ? { ...x, price: e.target.value } : x))
                            )
                          }
                          className="h-8 w-24 border border-[#cfcfcd] px-2 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={v.status}
                          onChange={(e) =>
                            setVariants((prev) =>
                              prev.map((x, idx) => (idx === i ? { ...x, status: e.target.value } : x))
                            )
                          }
                          className="h-8 border border-[#cfcfcd] bg-white px-2 text-xs"
                        >
                          <option>Active</option>
                          <option>Inactive</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <small className="mt-2 block text-[11px] text-slate">
              Variants cannot be deleted; set one to Inactive to retire it. Stock changes are logged in Stock History.
            </small>
          </>
        ) : (
          <div className="text-xs text-slate">
            No variants yet. Enter sizes and colours, then “Generate variant grid”.
          </div>
        )}
      </div>

      {saveErrs.length > 0 && (
        <div className="mt-4 border border-[#f3c1bd] bg-[#fff1f0] p-3 text-xs text-[#8a1a14]">
          {saveErrs.map((er, i) => <div key={i}>{er}</div>)}
        </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-wrap justify-end gap-2 border-t border-hairline bg-white px-4 py-3 md:-mx-6 md:px-6">
        <Link
          to="/products"
          className="inline-flex h-9 items-center border border-[#bdbdbb] bg-white px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] hover:bg-ivory"
        >
          Cancel
        </Link>
        <AdminBtn type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
          Preview
        </AdminBtn>
        <AdminBtn type="button" variant="outline" disabled={saving || isUploading} onClick={() => handleSave('Draft')}>
          Save Draft
        </AdminBtn>
        {status === 'Published' ? (
          <AdminBtn type="button" variant="outline" disabled={saving || isUploading} onClick={() => handleSave('Published')}>
            Save (stay published)
          </AdminBtn>
        ) : (
          <AdminBtn type="button" variant="gold" disabled={saving || isUploading} onClick={() => handleSave('Published')}>
            Publish Product
          </AdminBtn>
        )}
      </div>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <h3 className="mb-3 font-display text-xl">Storefront preview</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="border border-hairline bg-white p-2">
            <div className="aspect-[3/4] bg-[#eee]">
              {form.mainImageUrl && (
                <img src={form.mainImageUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="pt-2">
              <div className="font-display text-base uppercase">{form.name || 'Product name'}</div>
              <div className="mt-1 flex justify-between text-xs font-semibold">
                <span>
                  {money(activePrice)}
                  {sale > 0 && <s className="ml-1.5 font-normal text-slate">{money(reg)}</s>}
                </span>
                <span className="text-slate">{form.category}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {uniq(variants.map((v) => v.size)).map((sz) => (
                  <span key={sz} className="border border-hairline px-1.5 py-0.5 text-[10px]">{sz}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="text-[11px] uppercase tracking-widest text-slate">SKU {form.sku}</div>
            <h3 className="font-display text-2xl">{form.name}</h3>
            <p className="whitespace-pre-line text-[#444748]">{form.description}</p>
            <p className="pt-2 text-slate">
              <b>Fabric:</b> {form.fabric}<br />
              <b>Care:</b> {form.careInstructions}
            </p>
          </div>
        </div>
      </Modal>

      <Modal open={!!visibilityModal} onClose={() => { setVisibilityModal(null); navigate('/products'); }} maxWidth="max-w-lg">
        {visibilityModal && (
          <div>
            <h3 className="mb-2 font-display text-xl">
              {visibilityModal.visible
                ? 'Saved — live, with notes'
                : 'Saved, but the product is not visible yet'}
            </h3>
            <ul className="list-disc space-y-1.5 pl-5 text-xs">
              {(visibilityModal.reasons || []).map((r, i) => (
                <li key={i} className={r.level === 'error' ? 'text-[#8a1a14]' : 'text-[#7a5a00]'}>
                  {r.level === 'error' ? 'Not visible: ' : 'Check: '}
                  {r.message}
                </li>
              ))}
            </ul>
            {!visibilityModal.visible && (
              <p className="mt-3 text-xs text-slate">Fix the item above and save again.</p>
            )}
            <div className="mt-4 flex gap-2">
              <a
                href={`index.html${visibilityModal.storefrontPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center bg-charcoal px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-white"
              >
                View on storefront
              </a>
              <AdminBtn variant="outline" onClick={() => { setVisibilityModal(null); navigate('/products'); }}>
                OK
              </AdminBtn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
