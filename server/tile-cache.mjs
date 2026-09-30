/** Bounded process-local LRU. Only complete successful responses are inserted. */
export class TileCache {
  constructor({
    maxBytes = 128 * 1024 * 1024,
    maxEntryBytes = 16 * 1024 * 1024,
    ttl = 3600000,
    now = Date.now,
  } = {}) {
    this.maxBytes = maxBytes;
    this.maxEntryBytes = maxEntryBytes;
    this.ttl = ttl;
    this.now = now;
    this.entries = new Map();
    this.bytes = 0;
  }
  delete(key) {
    const item = this.entries.get(key);
    if (item) this.bytes -= item.body.length;
    this.entries.delete(key);
  }
  get(key) {
    const item = this.entries.get(key);
    if (!item) return undefined;
    if (item.expires <= this.now()) {
      this.delete(key);
      return undefined;
    }
    this.entries.delete(key);
    this.entries.set(key, item);
    return item;
  }
  set(key, body, contentType) {
    if (body.length > this.maxEntryBytes || body.length > this.maxBytes) return;
    this.delete(key);
    while (this.bytes + body.length > this.maxBytes)
      this.delete(this.entries.keys().next().value);
    this.entries.set(key, {
      body,
      contentType,
      expires: this.now() + this.ttl,
    });
    this.bytes += body.length;
  }
}
