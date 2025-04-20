# 代码阅读推荐顺序

建议按以下顺序阅读代码，以更好地理解项目结构和核心逻辑：

## 1. 项目根目录与配置

- [`README.md`](./README.md) - 项目概览（当前文件）。
- [`package.json`](./package.json) - 项目依赖和脚本。
- [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) - Monorepo 工作区配置。
- [`turbo.json`](./turbo.json) - Turborepo 构建系统配置。
- [`tsconfig.json`](./tsconfig.json) - TypeScript 基础配置。
- [`LICENSE`](./LICENSE) - 项目许可证。
- [`.gitignore`](./.gitignore) - Git 忽略配置。
- [`.npmrc`](./.npmrc) - npm 配置。

## 2. 核心 Packages

### 2.1. `@orpc/shared` (共享工具库)

- [`packages/shared/package.json`](./packages/shared/package.json)
- [`packages/shared/src/index.ts`](./packages/shared/src/index.ts) - 包入口。
- [`packages/shared/src/types.ts`](./packages/shared/src/types.ts) - 共享类型定义。

### 2.2. `@orpc/contract` (API 契约定义)

- [`packages/contract/package.json`](./packages/contract/package.json) - 包定义文件。
- [`packages/contract/src/index.ts`](./packages/contract/src/index.ts) - 包入口。

### 2.3. `@orpc/server` (服务端实现)

- [`packages/server/package.json`](./packages/server/package.json) - 包定义文件。
- [`packages/server/src/index.ts`](./packages/server/src/index.ts) - 包入口。
- [`packages/server/src/router.ts`](./packages/server/src/router.ts) - 路由构建。
- [`packages/server/src/middleware.ts`](./packages/server/src/middleware.ts) - 中间件实现。

##### 2.3.1. Adapters (`packages/server/src/adapters/`)

###### Fetch Adapter (`fetch/`)

- [`packages/server/src/adapters/fetch/index.ts`](./packages/server/src/adapters/fetch/index.ts)
- [`packages/server/src/adapters/fetch/handler.ts`](./packages/server/src/adapters/fetch/handler.ts)
- [`packages/server/src/adapters/fetch/rpc-handler.ts`](./packages/server/src/adapters/fetch/rpc-handler.ts)
- [`packages/server/src/adapters/fetch/plugin.ts`](./packages/server/src/adapters/fetch/plugin.ts)
- [`packages/server/src/adapters/fetch/body-limit-plugin.ts`](./packages/server/src/adapters/fetch/body-limit-plugin.ts)
- [`packages/server/src/adapters/fetch/handler.test.ts`](./packages/server/src/adapters/fetch/handler.test.ts)
- [`packages/server/src/adapters/fetch/handler.test-d.ts`](./packages/server/src/adapters/fetch/handler.test-d.ts)
- [`packages/server/src/adapters/fetch/rpc-handler.test.ts`](./packages/server/src/adapters/fetch/rpc-handler.test.ts)
- [`packages/server/src/adapters/fetch/plugin.test.ts`](./packages/server/src/adapters/fetch/plugin.test.ts)
- [`packages/server/src/adapters/fetch/plugin.test-d.ts`](./packages/server/src/adapters/fetch/plugin.test-d.ts)
- [`packages/server/src/adapters/fetch/body-limit-plugin.test.ts`](./packages/server/src/adapters/fetch/body-limit-plugin.test.ts)

###### Node Adapter (`node/`)

- [`packages/server/src/adapters/node/index.ts`](./packages/server/src/adapters/node/index.ts)
- [`packages/server/src/adapters/node/handler.ts`](./packages/server/src/adapters/node/handler.ts)
- [`packages/server/src/adapters/node/rpc-handler.ts`](./packages/server/src/adapters/node/rpc-handler.ts)
- [`packages/server/src/adapters/node/plugin.ts`](./packages/server/src/adapters/node/plugin.ts)
- [`packages/server/src/adapters/node/body-limit-plugin.ts`](./packages/server/src/adapters/node/body-limit-plugin.ts)
- [`packages/server/src/adapters/node/handler.test.ts`](./packages/server/src/adapters/node/handler.test.ts)
- [`packages/server/src/adapters/node/handler.test-d.ts`](./packages/server/src/adapters/node/handler.test-d.ts)
- [`packages/server/src/adapters/node/plugin.test.ts`](./packages/server/src/adapters/node/plugin.test.ts)
- [`packages/server/src/adapters/node/plugin.test-d.ts`](./packages/server/src/adapters/node/plugin.test-d.ts)
- [`packages/server/src/adapters/node/body-limit-plugin.test.ts`](./packages/server/src/adapters/node/body-limit-plugin.test.ts)

###### Standard Adapter (`standard/`)

