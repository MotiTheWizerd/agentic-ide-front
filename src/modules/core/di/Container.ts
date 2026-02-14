/**
 * Lightweight DI container — typed, lazy, singleton-scoped.
 *
 * Design decisions:
 *  - Factory-based registration: each service is created via a factory that
 *    receives the container, enabling proper constructor injection.
 *  - Lazy singletons: instances are created on first resolve(), cached forever.
 *  - No decorators / reflect-metadata — works cleanly with Next.js + React.
 *  - ~40 lines of code: simple enough to debug, powerful enough to wire a full app.
 *
 * Usage:
 *   const c = new Container();
 *   c.register(TOKENS.EventBus, () => new EventBus<EventMap>());
 *   c.register(TOKENS.AutoSave, (c) => new AutoSaveManager(c.resolve(TOKENS.EventBus)));
 *   const bus = c.resolve<EventBus<EventMap>>(TOKENS.EventBus);
 */

export type Factory<T> = (container: Container) => T;

export class Container {
  private factories = new Map<symbol, Factory<unknown>>();
  private instances = new Map<symbol, unknown>();

  /**
   * Register a service factory.
   * The factory is called lazily on the first resolve() and cached as a singleton.
   */
  register<T>(token: symbol, factory: Factory<T>): this {
    this.factories.set(token, factory as Factory<unknown>);
    // Invalidate cached instance if re-registering (useful for tests)
    this.instances.delete(token);
    return this;
  }

  /**
   * Resolve a service by token.
   * Creates the instance on first call via the registered factory, then returns
   * the cached singleton on subsequent calls.
   */
  resolve<T>(token: symbol): T {
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(
        `[DI] No registration found for ${token.toString()}. ` +
        `Did you forget to register it in bootstrap()?`
      );
    }

    const instance = factory(this) as T;
    this.instances.set(token, instance);
    return instance;
  }

  /** Check whether a token has been registered. */
  has(token: symbol): boolean {
    return this.factories.has(token);
  }

  /** Tear down: clear all instances and factories. */
  dispose(): void {
    this.instances.clear();
    this.factories.clear();
  }
}
