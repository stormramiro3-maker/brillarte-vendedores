import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SellerProvider, useSeller } from './lib/sellerContext';
import { ToastProvider } from './lib/toast';
import SellerPicker from './components/SellerPicker';
import AppLayout from './components/AppLayout';
import SellPage from './pages/SellPage';
import SalesPage from './pages/SalesPage';
import SyncPage from './pages/SyncPage';

function SellerGate() {
  const { seller } = useSeller();
  if (!seller) return <SellerPicker />;
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<SellPage />} />
        <Route path="/ventas" element={<SalesPage />} />
        <Route path="/sync" element={<SyncPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <SellerProvider>
      <ToastProvider>
        <BrowserRouter>
          <SellerGate />
        </BrowserRouter>
      </ToastProvider>
    </SellerProvider>
  );
}
