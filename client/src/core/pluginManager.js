/**
 * PluginManager — register/unregister plugins against the EventBus.
 * Plugin contract: { name: string, init(eventBus): void, destroy(eventBus): void }
 */
class PluginManager {
  constructor(eventBus) {
    this._eventBus = eventBus;
    this._plugins = new Map();
  }

  register(plugin) {
    if (!plugin?.name) return;
    if (this._plugins.has(plugin.name)) return;
    this._plugins.set(plugin.name, plugin);
    plugin.init(this._eventBus);
  }

  unregister(pluginName) {
    const plugin = this._plugins.get(pluginName);
    if (!plugin) return;
    plugin.destroy(this._eventBus);
    this._plugins.delete(pluginName);
  }

  unregisterAll() {
    for (const name of this._plugins.keys()) {
      this.unregister(name);
    }
  }
}

export default PluginManager;
