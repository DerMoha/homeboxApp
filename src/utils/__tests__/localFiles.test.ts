import {safeFileName, localFilePath} from '../localFiles';
it('creates unique disk names that file URLs cannot interpret as percent escapes', () => {
  expect(safeFileName('item:photo')).not.toContain('%');
  expect(safeFileName('a/b')).not.toBe(safeFileName('a~2Fb'));
  expect(safeFileName('a/b')).not.toBe(safeFileName('a_b'));
  expect(decodeURIComponent(safeFileName('draft:a/b'))).toBe(
    safeFileName('draft:a/b'),
  );
});
it('decodes document-picker URLs for native filesystem operations', () => {
  expect(localFilePath('file:///cache/receipt%20copy.pdf')).toBe(
    '/cache/receipt copy.pdf',
  );
  expect(localFilePath('/cache/photo.jpg')).toBe('/cache/photo.jpg');
});
