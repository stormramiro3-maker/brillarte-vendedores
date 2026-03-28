import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSeller } from '../lib/sellerContext';
import { ShoppingBag, BarChart3, RefreshCw, LogOut } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Vender', icon: ShoppingBag },
  { path: '/ventas', label: 'Ventas', icon: BarChart3 },
  { path: '/sync', label: 'Sync', icon: RefreshCw },
];

export default function AppLayout() {
  const { seller, clearSeller } = useSeller();
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Desktop header */}
      <header style={{ display: 'none', position: 'sticky', top: 0, zIndex: 50, height: 56, padding: '0 1.5rem', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(200,0,90,0.12)' }}
        className="desktop-header">
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 900, color: 'var(--dark)' }}>
          Brill<span style={{ color: 'var(--hot)' }}>Arte</span>
        </span>
        <nav style={{ display: 'flex', gap: '0.4rem' }}>
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 1rem', borderRadius: 50, fontSize: '0.85rem', fontWeight: 500,
                  transition: 'all 0.2s',
                  ...(active
                    ? { background: 'linear-gradient(135deg,#E8006F,#C8005A)', color: '#fff', boxShadow: '0 4px 14px rgba(200,0,90,0.25)' }
                    : { color: 'var(--blush)', border: '1.5px solid rgba(200,0,90,0.2)', background: 'transparent' })
                }}>
                  <item.icon size={14} />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 500, padding: '0.3rem 0.8rem', borderRadius: 50, background: 'rgba(200,0,90,0.08)', color: 'var(--magenta)', border: '1px solid rgba(200,0,90,0.2)' }}>
            {seller}
          </span>
          <button onClick={clearSeller} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', padding: '0.3rem 0.8rem', borderRadius: 50, color: 'var(--blush)', border: '1px solid rgba(200,0,90,0.2)', transition: 'all 0.2s' }}>
            <LogOut size={13} /> Cambiar
          </button>
        </div>
      </header>

      {/* Mobile header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 48, padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(200,0,90,0.12)' }}
        className="mobile-header">
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--dark)' }}>
          Brill<span style={{ color: 'var(--hot)' }}>Arte</span>
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.25rem 0.7rem', borderRadius: 50, background: 'rgba(200,0,90,0.08)', color: 'var(--magenta)', border: '1px solid rgba(200,0,90,0.2)' }}>
          {seller}
        </span>
      </header>

      {/* Content */}
      <main style={{ flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto', padding: '1rem 0.75rem 6rem', boxSizing: 'border-box' }}>
        <Outlet />
      </main>

      {/* Bottom nav mobile */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, display: 'flex', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(200,0,90,0.12)' }}
        className="bottom-nav">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{ flex: 1, textDecoration: 'none' }}>
              <button style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '0.6rem 0', color: active ? 'var(--hot)' : 'var(--blush)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <item.icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>{item.label}</span>
              </button>
            </Link>
          );
        })}
        <button onClick={clearSeller} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '0.6rem 0', color: 'var(--blush)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <LogOut size={20} strokeWidth={1.75} />
          <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>Salir</span>
        </button>
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .desktop-header { display: flex !important; }
          .mobile-header { display: none !important; }
          .bottom-nav { display: none !important; }
          main { padding: 1.5rem 1.5rem 2rem !important; }
        }
      `}</style>
    </div>
  );
}
