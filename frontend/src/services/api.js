const BFF_BASE = import.meta.env.PROD ? '/api' : '/api';

async function request(path, options = {}) {
  const url = `${BFF_BASE}/ghl${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || 'Request failed');
  }
  return res.json();
}

export function get(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(qs ? `${path}?${qs}` : path);
}

export function post(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export function put(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function upload(path, formData) {
  const url = `${BFF_BASE}/ghl${path}`;
  return fetch(url, { method: 'POST', body: formData }).then(r => r.json());
}
