export class DefaultAttrs<T extends Record<string | number | symbol, any>> {
  private _attrs: T
  constructor(attrs: T) {
    this._attrs = attrs
  }
  getAll() {
    return this._attrs
  }
  get<Key extends keyof T>(k: Key) {
    return this._attrs[k]
  }
  set(attrs: Partial<T>) {
    for(const k in attrs) {
      this._attrs[k] = attrs[k]!
    }
  }
}