- [`packages/server/src/adapters/standard/index.ts`](./packages/server/src/adapters/standard/index.ts)
- [`packages/server/src/adapters/standard/types.ts`](./packages/server/src/adapters/standard/types.ts)
- [`packages/server/src/adapters/standard/utils.ts`](./packages/server/src/adapters/standard/utils.ts)
- [`packages/server/src/adapters/standard/rpc-matcher.ts`](./packages/server/src/adapters/standard/rpc-matcher.ts)
- [`packages/server/src/adapters/standard/rpc-codec.ts`](./packages/server/src/adapters/standard/rpc-codec.ts)
- [`packages/server/src/adapters/standard/handler.ts`](./packages/server/src/adapters/standard/handler.ts)
- [`packages/server/src/adapters/standard/rpc-handler.ts`](./packages/server/src/adapters/standard/rpc-handler.ts)
- [`packages/server/src/adapters/standard/plugin.ts`](./packages/server/src/adapters/standard/plugin.ts)
- [`packages/server/src/adapters/standard/utils.test.ts`](./packages/server/src/adapters/standard/utils.test.ts)
- [`packages/server/src/adapters/standard/utils.test-d.ts`](./packages/server/src/adapters/standard/utils.test-d.ts)
- [`packages/server/src/adapters/standard/rpc-matcher.test.ts`](./packages/server/src/adapters/standard/rpc-matcher.test.ts)
- [`packages/server/src/adapters/standard/rpc-codec.test.ts`](./packages/server/src/adapters/standard/rpc-codec.test.ts)
- [`packages/server/src/adapters/standard/handler.test.ts`](./packages/server/src/adapters/standard/handler.test.ts)
- [`packages/server/src/adapters/standard/rpc-handler.test.ts`](./packages/server/src/adapters/standard/rpc-handler.test.ts)
- [`packages/server/src/adapters/standard/plugin.test.ts`](./packages/server/src/adapters/standard/plugin.test.ts)

- [`packages/server/src/node/`](./packages/server/src/node/) - Node.js 特定实现。

### 2.4. `@orpc/client` (客户端实现)

- [`packages/client/package.json`](./packages/client/package.json)
- [`packages/client/src/index.ts`](./packages/client/src/index.ts) - 包入口。
- [`packages/client/src/client.ts`](./packages/client/src/client.ts) - 客户端核心实现。
- [`packages/client/src/links/`](./packages/client/src/links/) - 不同传输方式的 Link (Fetch, SSE etc.).

## 3. Schema 验证与 OpenAPI 集成

### 3.1. `@orpc/zod`

- [`packages/zod/package.json`](./packages/zod/package.json)
- [`packages/zod/src/index.ts`](./packages/zod/src/index.ts) - Zod 适配与 OpenAPI 转换。

### 3.2. `@orpc/valibot`

- [`packages/valibot/package.json`](./packages/valibot/package.json)
- [`packages/valibot/src/index.ts`](./packages/valibot/src/index.ts) - Valibot 适配与 OpenAPI 转换。

### 3.3. `@orpc/arktype`

- [`packages/arktype/package.json`](./packages/arktype/package.json)
- [`packages/arktype/src/index.ts`](./packages/arktype/src/index.ts) - ArkType 适配与 OpenAPI 转换。

### 3.4. `@orpc/openapi`

- [`packages/openapi/package.json`](./packages/openapi/package.json)
- [`packages/openapi/src/index.ts`](./packages/openapi/src/index.ts) - 包入口。
- [`packages/openapi/src/schema.ts`](./packages/openapi/src/schema.ts) - Schema 相关定义。

### 3.5. `@orpc/openapi-client`

- [`packages/openapi-client/package.json`](./packages/openapi-client/package.json)
- [`packages/openapi-client/src/index.ts`](./packages/openapi-client/src/index.ts) - 包入口。

## 4. 前端框架集成

### 4.1. `@orpc/react` & `@orpc/react-query`

- [`packages/react/package.json`](./packages/react/package.json)
- [`packages/react/src/index.ts`](./packages/react/src/index.ts) - React 工具和 Server Actions 支持。
- [`packages/react-query/package.json`](./packages/react-query/package.json)
- [`packages/react-query/src/index.ts`](./packages/react-query/src/index.ts) - React Query 集成。

### 4.2. Vue 集成 (@orpc/vue-query & @orpc/vue-colada)

- [`packages/vue-query/package.json`](./packages/vue-query/package.json)
- [`packages/vue-query/src/index.ts`](./packages/vue-query/src/index.ts) - Vue Query 集成。
- [`packages/vue-colada/package.json`](./packages/vue-colada/package.json)
- [`packages/vue-colada/src/index.ts`](./packages/vue-colada/src/index.ts) - Vue Colada 集成。

### 4.3. `@orpc/svelte-query`

