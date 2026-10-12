/** Keep disk names safe in file:// URLs without percent escape ambiguity. */
export const safeFileName = (value: string) =>
  encodeURIComponent(value).replace(/~/g, '~~').replace(/%/g, '~');

/** Native document pickers may return escaped file URLs, while FS expects a path. */
export const localFilePath = (uri: string) => {
  if (!uri.startsWith('file://')) {
    return uri;
  }
  return decodeURIComponent(uri.slice(7));
};
