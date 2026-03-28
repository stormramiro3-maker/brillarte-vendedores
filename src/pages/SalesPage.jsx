import { useState, useEffect } from 'react';
import { subscribeSales } from '../lib/firebase';
import { formatPrice } from '../lib/priceUtils';
import { DollarSign, ShoppingBag, TrendingUp, RotateCcw, Loader2 } from 'lucide-react';

function fmt(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellerFilter, setSellerFilter] = useState('all');

  useEffect(() => {
    const unsub = subscribeSales(s => { setSales(s); setLoading(false); });
    return unsub;
  }, []);

  const sellers = [...new Set(sales.map(s => s.seller).filter(Boolean))];
  const filtered = sellerFilter === 'all' ? sales : sales.filter(s => s.seller === sellerFilter);

  const totalSales = filtered.filter(s => s.type === 'sale');
  const totalReturns = filtered.filter(s => s.type === 'return');
  const totalRevenue = totalSales.reduce((s, x) => s + (x.total || 0), 0) - totalReturns.reduce((s, x) => s + (x.total || 0), 0);
  const totalUnits = totalSales.reduce((s, x) => s + (x.quantity || 0), 0) - totalReturns.reduce((s, x) => s + (x.quantity || 0), 0);

  const statCard = (icon, label, value, color) => (
    <div style={{ borderRadius: 16, padding: '0.9rem 1rem', background: '#fff', border: '1px solid rgba(200,0,90,0.1)', boxShadow: '0 2px 12px rgba(200,0,90,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ borderRadius: 12, padding: '0.5rem', background: `${color}18` }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.72rem', color: 'var(--blush)' }}>{label}</p>
        <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--dark)' }}>{value}</p>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
      <Loader2 size={28} style={{ color: 'var(--hot)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--dark)' }}>
          Registro de <span style={{ background: 'linear-gradient(135deg,#C8005A,#E8006F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ventas</span>
        </h1>
        <select value={sellerFilter} onChange={e => setSellerFilter(e.target.value)}
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', borderRadius: 50, outline: 'none', background: '#fff', border: '1px solid rgba(200,0,90,0.2)', color: 'var(--blush)', fontFamily: 'var(--font-body)' }}>
          <option value="all">Todos los vendedores</option>
          {sellers.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
        {statCard(<DollarSign size={18} style={{ color: '#C8005A' }} />, 'Ingresos netos', formatPrice(totalRevenue), '#C8005A')}
        {statCard(<ShoppingBag size={18} style={{ color: '#2d8a55' }} />, 'Ventas', totalSales.length, '#2d8a55')}
        {statCard(<TrendingUp size={18} style={{ color: '#d4900a' }} />, 'Unidades', totalUnits, '#d4900a')}
        {statCard(<RotateCcw size={18} style={{ color: '#e74c3c' }} />, 'Devoluciones', totalReturns.length, '#e74c3c')}
      </div>

      {/* Table */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(200,0,90,0.1)', background: '#fff', boxShadow: '0 2px 12px rgba(200,0,90,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#fff9fc', borderBottom: '1px solid rgba(200,0,90,0.08)' }}>
                {['Hora', 'Producto', 'Tipo', 'Detalle', 'Vendedor', 'Monto'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.72rem', fontWeight: 600, color: 'var(--blush)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--blush)', opacity: 0.5, fontSize: '0.85rem' }}>No hay ventas registradas aún</td></tr>
                : filtered.map(sale => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid rgba(200,0,90,0.06)' }}>
                    <td style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--blush)' }}>{fmt(sale.timestamp)}</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 500, color: 'var(--dark)' }}>{sale.product_name}</td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 50,
                        ...(sale.type === 'sale'
                          ? { background: 'rgba(200,0,90,0.08)', color: '#C8005A', border: '1px solid rgba(200,0,90,0.2)' }
                          : { background: 'rgba(231,76,60,0.08)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)' })
                      }}>
                        {sale.type === 'sale' ? 'Venta' : 'Devolución'}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', fontSize: '0.78rem', color: 'var(--rose)' }}>{sale.sub_category}{sale.size ? ` · ${sale.size}` : ''}</td>
                    <td style={{ padding: '0.65rem 1rem', fontSize: '0.82rem', color: 'var(--dark)' }}>{sale.seller}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600, color: sale.type === 'return' ? '#e74c3c' : 'var(--magenta)' }}>
                      {sale.type === 'return' ? '-' : ''}{formatPrice(sale.total || 0)}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
