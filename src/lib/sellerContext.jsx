import { createContext, useContext, useState } from 'react';

const SellerContext = createContext(null);

export function SellerProvider({ children }) {
  const [seller, setSeller] = useState(() => localStorage.getItem('brillarte_seller') || '');

  const selectSeller = (name) => {
    localStorage.setItem('brillarte_seller', name);
    setSeller(name);
  };

  const clearSeller = () => {
    localStorage.removeItem('brillarte_seller');
    setSeller('');
  };

  return (
    <SellerContext.Provider value={{ seller, selectSeller, clearSeller }}>
      {children}
    </SellerContext.Provider>
  );
}

export function useSeller() {
  return useContext(SellerContext);
}
