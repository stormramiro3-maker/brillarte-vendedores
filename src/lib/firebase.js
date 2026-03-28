import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, push, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: "brillarte-vendedores.firebasestorage.app",
  messagingSenderId: "252786958351",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export function subscribeProducts(callback) {
  const r = ref(db, 'products');
  return onValue(r, snap => {
    const val = snap.val() || {};
    const arr = Object.entries(val).map(([id, p]) => ({ id, ...p }));
    callback(arr);
  });
}

export async function updateProductStock(id, newStock) {
  await update(ref(db, `products/${id}`), { stock: newStock });
}

export async function importProducts(products, priceRules) {
  const productsObj = {};
  products.forEach((p, i) => {
    const id = `p${Date.now()}_${i}`;
    productsObj[id] = p;
  });
  const pricesObj = {};
  priceRules.forEach((p, i) => {
    const id = `pr${Date.now()}_${i}`;
    pricesObj[id] = p;
  });
  await set(ref(db, 'products'), productsObj);
  await set(ref(db, 'priceRules'), pricesObj);
}

export async function getProductsOnce() {
  const snap = await get(ref(db, 'products'));
  const val = snap.val() || {};
  return Object.entries(val).map(([id, p]) => ({ id, ...p }));
}

export async function getPriceRulesOnce() {
  const snap = await get(ref(db, 'priceRules'));
  const val = snap.val() || {};
  return Object.values(val);
}

export function subscribePriceRules(callback) {
  const r = ref(db, 'priceRules');
  return onValue(r, snap => {
    const val = snap.val() || {};
    callback(Object.values(val));
  });
}

export function subscribeSales(callback) {
  const r = ref(db, 'sales');
  return onValue(r, snap => {
    const val = snap.val() || {};
    const arr = Object.entries(val).map(([id, s]) => ({ id, ...s }));
    arr.sort((a, b) => b.timestamp - a.timestamp);
    callback(arr);
  });
}

export async function createSale(sale) {
  await push(ref(db, 'sales'), { ...sale, timestamp: Date.now() });
}

export async function clearSales() {
  await set(ref(db, 'sales'), null);
}
