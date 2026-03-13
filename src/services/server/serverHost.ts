const HTTP_PROTOCOL = 'http://';
const HTTPS_PROTOCOL = 'https://';

const isIpv4Address = (value: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(value);

export const isPrivateIpv4Address = (value: string) => {
  if (!isIpv4Address(value)) {
    return false;
  }

  const octets = value.split('.').map(Number);

  if (octets.some(octet => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [first, second] = octets;

  return (
    first === 10 ||
    first === 127 ||
    (first === 192 && second === 168) ||
    (first === 172 && second >= 16 && second <= 31)
  );
};

export const isPrivateHost = (hostname: string) => {
  const normalizedHost = hostname.toLowerCase();

  return (
    normalizedHost === 'localhost' ||
    normalizedHost === '::1' ||
    normalizedHost === '[::1]' ||
    normalizedHost.endsWith('.local') ||
    isPrivateIpv4Address(normalizedHost) ||
    !normalizedHost.includes('.')
  );
};

export const extractHostname = (input: string) => {
  try {
    return new URL(`${HTTP_PROTOCOL}${input}`).hostname;
  } catch {
    return '';
  }
};

export const normalizeServerHost = (input: string) => {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    throw new Error('Please enter a server address');
  }

  const hasExplicitProtocol = /^https?:\/\//i.test(trimmedInput);
  const hostname = hasExplicitProtocol
    ? new URL(trimmedInput).hostname
    : extractHostname(trimmedInput);

  const baseUrl = hasExplicitProtocol
    ? trimmedInput
    : `${
        isPrivateHost(hostname) ? HTTP_PROTOCOL : HTTPS_PROTOCOL
      }${trimmedInput}`;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new Error('Please enter a valid server address');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Server address must use http or https');
  }

  if (parsedUrl.protocol === 'http:' && !isPrivateHost(parsedUrl.hostname)) {
    throw new Error('HTTP is only supported for local or private servers');
  }

  const normalizedPath = parsedUrl.pathname === '/' ? '' : parsedUrl.pathname;
  return `${parsedUrl.protocol}//${parsedUrl.host}${normalizedPath}`.replace(
    /\/+$/,
    '',
  );
};
