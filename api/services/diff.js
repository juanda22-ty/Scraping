function _indexById(products) {
  return products.reduce((acc, item) => {
    if (item.id) acc[item.id] = item;
    return acc;
  }, {});
}

function compareSnapshots(previous = [], current = []) {
  const oldMap = _indexById(previous);
  const newMap = _indexById(current);
  const changes = [];

  for (const product of current) {
    const existing = oldMap[product.id];
    if (!existing) {
      changes.push({ type: 'new', productId: product.id, title: product.title });
      continue;
    }

    if (existing.price !== product.price) {
      const diff = product.price - existing.price;
      const percent = existing.price ? (diff / existing.price) * 100 : 0;
      changes.push({
        type: 'price',
        productId: product.id,
        title: product.title,
        oldPrice: existing.price,
        newPrice: product.price,
        change: parseFloat(percent.toFixed(2)),
      });
    }
  }

  for (const product of previous) {
    if (!newMap[product.id]) {
      changes.push({ type: 'removed', productId: product.id, title: product.title });
    }
  }

  return changes;
}

module.exports = {
  compareSnapshots,
};
