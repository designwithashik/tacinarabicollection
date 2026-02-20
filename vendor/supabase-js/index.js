function buildHeaders(apiKey, extra = {}) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    ...extra,
  };
}

class QueryBuilder {
  constructor(baseUrl, apiKey, table) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.table = table;
    this.filters = [];
    this._method = 'GET';
    this._body = null;
    this._head = false;
    this._count = null;
  }

  select(columns = '*', options = {}) {
    this.columns = columns;
    this._head = options.head === true;
    this._count = options.count || null;
    return this;
  }

  order(column, { ascending = true } = {}) { this.filters.push([`order`, `${column}.${ascending ? 'asc' : 'desc'}`]); return this; }
  eq(column, value) { this.filters.push([column, `eq.${value}`]); return this; }
  lte(column, value) { this.filters.push([column, `lte.${value}`]); return this; }
  maybeSingle() { this._single = true; return this._execute(); }
  delete() { this._method = 'DELETE'; return this; }
  update(payload) { this._method = 'PATCH'; this._body = payload; return this; }
  insert(payload) { this._method = 'POST'; this._body = payload; return this._execute(); }

  then(resolve, reject) { return this._execute().then(resolve, reject); }

  async _execute() {
    const url = new URL(`${this.baseUrl}/rest/v1/${this.table}`);
    if (this.columns) url.searchParams.set('select', this.columns);
    for (const [k,v] of this.filters) url.searchParams.set(k,v);
    const headers = buildHeaders(this.apiKey, { 'Content-Type': 'application/json' });
    if (this._single) headers.Accept = 'application/vnd.pgrst.object+json';
    if (this._count) headers.Prefer = `count=${this._count}`;
    if (this._method === 'POST') headers.Prefer = 'return=representation';
    const res = await fetch(url, {
      method: this._method,
      headers,
      body: this._body ? JSON.stringify(this._body) : undefined,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!res.ok) return { data: null, error: data || new Error('Request failed'), count: null };
    const countHeader = res.headers.get('content-range');
    const count = countHeader ? Number(countHeader.split('/')[1]) : null;
    return { data, error: null, count };
  }
}

function createClient(url, anonKey) {
  return {
    from(table) {
      return new QueryBuilder(url, anonKey, table);
    },
    storage: {
      from(bucket) {
        return {
          async upload(path, file) {
            const endpoint = `${url}/storage/v1/object/${bucket}/${path}`;
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: buildHeaders(anonKey),
              body: file,
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) return { data: null, error: data || new Error('Upload failed') };
            return { data: { path }, error: null };
          },
          getPublicUrl(path) {
            return { data: { publicUrl: `${url}/storage/v1/object/public/${bucket}/${path}` } };
          },
        };
      },
    },
  };
}

module.exports = { createClient };
