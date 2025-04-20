import type { AnySchema, ErrorMap, Meta } from '@orpc/contract'
import type { MaybeOptionalOptions, Promisable } from '@orpc/shared'
import type { Context } from './context'
import type { ORPCErrorConstructorMap } from './error'
import type { Procedure } from './procedure'

/**
 * 中间件执行的结果类型。
 * 中间件是 oRPC 处理请求过程中的一个环节，可以想象成流水线上的一个工人。
 * 这个工人处理完后，会产生一个输出，并且可能会给下一个工人传递一些额外的信息（上下文）。
 *
 * @template TOutContext - 输出的上下文类型。上下文就像是工人之间传递的小纸条，记录着处理过程中的信息。
 * @template TOutput - 中间件处理后的最终输出类型。
 */
export type MiddlewareResult<TOutContext extends Context, TOutput> = Promisable<{
  /**
   * 中间件处理产生的最终输出数据。
   * 比如，一个查询用户信息的 API，它的 output 可能就是用户的详细信息对象。
   */
  output: TOutput
  /**
   * 中间件处理后向下传递的上下文信息。
   * 这个上下文会被合并到后续中间件或最终处理函数的 `context` 参数中。
   * 比如，一个身份验证中间件，处理完后可以在 context 里放上当前登录用户的信息，供后续环节使用。
   */
  context: TOutContext
}> // Promisable 表示这个结果可能是同步返回的，也可能是一个 Promise (异步返回)。

/**
 * 调用下一个中间件或最终处理函数的 `next` 函数的选项类型。
 * 当我们调用 `next()` 时，可以选择性地传递一个新的上下文对象。
 *
 * 这个类型使用了 TypeScript 的条件类型：
 * - 如果 TOutContext 是一个没有任何属性的空对象 (Record<never, never>)，
 *   那么 context 属性是可选的 (context?: TOutContext)，意味着可以不传。
 * - 否则，context 属性是必需的 (context: TOutContext)，意味着必须传递。
 * 这样做是为了在类型上更精确地表达：如果下游不需要任何新的上下文信息，我们就不需要强制传递一个空对象。
 *
 * @template TOutContext - 传递给下一个处理环节的上下文类型。
 */
export type MiddlewareNextFnOptions<TOutContext extends Context> = Record<never, never> extends TOutContext
  ? { context?: TOutContext } // 如果下游不需要上下文，context 是可选的
  : { context: TOutContext } // 如果下游需要上下文，context 是必传的

/**
 * 中间件内部用于调用下一个处理环节（下一个中间件或最终的 procedure 实现）的函数类型。
 * 就像流水线工人把半成品交给下一个工人。
 *
 * @template TOutput - 整个 procedure 的最终输出类型。
 */
export interface MiddlewareNextFn<TOutput> {
  /**
   * 调用下一个处理环节。
   * @template U - 传递给下一个处理环节的上下文类型。默认为空对象。
   * @param rest - 调用选项，主要是用来传递新的上下文 `context`。
   *              使用 `MaybeOptionalOptions` 来处理 `context` 是否可选的情况 (基于 MiddlewareNextFnOptions 的定义)。
   * @returns 返回下一个处理环节的结果，这个结果也是一个 MiddlewareResult 类型。
   */
  <U extends Context = Record<never, never>>(
    ...rest: MaybeOptionalOptions<MiddlewareNextFnOptions<U>>
  ): MiddlewareResult<U, TOutput>
}

/**
 * 中间件内部用于直接返回最终输出的函数类型。
 * 有时候，中间件可能不需要调用 `next()` 进入下一个环节，而是直接就能确定最终结果。
 * 比如，一个缓存中间件，如果命中了缓存，就可以直接用这个函数返回缓存的数据，跳过后续的处理。
 *
 * @template TOutput - 整个 procedure 的最终输出类型。
 */
export interface MiddlewareOutputFn<TOutput> {
  /**
   * 直接返回最终输出。
   * @param output - 要返回的最终输出数据。
   * @returns 返回一个 MiddlewareResult，其中 context 是一个空对象，表示不向下传递额外的上下文。
   */
  (output: TOutput): MiddlewareResult<Record<never, never>, TOutput>
}

/**
 * 传递给中间件函数的选项对象类型。
 * 这个对象包含了中间件运行时需要的所有信息。
 *
 * @template TInContext - 输入的上下文类型。这是从上一个中间件或初始调用者传递过来的上下文。
 * @template TOutput - 整个 procedure 的最终输出类型。
 * @template TErrorConstructorMap - 可用的自定义错误构造函数映射。
 * @template TMeta - procedure 的元数据类型。
 */
export interface MiddlewareOptions<
  TInContext extends Context, // 输入上下文
  TOutput, // 最终输出
  TErrorConstructorMap extends ORPCErrorConstructorMap<any>, // 错误构造器
  TMeta extends Meta, // 元数据
