import type { Context } from '../../context'
import type { StandardHandlerPlugin } from '../standard'
import type { NodeHttpHandlerOptions } from './handler'
import { CompositeStandardHandlerPlugin } from '../standard'

/**
 * Node.js HTTP 处理器插件接口。
 * 继承自标准的处理器插件 `StandardHandlerPlugin`。
 * 增加了 Node.js 适配器特有的生命周期钩子。
 */
export interface NodeHttpHandlerPlugin<T extends Context> extends StandardHandlerPlugin<T> {
  /**
   * 初始化运行时适配器。
   * 这个可选的钩子方法在 `NodeHttpHandler` 构造函数中被调用，
   * 时机在所有插件被组合之后，但在 `NodeHttpHandler` 的其他属性（如拦截器、响应选项）被最终确定之前。
   *
   * 用途：
   * 允许插件在运行时访问并可能修改传递给 `NodeHttpHandler` 的初始选项 `NodeHttpHandlerOptions`。
   * 例如，一个插件可以通过这个方法添加默认的 HTTP Headers 到 `options` 对象中，
   * 这些 Headers 将在后续通过 `sendStandardResponse` 发送响应时被使用。
   *
   * @param options 传递给 `NodeHttpHandler` 构造函数的选项对象 (可能已被其他插件修改)。
   */
  initRuntimeAdapter?(options: NodeHttpHandlerOptions<T>): void
}

/**
 * 组合 Node.js HTTP 处理器插件。
 * 这是一个管理一组 `NodeHttpHandlerPlugin` 实例的工具类。
 * 它继承自 `CompositeStandardHandlerPlugin`，并实现了 `NodeHttpHandlerPlugin` 接口。
 * 主要目的是按顺序调用其包含的所有插件的生命周期钩子。
 */
export class CompositeNodeHttpHandlerPlugin<T extends Context, TPlugin extends NodeHttpHandlerPlugin<T>>
  extends CompositeStandardHandlerPlugin<T, TPlugin> implements NodeHttpHandlerPlugin<T> {
  /**
   * 按顺序调用所有已注册插件的 `initRuntimeAdapter` 方法。
   * @param options 传递给 `NodeHttpHandler` 构造函数的选项对象。
   */
  initRuntimeAdapter(options: NodeHttpHandlerOptions<T>): void {
    // 遍历内部存储的所有插件
    for (const plugin of this.plugins) {
      // 如果插件实现了 initRuntimeAdapter 方法，则调用它
      // 使用可选链操作符 `?.` 来安全调用，因为该方法是可选的
      plugin.initRuntimeAdapter?.(options)
    }
  }
}
