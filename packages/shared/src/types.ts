/**
 * @file packages/shared/src/types.ts
 * @description 这个文件包含了一些在整个 oRPC 项目中共享的、通用的 TypeScript 工具类型。
 * 这些类型帮助我们编写更健壮、更灵活的代码。
 */

/**
 * @description SetOptional 工具类型
 * 这个类型可以将一个已有类型 T 中的某些属性 K 变成可选的。
 * 想象一下你有一个“用户”类型，有名字、年龄、邮箱，但你想让“邮箱”变成可选的，就可以用这个类型。
 *
 * @template T - 原始类型，比如 { name: string; age: number; email: string; }
 * @template K - T 中需要变成可选的属性名的联合类型，比如 'email' 或者 'age' | 'email'
 *
 * @example
 * type User = { name: string; age: number; email: string; }
 * type UserWithOptionalEmail = SetOptional<User, 'email'>;
 * // 结果：UserWithOptionalEmail 类型相当于 { name: string; age: number; email?: string | undefined; }
 *
 * type UserWithOptionalAgeAndEmail = SetOptional<User, 'age' | 'email'>;
 * // 结果：UserWithOptionalAgeAndEmail 类型相当于 { name: string; age?: number | undefined; email?: string | undefined; }
 *
 * @explanation
 * 实现原理：
 * 1. `Omit<T, K>`: 先从原始类型 T 中移除 (Omit) 掉指定的属性 K。
 *    比如 Omit<User, 'email'> 结果是 { name: string; age: number; }
 * 2. `Partial<Pick<T, K>>`: 然后，从原始类型 T 中挑选出 (Pick) 指定的属性 K，并将它们全部变成可选的 (Partial)。
 *    比如 Partial<Pick<User, 'email'>> 结果是 { email?: string | undefined; }
 * 3. `&`: 最后，使用交叉类型 (&) 将上面两部分合并起来，得到最终结果。
 *    { name: string; age: number; } & { email?: string | undefined; } 就变成了 { name: string; age: number; email?: string | undefined; }
 */
export type SetOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * @description IntersectPick 工具类型
 * 这个类型用于挑选出两个类型 T 和 U 中都存在的那些属性。
 * 想象一下，你有两个类型，一个是“员工”，一个是“经理”，它们可能都有“姓名”和“工号”属性，
 * 用这个类型就可以只提取出这两个共有的属性。
 *
 * @template T - 第一个类型。
 * @template U - 第二个类型。
 *
 * @example
 * type Employee = { id: number; name: string; department: string; }
 * type Manager = { id: number; name: string; level: number; subordinates: Employee[]; }
 * type CommonFields = IntersectPick<Employee, Manager>;
 * // 结果：CommonFields 类型相当于 { id: number; name: string; }
 *
 * @explanation
 * 实现原理：
 * 1. `keyof T`: 获取类型 T 的所有属性名的联合类型。比如 keyof Employee 是 'id' | 'name' | 'department'。
 * 2. `keyof U`: 获取类型 U 的所有属性名的联合类型。比如 keyof Manager 是 'id' | 'name' | 'level' | 'subordinates'。
 * 3. `keyof T & keyof U`: 对上面两个联合类型取交集，得到它们共有的属性名。 'id' | 'name'。
 * 4. `Pick<T, ...>`: 从类型 T 中挑选出 (Pick) 这些共有的属性，构成新的类型。
 *    Pick<Employee, 'id' | 'name'> 结果是 { id: number; name: string; }
 */
export type IntersectPick<T, U> = Pick<T, keyof T & keyof U>