> {
  /**
   * 当前的上下文对象。包含了之前所有中间件传递下来的信息。
   */
  context: TInContext
  /**
   * 当前 procedure 的路径。
   * 比如，一个 API 路由可能是 `['users', 'getById']`。
   */
  path: readonly string[]
  /**
   * 当前正在处理的 procedure 对象。
   * procedure 代表了一个具体的 API 端点或 RPC 调用。
   */
  procedure: Procedure<Context, Context, AnySchema, AnySchema, ErrorMap, TMeta>
  /**
   * AbortSignal，用于取消请求。
   * 如果外部请求被取消，这个 signal 会发出信号，中间件可以监听它来提前中止处理。
   * 可选，因为不是所有环境都支持或需要取消功能。
   */
  signal?: AbortSignal
  /**
   * SSE (Server-Sent Events) 连接中的最后一个事件 ID。
   * 用于支持 SSE 的断线重连。
   * 可选，仅在 SSE 场景下有意义。
   */
  lastEventId: string | undefined
  /**
   * 调用下一个处理环节的函数。
   * @see MiddlewareNextFn
   */
  next: MiddlewareNextFn<TOutput>
  /**
   * 错误构造函数映射。
   * 允许中间件方便地抛出预定义的、类型安全的错误。
   * @see ORPCErrorConstructorMap
   */
  errors: TErrorConstructorMap
}

/**
 * 中间件函数本身的类型定义。
 * 这是编写自定义中间件时需要实现的函数签名。
 *
 * 中间件函数接收两个主要参数：`options` 和 `input`，以及一个辅助函数 `output`。
 * 它需要返回一个 `MiddlewareResult`，可以通过调用 `options.next()` 获取，也可以通过调用 `output()` 直接构造。
 *
 * @see {@link https://orpc.unnoq.com/docs/middleware Middleware 文档}
 *
 * @template TInContext - 中间件接收的输入上下文类型。
 * @template TOutContext - 中间件传递给下一个环节的输出上下文类型。
 * @template TInput - procedure 的输入类型。
 * @template TOutput - procedure 的最终输出类型。
 * @template TErrorConstructorMap - 可用的错误构造函数映射。
 * @template TMeta - procedure 的元数据类型。
 */
export interface Middleware<
  TInContext extends Context, // 输入上下文
  TOutContext extends Context, // 输出上下文
  TInput, // 输入数据
  TOutput, // 输出数据
  TErrorConstructorMap extends ORPCErrorConstructorMap<any>, // 错误构造器
  TMeta extends Meta, // 元数据
> {
  /**
   * 中间件函数的具体实现。
   * @param options - 包含上下文、路径、procedure、next 函数等的选项对象。
   * @param input - procedure 的输入数据。注意：中间件通常在输入校验 *之后* 执行，所以这里的 input 通常是符合 schema 定义的。
   *                但也可以设计在校验前执行的中间件，这时需要特别注意 input 的类型可能不符合预期。
   *                有一个特殊的 `mapInput` 中间件可以在校验前修改输入。
   * @param output - 用于直接返回最终输出的辅助函数。
   * @returns 中间件的处理结果，包含最终输出和传递给下游的上下文。
   */
  (
    options: MiddlewareOptions<TInContext, TOutput, TErrorConstructorMap, TMeta>,
    input: TInput,
    output: MiddlewareOutputFn<TOutput>,
  ): Promisable<
    MiddlewareResult<TOutContext, TOutput>
  >
}

/**
 * 代表任意类型的中间件。用于类型约束，避免写过多的 `any`。
 */
export type AnyMiddleware = Middleware<any, any, any, any, any, any>

/**
 * 特殊中间件 `mapInput` 的类型。
 * 这个中间件比较特殊，它在输入校验 *之前* 执行，允许你修改原始的输入数据。
 * 比如，你可以用它来给输入数据添加默认值，或者转换数据格式。
 *
 * @template TInput - 原始输入类型。
 * @template TMappedInput - 修改后的输入类型。
 */
export interface MapInputMiddleware<TInput, TMappedInput> {
  /**
   * 接收原始输入，返回修改后的输入。
   * @param input - 原始输入数据。
   * @returns 修改后的输入数据。
   */
  (input: TInput): TMappedInput
}

/**
 * `MiddlewareOutputFn` 的一个具体实现和辅助函数。
 * 当中间件需要直接返回输出时 (例如缓存命中)，可以调用这个函数来创建标准的 `MiddlewareResult`。
 *
 * @template TOutput - 输出类型。
 * @param output - 要返回的输出数据。
 * @returns 一个 `MiddlewareResult` 对象，其 `output` 为传入的数据，`context` 为空对象。
 */
export function middlewareOutputFn<TOutput>(output: TOutput): MiddlewareResult<Record<never, never>, TOutput> {
  // 返回一个包含输出和空上下文的结果对象
  return { output, context: {} }
}
