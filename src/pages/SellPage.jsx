import { useState, useEffect } from 'react';
import { subscribeProducts, subscribePriceRules, updateProductStock, createSale } from '../lib/firebase';
import { useSeller } from '../lib/sellerContext';
import { useToast } from '../lib/toast';
import { findPrice, formatPrice } from '../lib/priceUtils';
import { Minus, Plus, Search, X, SlidersHorizontal, PackageSearch, Loader2 } from 'lucide-react';

function imgUrl(url) {
  if (!url) return null;
  return url.replace('/upload/', '/upload/w_400,h_400,c_fill,q_auto,f_auto/');
}

function ProductCard({ product, priceRules, seller, toast }) {
  const [busy, setBusy] = useState(false);
  const price = findPrice(priceRules, product.sub_category, product.size);
  const outOfStock = (product.stock || 0) <= 0;
  const lowStock = !outOfStock && product.stock <= 2;

  const handleSell = async () => {
    if (outOfStock || busy) return;
    setBusy(true);
    try {
      await updateProductStock(product.id, (product.stock || 0) - 1);
      await createSale({
        product_id: product.id, product_name: product.name,
        main_category: product.main_category, sub_category: product.sub_category,
        size: product.size, quantity: 1, unit_price: price, total: price,
        seller, type: 'sale',
      });
      toast(`✓ Vendido: ${product.name}`, 'success');
    } catch { toast('Error al registrar venta', 'error'); }
    setBusy(false);
  };

  const handleReturn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await updateProductStock(product.id, (product.stock || 0) + 1);
      await createSale({
        product_id: product.id, product_name: product.name,
        main_category: product.main_category, sub_category: product.sub_category,
        size: product.size, quantity: 1, unit_price: price, total: price,
        seller, type: 'return',
      });
      toast(`↩ Devuelto: ${product.name}`, 'info');
    } catch { toast('Error al registrar devolución', 'error'); }
    setBusy(false);
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(200,0,90,0.1)',
      opacity: outOfStock ? 0.55 : 1,
      boxShadow: outOfStock ? 'none' : '0 2px 12px rgba(200,0,90,0.06)',
      transition: 'all 0.2s',
    }}>
      <div style={{ height: 140, background: 'linear-gradient(135deg,#fce8f1,#f4c0d1)', position: 'relative', overflow: 'hidden' }}>
        {product.image_url
          ? <img src={imgUrl(product.image_url)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>🎨</div>
        }
        <div style={{ position: 'absolute', top: 6, right: 6 }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 50,
            ...(outOfStock
              ? { background: 'rgba(200,0,90,0.85)', color: '#fff' }
              : lowStock
              ? { background: '#fff', color: '#E8006F', border: '1px solid rgba(200,0,90,0.35)' }
              : { background: 'rgba(255,255,255,0.9)', color: '#2d8a55', border: '1px solid rgba(45,138,85,0.3)' })
          }}>
            {outOfStock ? 'Sin stock' : lowStock ? `¡Últ. ${product.stock}!` : `${product.stock} uds`}
          </span>
        </div>
      </div>
      <div style={{ padding: '0.7rem' }}>
        <p style={{ fontWeight: 500, fontSize: '0.82rem', color: 'var(--dark)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--rose)', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.sub_category}{product.size ? ` · ${product.size}` : ''}
        </p>
        {price > 0 && <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--magenta)', marginBottom: '0.6rem' }}>{formatPrice(price)}</p>}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={handleReturn} disabled={busy} title="Devolver"
            style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(200,0,90,0.07)', border: '1px solid rgba(200,0,90,0.18)', color: 'var(--magenta)' }}>
            <Plus size={15} />
          </button>
          <button onClick={handleSell} disabled={outOfStock || busy}
            style={{ flex: 1, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.82rem', fontWeight: 500, color: '#fff',
              ...(outOfStock || busy
                ? { background: 'rgba(200,0,90,0.1)', color: 'var(--blush)', cursor: 'not-allowed' }
                : { background: 'linear-gradient(135deg,#E8006F,#C8005A)', boxShadow: '0 4px 12px rgba(200,0,90,0.25)' })
            }}>
            <Minus size={13} /> Vender
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SellPage() {
  const { seller } = useSeller();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [priceRules, setPriceRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ main: '', sub: '', size: '', search: '', stockOnly: false });

  useEffect(() => {
    const unsub1 = subscribeProducts(p => {
      // Con stock primero, sin stock al fondo, luego alfabético
      const sorted = [...p].sort((a, b) => {
        const sa = (a.stock || 0) > 0 ? 0 : 1;
        const sb = (b.stock || 0) > 0 ? 0 : 1;
        if (sa !== sb) return sa - sb;
        return (a.name || '').localeCompare(b.name || '', 'es');
      });
      setProducts(sorted);
      setLoading(false);
    });
    const unsub2 = subscribePriceRules(setPriceRules);
    return () => { unsub1(); unsub2(); };
  }, []);

  const active = products.filter(p => p.active !== false);
  const mains = [...new Set(active.map(p => p.main_category).filter(Boolean))];
  const subs = [...new Set(active.filter(p => !filters.main || p.main_category === filters.main).map(p => p.sub_category).filter(Boolean))];
  const sizes = [...new Set(
    active
      .filter(p => (!filters.main || p.main_category === filters.main) && (!filters.sub || p.sub_category === filters.sub))
      .map(p => p.size).filter(Boolean)
  )].sort();

  const filtered = active.filter(p => {
    if (filters.main && p.main_category !== filters.main) return false;
    if (filters.sub && p.sub_category !== filters.sub) return false;
    if (filters.size && p.size !== filters.size) return false;
    if (filters.search && !p.name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.stockOnly && (p.stock || 0) <= 0) return false;
    return true;
  });

  const chip = (isActive) => ({
    padding: '0.3rem 0.8rem', borderRadius: 50, fontSize: '0.78rem', cursor: 'pointer',
    border: isActive ? '1px solid var(--magenta)' : '1px solid rgba(200,0,90,0.2)',
    background: isActive ? 'rgba(200,0,90,0.08)' : '#fff',
    color: isActive ? 'var(--magenta)' : 'var(--blush)',
    fontWeight: isActive ? 500 : 400, whiteSpace: 'nowrap', transition: 'all 0.15s',
  });

  const activeCount = [filters.main, filters.sub, filters.size, filters.search, filters.stockOnly].filter(Boolean).length;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '0.75rem' }}>
      <Loader2 size={28} style={{ color: 'var(--hot)', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--blush)', fontSize: '0.9rem' }}>Cargando productos...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.9rem', borderRadius: 50, background: '#fff', border: '1px solid rgba(200,0,90,0.2)' }}>
          <Search size={15} style={{ color: 'var(--magenta)', flexShrink: 0 }} />
          <input placeholder="Buscar producto..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            style={{ flex: 1, outline: 'none', background: 'transparent', fontSize: '0.88rem', color: 'var(--dark)', border: 'none', minWidth: 0 }} />
          {filters.search && <button onClick={() => setFilters(f => ({ ...f, search: '' }))} style={{ color: 'var(--magenta)' }}><X size={13} /></button>}
        </div>
        {activeCount > 0 && (
          <button onClick={() => setFilters({ main: '', sub: '', size: '', search: '', stockOnly: false })}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.8rem', borderRadius: 50, fontSize: '0.78rem', color: 'var(--blush)', border: '1px solid rgba(200,0,90,0.2)', background: '#fff' }}>
            <X size={12} /> ({activeCount})
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', alignItems: 'center' }}>
        <SlidersHorizontal size={13} style={{ color: 'var(--blush)', opacity: 0.6, flexShrink: 0 }} />
        <button style={chip(filters.stockOnly)} onClick={() => setFilters(f => ({ ...f, stockOnly: !f.stockOnly }))}>Con stock</button>
        {mains.map(m => <button key={m} style={chip(filters.main === m)} onClick={() => setFilters(f => ({ ...f, main: f.main === m ? '' : m, sub: '', size: '' }))}>{m}</button>)}
        {filters.main && subs.map(s => <button key={s} style={chip(filters.sub === s)} onClick={() => setFilters(f => ({ ...f, sub: f.sub === s ? '' : s, size: '' }))}>{s}</button>)}
        {sizes.map(s => <button key={s} style={chip(filters.size === s)} onClick={() => setFilters(f => ({ ...f, size: f.size === s ? '' : s }))}>{s}</button>)}
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--blush)', opacity: 0.6 }}>{filtered.length} producto{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0
        ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', color: 'var(--blush)', gap: '0.5rem' }}>
            <PackageSearch size={44} style={{ opacity: 0.35 }} />
            <p style={{ fontWeight: 500 }}>Sin resultados</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Probá ajustando los filtros</p>
          </div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {filtered.map(p => <ProductCard key={p.id} product={p} priceRules={priceRules} seller={seller} toast={toast} />)}
          </div>
      }
    </div>
  );
}