- [`packages/svelte-query/package.json`](./packages/svelte-query/package.json)
- [`packages/svelte-query/src/index.ts`](./packages/svelte-query/src/index.ts) - Svelte Query 集成。

### 4.4. `@orpc/solid-query`

- [`packages/solid-query/package.json`](./packages/solid-query/package.json)
- [`packages/solid-query/src/index.ts`](./packages/solid-query/src/index.ts) - Solid Query 集成。

## 贡献指南

欢迎各种形式的贡献，包括但不限于：

- 报告 Bug
- 提交 Pull Request
- 参与讨论

## CI/CD 与其他

- [`.github/workflows/ci.yaml`](./.github/workflows/ci.yaml) - CI 配置。
- [`.github/workflows/release.yaml`](./.github/workflows/release.yaml) - Release 配置。
- [`.github/workflows/release-next.yaml`](./.github/workflows/release-next.yaml) - Next Release 配置。
- [`.github/FUNDING.yml`](./.github/FUNDING.yml) - GitHub Sponsors 配置。
- [`.vscode/settings.json`](./.vscode/settings.json) - VS Code 编辑器配置。

---
<div align="center">
  <image align="center" src="https://orpc.unnoq.com/logo.webp" width=280 alt="oRPC logo" />
</div>

<h1></h1>

<div align="center">
  <a href="https://codecov.io/gh/unnoq/orpc">
    <img alt="codecov" src="https://codecov.io/gh/unnoq/orpc/branch/main/graph/badge.svg">
  </a>
  <a href="https://www.npmjs.com/package/@orpc/client">
    <img alt="weekly downloads" src="https://img.shields.io/npm/dw/%40orpc%2Fclient?logo=npm" />
  </a>
  <a href="https://github.com/unnoq/orpc/blob/main/LICENSE">
    <img alt="MIT License" src="https://img.shields.io/github/license/unnoq/orpc?logo=open-source-initiative" />
  </a>
  <a href="https://discord.gg/TXEbwRBvQn">
    <img alt="Discord" src="https://img.shields.io/discord/1308966753044398161?color=7389D8&label&logo=discord&logoColor=ffffff" />
  </a>
</div>

<h3 align="center">Typesafe APIs Made Simple 🪄</h3>

**oRPC is a powerful combination of RPC and OpenAPI**, makes it easy to build APIs that are end-to-end type-safe and adhere to OpenAPI standards

---

## Highlights

- **🔗 End-to-End Type Safety**: Ensure type-safe inputs, outputs, and errors from client to server.
- **📘 First-Class OpenAPI**: Built-in support that fully adheres to the OpenAPI standard.
- **📝 Contract-First Development**: Optionally define your API contract before implementation.
- **⚙️ Framework Integrations**: Seamlessly integrate with TanStack Query (React, Vue, Solid, Svelte), Pinia Colada, and more.
- **🚀 Server Actions**: Fully compatible with React Server Actions on Next.js, TanStack Start, and other platforms.
- **🔠 Standard Schema Support**: Works out of the box with Zod, Valibot, ArkType, and other schema validators.
- **🗃️ Native Types**: Supports native types like Date, File, Blob, BigInt, URL, and more.
- **⏱️ Lazy Router**: Enhance cold start times with our lazy routing feature.
- **📡 SSE & Streaming**: Enjoy full type-safe support for SSE and streaming.
- **🌍 Multi-Runtime Support**: Fast and lightweight on Cloudflare, Deno, Bun, Node.js, and beyond.
- **🔌 Extendability**: Easily extend functionality with plugins, middleware, and interceptors.
- **🛡️ Reliability**: Well-tested, TypeScript-based, production-ready, and MIT licensed.

## Documentation

