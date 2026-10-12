import {attachmentName} from '../attachmentNames';
it('hides retry markers while preserving user titles and original document names', () => {
  expect(
    attachmentName({
      id: '1',
      type: 'photo',
      title: 'homebox-mobile-1791838233658-e04lzpzkhx.jpg',
    }),
  ).toBe('Item photo');
  expect(
    attachmentName({
      id: '2',
      title:
        'homebox-mobile-1791838233658-abc123-1791838233000-def456-receipt.pdf',
    }),
  ).toBe('receipt.pdf');
  expect(attachmentName({id: '3', title: 'Serial number'})).toBe(
    'Serial number',
  );
  expect(attachmentName({id: '4'})).toBe('Attachment');
});
