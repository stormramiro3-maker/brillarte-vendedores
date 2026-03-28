import { useState, useEffect } from 'react';
import { importProducts, getProductsOnce, getPriceRulesOnce, clearSales } from '../lib/firebase';
import { subscribeProducts, subscribePriceRules } from '../lib/firebase';
import { useToast } from '../lib/toast';
import { Upload, Download, Trash2, Loader2, CheckCircle, AlertTriangle, Database, FileSpreadsheet } from 'lucide-react';

function SyncCard({ icon, iconBg, title, description, children }) {
  return (
    <div style={{ borderRadius: 20, padding: '1.2rem', border: '1px solid rgba(200,0,90,0.1)', background: '#fff', boxShadow: '0 2px 12px rgba(200,0,90,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ borderRadius: 12, padding: '0.6rem', background: iconBg, flexShrink: 0 }}>{icon}</div>
        <div>
          <p style={{ fontWeight: 600, color: 'var(--dark)', fontSize: '0.95rem' }}>{title}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--blush)', opacity: 0.75, marginTop: 2 }}>{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function SyncPage() {
  const toast = useToast();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [products, setProducts] = useState([]);
  const [priceRules, setPriceRules] = useState([]);

  useEffect(() => {
    const u1 = subscribeProducts(p => {
      // Con stock primero, sin stock al fondo — igual que la web
      const sorted = [...p].sort((a, b) => {
        const sa = (a.stock || 0) > 0 ? 0 : 1;
        const sb = (b.stock || 0) > 0 ? 0 : 1;
        return sa - sb || (a.name || '').localeCompare(b.name || '');
      });
      setProducts(sorted);
    });
    const u2 = subscribePriceRules(setPriceRules);
    return () => { u1(); u2(); };
  }, []);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { read, utils } = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
      const wb = read(arrayBuffer, { type: 'array' });

      // Hoja productos
      const prodSheet = wb.Sheets['productos'];
      const prodRows = utils.sheet_to_json(prodSheet, { defval: '' });
      const newProducts = prodRows.map(row => ({
        active: String(row['Activo']).toUpperCase() !== 'FALSE',
        main_category: String(row['Main'] || '').trim(),
        sub_category: String(row['Sub'] || '').trim(),
        size: String(row['Size'] || '').trim(),
        name: String(row['Producto'] || '').trim(),
        image_url: String(row['Imagen'] || '').trim(),
        stock: parseInt(row['Stock']) || 0,
        tag1: String(row['Tag 1'] || '').trim(),
        tag2: String(row['Tag 2'] || '').trim(),
        tag3: String(row['Tag 3'] || '').trim(),
        cloudinary_name: String(row['Nombre para Cloudinary'] || '').trim(),
      })).filter(p => p.name);

      // Hoja precios
      const precSheet = wb.Sheets['precios'];
      const precRows = utils.sheet_to_json(precSheet, { defval: '' });
      const newPrices = precRows.map(row => ({
        sub_category: String(row['Sub'] || '').trim(),
        size: String(row['Size'] || '').trim(),
        price: parseFloat(row['Precio']) || 0,
      })).filter(p => p.sub_category);

      await importProducts(newProducts, newPrices);
      setImportResult({ products: newProducts.length, prices: newPrices.length });
      toast(`✓ ${newProducts.length} productos y ${newPrices.length} precios importados`, 'success');
    } catch (err) {
      toast('Error al importar: ' + err.message, 'error');
    }

    setImporting(false);
    e.target.value = '';
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const prods = await getProductsOnce();
      const prices = await getPriceRulesOnce();

      const headers = ['Activo', 'Main', 'Sub', 'Size', 'Producto', 'Imagen', 'Stock', 'Tag 1', 'Tag 2', 'Tag 3', 'Nombre para Cloudinary'];
      const rows = prods.map(p => [
        p.active ? 'TRUE' : 'FALSE',
        p.main_category || '', p.sub_category || '', p.size || '',
        p.name || '', p.image_url || '', p.stock || 0,
        p.tag1 || '', p.tag2 || '', p.tag3 || '', p.cloudinary_name || ''
      ]);

      let csv = '\uFEFF' + headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => {
          const s = String(cell);
          return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(',') + '\n';
      });

      csv += '\n\n--- PRECIOS ---\nSub,Size,Precio\n';
      prices.forEach(pr => { csv += `${pr.sub_category},${pr.size},${pr.price}\n`; });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BrillArteBD_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast('✓ Archivo exportado', 'success');
    } catch (err) {
      toast('Error al exportar', 'error');
    }
    setExporting(false);
  };

  const handleClearSales = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setClearing(true);
    try {
      await clearSales();
      toast('✓ Historial de ventas limpiado', 'success');
    } catch { toast('Error al limpiar', 'error'); }
    setClearing(false);
    setConfirmClear(false);
  };

  const withStock = products.filter(p => (p.stock || 0) > 0).length;
  const noStock = products.filter(p => (p.stock || 0) <= 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--dark)' }}>
        Sincro<span style={{ background: 'linear-gradient(135deg,#C8005A,#E8006F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>nizar</span>
      </h1>

      {/* Import */}
      <SyncCard icon={<Upload size={18} style={{ color: '#C8005A' }} />} iconBg="rgba(200,0,90,0.08)" title="Importar Excel" description="Cargá el .xlsx descargado desde la BD de Google Sheets. Reemplaza todos los productos y precios.">
        <label style={{ display: 'block' }}>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} disabled={importing}
            style={{ width: '100%', fontSize: '0.85rem', color: 'var(--blush)', cursor: 'pointer' }} />
        </label>
        {importing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--blush)' }}>
            <Loader2 size={15} style={{ color: 'var(--hot)', animation: 'spin 1s linear infinite' }} />
            Importando...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {importResult && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.85rem', color: '#2d8a55' }}>
            <CheckCircle size={15} />
            {importResult.products} productos y {importResult.prices} precios importados
          </div>
        )}
      </SyncCard>

      {/* Export */}
      <SyncCard icon={<Download size={18} style={{ color: '#d4900a' }} />} iconBg="rgba(212,144,10,0.1)" title="Exportar datos actuales" description="Descargá el estado actual del stock para pegar en la BD de la web.">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={handleExport} disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 50, fontSize: '0.85rem', fontWeight: 500, background: 'rgba(200,0,90,0.08)', color: 'var(--magenta)', border: '1px solid rgba(200,0,90,0.2)', cursor: 'pointer', transition: 'all 0.2s' }}>
            {exporting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FileSpreadsheet size={14} />}
            Exportar CSV
          </button>
          <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', borderRadius: 50, background: 'rgba(200,0,90,0.06)', color: 'var(--blush)', border: '1px solid rgba(200,0,90,0.15)' }}>
            {products.length} productos
          </span>
        </div>
      </SyncCard>

      {/* DB Status */}
      <SyncCard icon={<Database size={18} style={{ color: 'var(--blush)' }} />} iconBg="rgba(200,0,90,0.06)" title="Estado de la base de datos" description="Información actual del sistema">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          {[
            { label: 'Total productos', value: products.length, color: 'var(--dark)' },
            { label: 'Con stock', value: withStock, color: '#2d8a55' },
            { label: 'Sin stock', value: noStock, color: '#e74c3c' },
            { label: 'Reglas de precio', value: priceRules.length, color: 'var(--dark)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ borderRadius: 12, padding: '0.75rem', background: '#fff9fc', border: '1px solid rgba(200,0,90,0.08)' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--blush)', opacity: 0.7, marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>
      </SyncCard>

      {/* Danger zone */}
      <SyncCard icon={<AlertTriangle size={18} style={{ color: '#e74c3c' }} />} iconBg="rgba(231,76,60,0.08)" title="Zona peligrosa" description="Limpiar historial de ventas al cerrar la feria">
        {confirmClear && (
          <div style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 12, padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#c0392b' }}>
            ⚠️ Esto eliminará todo el historial. ¿Confirmás?
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleClearSales} disabled={clearing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 50, fontSize: '0.85rem', fontWeight: 500, background: 'rgba(231,76,60,0.08)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', cursor: 'pointer', transition: 'all 0.2s' }}>
            {clearing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
            {confirmClear ? 'Confirmar limpieza' : 'Limpiar historial de ventas'}
          </button>
          {confirmClear && (
            <button onClick={() => setConfirmClear(false)}
              style={{ padding: '0.5rem 1rem', borderRadius: 50, fontSize: '0.85rem', color: 'var(--blush)', border: '1px solid rgba(200,0,90,0.2)', cursor: 'pointer' }}>
              Cancelar
            </button>
          )}
        </div>
      </SyncCard>
    </div>
  );
}
