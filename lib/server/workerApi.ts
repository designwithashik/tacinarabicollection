const getWorkerBaseUrl = () => {
  const base = process.env.WORKER_API_URL;
  if (!base) throw new Error('Missing WORKER_API_URL');
  return base.replace(/\/$/, '');
};

export const buildWorkerUrl = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getWorkerBaseUrl()}${normalized}`;
};

export const buildWorkerHeaders = (headers?: HeadersInit) => {
  const result = new Headers(headers ?? {});
  const token = process.env.ADMIN_API_TOKEN;
  if (token) result.set('Authorization', `Bearer ${token}`);
  return result;
};
