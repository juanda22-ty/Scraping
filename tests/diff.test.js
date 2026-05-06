const { compareSnapshots } = require('../api/services/diff');
const snapshotA = require('../fixtures/snapshot-ayer.json');
const snapshotB = require('../fixtures/snapshot-hoy.json');

describe('compareSnapshots', () => {
  test('detects price decrease', () => {
    const changes = compareSnapshots(snapshotA, snapshotB);
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'price', productId: 'product-1' }),
      ])
    );
  });

  test('detects new product', () => {
    const changes = compareSnapshots(snapshotA, snapshotB);
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'new', productId: 'product-3' }),
      ])
    );
  });

  test('detects removed product', () => {
    const changes = compareSnapshots(snapshotA, snapshotB);
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'removed', productId: 'product-2' }),
      ])
    );
  });

  test('returns no changes for identical snapshots', () => {
    const changes = compareSnapshots(snapshotA, snapshotA);
    expect(changes).toHaveLength(0);
  });

  test('handles first snapshot without previous data', () => {
    const changes = compareSnapshots([], snapshotA);
    expect(changes.every((item) => item.type === 'new')).toBe(true);
  });
});
