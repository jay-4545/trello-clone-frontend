/** Store handle for modules that must not import store.ts (avoids circular deps). */
type StoreLike = { dispatch: (action: unknown) => unknown };

let appStore: StoreLike | null = null;

export function bindAppStore(store: StoreLike): void {
    appStore = store;
}

export function getAppStore(): StoreLike | null {
    return appStore;
}
