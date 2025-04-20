/**
 * @fileoverview
 * 这个文件定义了 oRPC Fetch 适配器的插件接口和复合插件实现。
 * 插件允许开发者扩展或修改 Fetch 适配器的行为。
 */

import type { Context } from '../../context'
import type { StandardHandlerPlugin } from '../standard'
import type { FetchHandlerOptions } from './handler'
import { CompositeStandardHandlerPlugin } from '../standard'

/**
 * Fetch 适配器插件接口。
 *
 * 这个接口继承了标准的 `StandardHandlerPlugin`，并添加了 Fetch 适配器特有的生命周期钩子。
 * 插件可以实现这个接口来扩展或修改 `FetchHandler` 的行为。
 *
 * @template T - 上下文 (Context) 类型。
 */
export interface FetchHandlerPlugin<T extends Context> extends StandardHandlerPlugin<T> {
  /**
   * 初始化运行时适配器选项的钩子函数 (可选)。
   *
   * 这个方法会在 `FetchHandler` 实例创建时被调用，允许插件在运行时修改或增强
   * `FetchHandler` 的配置选项 (`FetchHandlerOptions`)。
   * 例如，插件可以在这里添加默认的拦截器、修改响应转换逻辑等。
   *
   * @param options - 传递给 `FetchHandler` 构造函数的选项对象，插件可以对其进行修改。
   */
  initRuntimeAdapter?(options: FetchHandlerOptions<T>): void
}

/**
 * 复合 Fetch 适配器插件。
 *
 * 这个类用于管理一个或多个 `FetchHandlerPlugin` 实例。
 * 它继承了 `CompositeStandardHandlerPlugin` 的能力，可以聚合多个标准插件的功能，
 * 并额外实现了 `FetchHandlerPlugin` 接口，以处理 Fetch 特有的 `initRuntimeAdapter` 钩子。
 *
 * 当 `FetchHandler` 初始化时，它会使用这个复合插件来调用所有注册插件的 `initRuntimeAdapter` 方法。
 *
 * @template T - 上下文 (Context) 类型。
 * @template TPlugin - 具体的插件类型，必须是 `FetchHandlerPlugin<T>` 的子类型。
 */
export class CompositeFetchHandlerPlugin<T extends Context, TPlugin extends FetchHandlerPlugin<T>>
  extends CompositeStandardHandlerPlugin<T, TPlugin> implements FetchHandlerPlugin<T> {
  /**
   * 实现 `initRuntimeAdapter` 方法。
   * 它会遍历内部存储的所有插件，并依次调用它们各自的 `initRuntimeAdapter` 方法 (如果插件实现了该方法)。
   *
   * @param options - 传递给 `FetchHandler` 构造函数的选项对象。
   */
  initRuntimeAdapter(options: FetchHandlerOptions<T>): void {
    // 遍历所有内部插件
    for (const plugin of this.plugins) {
      // 如果插件实现了 initRuntimeAdapter 方法，则调用它
      plugin.initRuntimeAdapter?.(options)
    }
  }
}
