import api from "@/lib/api";

export interface ComponentItem {
  type: string;
  name: string;
  category: string;
  icon: string;
  color: string;
}

export interface ComponentGroup {
  category: string;
  items: ComponentItem[];
}

export class ComponentService {
  private _components: ComponentItem[] = [];
  private _groups: ComponentGroup[] = [];

  get components(): ComponentItem[] {
    return this._components;
  }

  get groups(): ComponentGroup[] {
    return this._groups;
  }

  /** Fetch components from the backend and group by category. */
  async fetchComponents(): Promise<void> {
    const res = await api.post("/components/get-components");
    this._components = res.data ?? [];
    this._groups = this.groupByCategory(this._components);
  }

  /** Reset to initial state. */
  reset(): void {
    this._components = [];
    this._groups = [];
  }

  private groupByCategory(items: ComponentItem[]): ComponentGroup[] {
    const map = new Map<string, ComponentItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map, ([category, items]) => ({ category, items }));
  }
}
