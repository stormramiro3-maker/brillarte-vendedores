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
      <div onClick={() => setOpen(o => !o)
