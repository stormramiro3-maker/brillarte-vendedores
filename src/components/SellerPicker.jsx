import { useState } from 'react';
import { useSeller } from '../lib/sellerContext';
import { UserPlus } from 'lucide-react';

export default function SellerPicker() {
  const { selectSeller } = useSeller();
  const [name, setName] = useState('');

  const enter = () => { if (name.trim()) selectSeller(name.trim()); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, background: '#f4c0d1', opacity: 0.45, filter: 'blur(100px)', top: -100, left: -150, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', width: 380, height: 380, background: '#ed93b1', opacity: 0.3, filter: 'blur(100px)', bottom: -80, right: -100, borderRadius: '50%' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-block', padding: '0.4rem 1.1rem', borderRadius: 50, fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(200,0,90,0.08)', border: '1px solid rgba(200,0,90,0.2)', color: 'var(--magenta)', marginBottom: '1rem' }}>
            ✦ Panel de Vendedores ✦
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 900, color: 'var(--dark)', lineHeight: 1.1, marginBottom: '0.5rem' }}>
            Brill<span style={{ background: 'linear-gradient(135deg,#C8005A,#E8006F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Arte</span>
          </h1>
          <p style={{ color: 'var(--blush)', fontSize: '0.9rem' }}>Ingresá tu nombre para comenzar</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '2rem', border: '1px solid rgba(200,0,90,0.12)', boxShadow: '0 12px 40px rgba(200,0,90,0.1)' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--blush)', marginBottom: '0.5rem' }}>
            Tu nombre
          </label>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <input
              placeholder="Ej: Ramiro, Sofi..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enter()}
              autoFocus
              style={{
                flex: 1, padding: '0.75rem 1rem', borderRadius: 12, fontSize: '0.95rem',
                outline: 'none', border: '1.5px solid rgba(200,0,90,0.2)',
                color: 'var(--dark)', background: '#fff', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(200,0,90,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(200,0,90,0.2)'}
            />
            <button
              onClick={enter}
              disabled={!name.trim()}
              className="btn-magenta"
              style={{ padding: '0.75rem 1rem', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 500 }}
            >
              <UserPlus size={16} />
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
