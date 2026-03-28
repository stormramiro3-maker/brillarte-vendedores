export function findPrice(priceRules, subCategory, size) {
  if (!priceRules || !subCategory) return 0;
  const rule = priceRules.find(r =>
    r.sub_category === subCategory && (r.size === size || (!size && !r.size))
  );
  return rule ? (rule.price || 0) : 0;
}

export function formatPrice(amount) {
  if (!amount && amount !== 0) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}