You can find the full documentation [here](https://orpc.unnoq.com).

## Packages

- [@orpc/contract](https://www.npmjs.com/package/@orpc/contract): Build your API contract.
- [@orpc/server](https://www.npmjs.com/package/@orpc/server): Build your API or implement API contract.
- [@orpc/client](https://www.npmjs.com/package/@orpc/client): Consume your API on the client with type-safety.
- [@orpc/react](https://www.npmjs.com/package/@orpc/react): Utilities for integrating oRPC with React and React Server Actions.
- [@orpc/react-query](https://www.npmjs.com/package/@orpc/react-query): Integration with [React Query](https://tanstack.com/query/latest/docs/framework/react/overview).
- [@orpc/vue-query](https://www.npmjs.com/package/@orpc/vue-query): Integration with [Vue Query](https://tanstack.com/query/latest/docs/framework/vue/overview).
- [@orpc/solid-query](https://www.npmjs.com/package/@orpc/solid-query): Integration with [Solid Query](https://tanstack.com/query/latest/docs/framework/solid/overview).
- [@orpc/svelte-query](https://www.npmjs.com/package/@orpc/svelte-query): Integration with [Svelte Query](https://tanstack.com/query/latest/docs/framework/svelte/overview).
- [@orpc/vue-colada](https://www.npmjs.com/package/@orpc/vue-colada): Integration with [Pinia Colada](https://pinia-colada.esm.dev/).
- [@orpc/openapi](https://www.npmjs.com/package/@orpc/openapi): Generate OpenAPI specs and handle OpenAPI requests.
- [@orpc/zod](https://www.npmjs.com/package/@orpc/zod): More schemas that [Zod](https://zod.dev/) doesn't support yet.
- [@orpc/valibot](https://www.npmjs.com/package/@orpc/valibot): OpenAPI spec generation from [Valibot](https://valibot.dev/).
- [@orpc/arktype](https://www.npmjs.com/package/@orpc/arktype): OpenAPI spec generation from [ArkType](https://arktype.io/).

## Overview

This is a quick overview of how to use oRPC. For more details, please refer to the [documentation](https://orpc.unnoq.com).

1. **Define your router:**

   ```ts
   import type { IncomingHttpHeaders } from 'node:http'
   import { ORPCError, os } from '@orpc/server'
   import { z } from 'zod'

   const PlanetSchema = z.object({
     id: z.number().int().min(1),
     name: z.string(),
     description: z.string().optional(),
   })

   export const listPlanet = os
     .input(
       z.object({
         limit: z.number().int().min(1).max(100).optional(),
         cursor: z.number().int().min(0).default(0),
       }),
     )
     .handler(async ({ input }) => {
       // your list code here
       return [{ id: 1, name: 'name' }]
     })

   export const findPlanet = os
     .input(PlanetSchema.pick({ id: true }))
     .handler(async ({ input }) => {
       // your find code here
       return { id: 1, name: 'name' }
     })

   export const createPlanet = os
     .$context<{ headers: IncomingHttpHeaders }>()
     .use(({ context, next }) => {
       const user = parseJWT(context.headers.authorization?.split(' ')[1])

       if (user) {
         return next({ context: { user } })
       }

       throw new ORPCError('UNAUTHORIZED')
     })
     .input(PlanetSchema.omit({ id: true }))
     .handler(async ({ input, context }) => {
       // your create code here
       return { id: 1, name: 'name' }
     })

   export const router = {
     planet: {
       list: listPlanet,
       find: findPlanet,
       create: createPlanet
     }
   }
   ```

2. **Create your server:**

   ```ts
   import { createServer } from 'node:http'
   import { RPCHandler } from '@orpc/server/node'
   import { CORSPlugin } from '@orpc/server/plugins'

   const handler = new RPCHandler(router, {
     plugins: [new CORSPlugin()]
   })

   const server = createServer(async (req, res) => {
     const result = await handler.handle(req, res, {
       context: { headers: req.headers }
     })

     if (!result.matched) {
       res.statusCode = 404
       res.end('No procedure matched')
     }
   })

   server.listen(
     3000,
     '127.0.0.1',
     () => console.log('Listening on 127.0.0.1:3000')
   )
   ```

3. **Create your client:**

   ```ts
   import type { RouterClient } from '@orpc/server'
   import { createORPCClient } from '@orpc/client'
   import { RPCLink } from '@orpc/client/fetch'

   const link = new RPCLink({
     url: 'http://127.0.0.1:3000',
     headers: { Authorization: 'Bearer token' },
   })

   export const orpc: RouterClient<typeof router> = createORPCClient(link)
   ```

4. **Consume your API:**

   ```ts
   import { orpc } from './client'

   const planets = await orpc.planet.list({ limit: 10 })
   ```

5. **Generate OpenAPI Spec:**

   ```ts
   import { OpenAPIGenerator } from '@orpc/openapi'
   import { ZodToJsonSchemaConverter } from '@orpc/zod'

   const generator = new OpenAPIGenerator({
     schemaConverters: [new ZodToJsonSchemaConverter()]
   })

   const spec = await generator.generate(router, {
     info: {
       title: 'Planet API',
       version: '1.0.0'
     }
   })

   console.log(spec)
   ```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/unnoq/unnoq/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/unnoq/unnoq/sponsors.svg'/>
  </a>
</p>

## References

oRPC is inspired by existing solutions that prioritize type safety and developer experience. Special acknowledgments to:

- [tRPC](https://trpc.io): For pioneering the concept of end-to-end type-safe RPC and influencing the development of type-safe APIs.
- [ts-rest](https://ts-rest.com): For its emphasis on contract-first development and OpenAPI integration, which have greatly inspired oRPC’s feature set.

## License

Distributed under the MIT License. See [LICENSE](https://github.com/unnoq/orpc/blob/main/LICENSE) for more information.
