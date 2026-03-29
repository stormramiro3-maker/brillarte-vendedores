import { useState, useEffect } from 'react';
import { subscribeProducts, subscribePriceRules, updateProductStock, createSale } from '../lib/firebase';
import { useSeller } from '../lib/sellerContext';
import { useToast } from '../lib/toast';
import { findPrice, formatPrice } from '../lib/priceUtils';
import { Minus, Plus, Search, X, SlidersHorizontal, PackageSearch, Loader2, ChevronDown } from 'lucide-react';

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

function FSection({ label, items, selected, onToggle }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: '1px solid rgba(200,0,90,0.07)' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.5rem', cursor: 'pointer', userSelect: 'none' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,0,90,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--dark)' }}>{label}</span>
        <ChevronDown size={14} style={{ color: 'var(--blush)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </div>
      {open && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.2rem 1.5rem 0.9rem' }}>
          {items.map(item => {
            const active = selected.includes(item);
            return (
              <button key={item} onClick={() => onToggle(item)}
                style={{
                  padding: '0.28rem 0.85rem', borderRadius: 50, fontSize: '0.82rem', cursor: 'pointer',
                  border: active ? '1.5px solid var(--magenta)' : '1px solid rgba(200,0,90,0.2)',
                  background: active ? 'rgba(200,0,90,0.08)' : '#fff',
                  color: active ? 'var(--magenta)' : 'var(--blush)',
                  fontWeight: active ? 500 : 400, transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                }}>
                {item}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActiveChip({ label, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.25rem 0.7rem 0.25rem 0.85rem', borderRadius: 50, fontSize: '0.78rem',
      background: 'rgba(200,0,90,0.08)', color: 'var(--magenta)',
      border: '1px solid rgba(200,0,90,0.25)', fontWeight: 500,
    }}>
      {label}
      <button onClick={onRemove} style={{ color: 'var(--magenta)', display: 'flex', alignItems: 'center', padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}>
        <X size={11} />
      </button>
    </span>
  );
}

export default function SellPage() {
  const { seller } = useSeller();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [priceRules, setPriceRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [fSubs, setFSubs] = useState([]);
  const [fSizes, setFSizes] = useState([]);
  const [fStock, setFStock] = useState(false);

  useEffect(() => {
    const u1 = subscribeProducts(p => {
      const sorted = [...p].sort((a, b) => {
        const sa = (a.stock || 0) > 0 ? 0 : 1;
        const sb = (b.stock || 0) > 0 ? 0 : 1;
        if (sa !== sb) return sa - sb;
        return (a.name || '').localeCompare(b.name || '', 'es');
      });
      setProducts(sorted);
      setLoading(false);
    });
    const u2 = subscribePriceRules(setPriceRules);
    return () => { u1(); u2(); };
  }, []);

  const allSubs = [...new Set(products.map(p => p.sub_category).filter(Boolean))].sort();
  const allSizes = [...new Set(
    products.filter(p => fSubs.length === 0 || fSubs.includes(p.sub_category)).map(p => p.size).filter(Boolean)
  )].sort();

  const toggleSub = v => setFSubs(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]);
  const toggleSize = v => setFSizes(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]);

  const filtered = products.filter(p => {
    if (fSubs.length > 0 && !fSubs.includes(p.sub_category)) return false;
    if (fSizes.length > 0 && !fSizes.includes(p.size)) return false;
    if (fStock === true && (p.stock || 0) <= 0) return false;
    if (fStock === 'sin' && (p.stock || 0) > 0) return false;
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = fSubs.length + fSizes.length + (fStock !== false ? 1 : 0);
  const clearAll = () => { setFSubs([]); setFSizes([]); setFStock(false); };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '0.75rem' }}>
      <Loader2 size={28} style={{ color: 'var(--hot)', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--blush)', fontSize: '0.9rem' }}>Cargando productos...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Search + Filtrar */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.9rem', borderRadius: 50, background: '#fff', border: '1px solid rgba(200,0,90,0.2)' }}>
          <Search size={15} style={{ color: 'var(--magenta)', flexShrink: 0 }} />
          <input placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, outline: 'none', background: 'transparent', fontSize: '0.88rem', color: 'var(--dark)', border: 'none', minWidth: 0, fontFamily: 'var(--font-body)' }} />
          {search && <button onClick={() => setSearch('')} style={{ color: 'var(--magenta)', display: 'flex' }}><X size={13} /></button>}
        </div>
        <button onClick={() => setPanelOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0 1.1rem', height: 38, borderRadius: 50,
            fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', flexShrink: 0,
            transition: 'all 0.15s',
            background: activeCount > 0 ? 'rgba(200,0,90,0.06)' : '#fff',
            border: activeCount > 0 ? '1px solid var(--magenta)' : '1px solid rgba(200,0,90,0.2)',
            color: activeCount > 0 ? 'var(--magenta)' : 'var(--blush)',
          }}>
          <SlidersHorizontal size={14} />
          Filtrar{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
      </div>

      {/* Active chips */}
      {activeCount > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          {fStock === true && <ActiveChip label="Con stock" onRemove={() => setFStock(false)} />}
          {fStock === 'sin' && <ActiveChip label="Sin stock" onRemove={() => setFStock(false)} />}
          {fSubs.map(s => <ActiveChip key={s} label={s} onRemove={() => toggleSub(s)} />)}
          {fSizes.map(s => <ActiveChip key={s} label={s} onRemove={() => toggleSize(s)} />)}
          <button onClick={clearAll}
            style={{ fontSize: '0.78rem', color: 'var(--blush)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.4rem', fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>
            Limpiar todo
          </button>
        </div>
      )}

      <p style={{ fontSize: '0.75rem', color: 'var(--blush)', opacity: 0.6 }}>
        {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
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

      {/* Overlay */}
      <div onClick={() => setPanelOpen(false)} style={{
        position: 'fixed', inset: 0, background: 'rgba(42,0,24,0.4)', zIndex: 350,
        backdropFilter: 'blur(3px)', opacity: panelOpen ? 1 : 0,
        pointerEvents: panelOpen ? 'all' : 'none', transition: 'opacity 0.2s',
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 320, maxWidth: '92vw',
        background: '#fff', zIndex: 351, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(200,0,90,0.1)',
        transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s',
      }}>
        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(200,0,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)' }}>Filtros</span>
          <button onClick={() => setPanelOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--blush)', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Stock */}
          <div style={{ borderBottom: '1px solid rgba(200,0,90,0.07)', padding: '0.9rem 1.5rem' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--dark)', marginBottom: '0.6rem' }}>Stock</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[{ id: false, label: 'Todos' }, { id: true, label: '✓ Con stock' }, { id: 'sin', label: '✗ Sin stock' }].map(opt => {
                const active = fStock === opt.id;
                return (
                  <button key={String(opt.id)} onClick={() => setFStock(opt.id)}
                    style={{
                      padding: '0.28rem 0.85rem', borderRadius: 50, fontSize: '0.82rem', cursor: 'pointer',
                      border: active ? '1.5px solid var(--magenta)' : '1px solid rgba(200,0,90,0.2)',
                      background: active ? 'rgba(200,0,90,0.08)' : '#fff',
                      color: active ? 'var(--magenta)' : 'var(--blush)',
                      fontWeight: active ? 500 : 400, transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                    }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <FSection label="Subcategoría" items={allSubs} selected={fSubs} onToggle={toggleSub} />
          {allSizes.length > 0 && <FSection label="Tamaño" items={allSizes} selected={fSizes} onToggle={toggleSize} />}
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(200,0,90,0.1)', flexShrink: 0 }}>
          <button onClick={() => setPanelOpen(false)}
            style={{ width: '100%', padding: '0.8rem', background: 'linear-gradient(135deg,var(--hot),var(--magenta))', border: 'none', borderRadius: 12, color: '#fff', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Ver {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
