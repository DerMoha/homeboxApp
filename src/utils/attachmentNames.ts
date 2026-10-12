import {ItemAttachment} from '../types';

/** Recovery markers remain on the server; the UI shows the original filename. */
export const attachmentName = (attachment: ItemAttachment): string => {
  const title = attachment.title || '';
  const original = title.replace(
    /^homebox-mobile-\d+-[a-z0-9]+-\d+-[a-z0-9]+-/i,
    '',
  );
  if (original !== title) {
    return original;
  }
  if (/^homebox-mobile-\d+-[a-z0-9]+\.jpg$/i.test(title)) {
    return 'Item photo';
  }
  return title || (attachment.type === 'photo' ? 'Item photo' : 'Attachment');
};