/**
 * @description PromiseWithError 工具类型
 * 这个类型为一个标准的 Promise<T> 附加了一个可选的错误类型标记 `__error`。
 * 这在某些需要更精确地追踪或传递特定错误类型的场景下可能有用。
 * 它本质上还是一个 Promise<T>，但携带了一个关于可能发生的特定错误 TError 的元信息。
 * 注意：这只是一个类型层面的标记，不会改变 Promise 本身的运行时行为。
 *
 * @template T - Promise 成功解决时的值的类型。
 * @template TError - 与这个 Promise 相关联的特定错误类型。
 *
 * @example
 * // 假设我们有一个可能抛出特定 'NetworkError' 的异步操作
 * class NetworkError extends Error { constructor(message: string) { super(message); this.name = 'NetworkError'; } }
 *
 * async function fetchData(): PromiseWithError<string, NetworkError> {
 *   try {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) {
 *       throw new NetworkError(`HTTP error! status: ${response.status}`);
 *     }
 *     return await response.text();
 *   } catch (error) {
 *     // 虽然我们在这里抛出了 NetworkError，但 PromiseWithError 本身
 *     // 只是一个类型提示，实际的错误处理还是需要 catch 来完成。
 *     throw error;
 *   }
 * }
 *
 * // 使用时，类型系统知道这个 Promise 可能关联 NetworkError
 * const resultPromise = fetchData();
 */
export type PromiseWithError<T, TError> = Promise<T> & { __error?: { type: TError } }

/**
 * @description Registry 接口
 * 这是一个特殊的接口，设计用来作为 oRPC 类型配置的“注册中心”。
 * 你可以通过 TypeScript 的“接口合并”（Interface Merging）或“模块增强”（Module Augmentation）技术，
 * 在项目的其他地方扩展这个 `Registry` 接口，来定义全局的或特定模块的类型配置。
 *
 * 这个接口本身是空的，它的作用是提供一个统一的扩展点。
 *
 * @example (通过模块增强扩展)
 * // 在你的项目中的某个 .d.ts 文件或者普通 .ts 文件中：
 * declare module '@orpc/shared/types' {
 *   interface Registry {
 *     // 在这里定义你的全局类型配置
 *     throwableError: MyCustomError | AnotherError; // 例如，定义全局可抛出的错误类型
 *     defaultTimeout: number; // 例如，定义默认超时时间（虽然这里是类型，但可以启发配置）
 *   }
 * }
 *
 * // 然后在项目的其他地方，依赖于 Registry 的类型（比如下面的 ThrowableError）
 * // 就会自动使用你扩展后定义的类型。
 */
export interface Registry {
  // 这个接口是空的，等待用户通过模块增强来填充配置
}

/**
 * @description ThrowableError 类型
 * 这个类型代表在 oRPC 操作中“可以被抛出”的错误类型。
 * 它的具体类型是动态确定的，取决于 `Registry` 接口中是否定义了 `throwableError` 属性。
 *
 * - 如果你在 `Registry` 接口中通过模块增强定义了 `throwableError: YourErrorType`，
 *   那么 `ThrowableError` 就会变成 `YourErrorType`。
 * - 如果你没有在 `Registry` 中定义 `throwableError`，
 *   那么 `ThrowableError` 就会默认使用 JavaScript 内建的 `Error` 类型。
 *
 * 这提供了一种灵活的方式来统一管理项目中允许抛出的错误类型。
 *
 * @explanation
 * 实现原理使用了 TypeScript 的条件类型 (Conditional Types) 和 `infer` 关键字：
 * `Registry extends { throwableError: infer T } ? T : Error`
 * 这段代码的意思是：
 * 1. 检查 `Registry` 类型是否能赋值给 `{ throwableError: infer T }` 这个结构。
 *    这意味着检查 `Registry` 是否有一个名为 `throwableError` 的属性。
 * 2. `infer T`: 如果 `Registry` 有 `throwableError` 属性，`infer T` 会自动推断出这个属性的类型，并将其命名为 T。
 * 3. `? T`: 如果检查成功（即 `Registry` 有 `throwableError`），那么 `ThrowableError` 类型就等于推断出的类型 T。
 * 4. `: Error`: 如果检查失败（即 `Registry` 没有 `throwableError`），那么 `ThrowableError` 类型就等于默认的 `Error` 类型。
 */
export type ThrowableError = Registry extends { throwableError: infer T } ? T : Error
