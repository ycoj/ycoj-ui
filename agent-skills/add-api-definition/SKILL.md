---
name: add-api-definition
description: Add API definition to the project.
---

This project uses Alova.js for HTTP requests.

## Goal

Add a new API definition in a consistent, typed, and discoverable way so it can be used by features and pages.

## Where API definitions live

- Server-side API methods: `api/server/method/**`
- Client-side API methods: `api/client/method/**`
- Aggregated exports:
  - Server: `api/server/method/index.ts`
  - Client: `api/client/method/index.ts`

Use server methods for server components or server utilities, and client methods for client components or client-side actions.

## Step-by-step

1. Decide the layer.
   - Server: use the Alova instance from `api/server/index.ts` (`alova`).
   - Client: use the Alova instance from `api/client/index.ts` (`clientRequest`).
2. Create a new method file under the correct domain folder.
   - Follow existing domain grouping (e.g. `problems`, `ui`, `record`, `auth`).
   - Use kebab-case filenames that describe the endpoint.
3. Define request/response types.
   - Keep request and response shapes in the method file.
   - If types are shared across features, move them to `shared/types`.
4. Implement the method with Alova.
   - Prefer `alova.Get<T>(url, { params })` for GET with query params.
   - Use `alova.Post<T>(url, payload)` for POST body.
5. Export the method from the domain index and the root index.
6. Use the method through the aggregated API object in features/pages.

## Minimal examples

Server method (GET with params):

```ts
import { alova } from '@/api/server';

export type ExampleListResponse = {
  items: string[];
};

export const getExampleList = (query?: string) =>
  alova.Get<ExampleListResponse>('/example', {
    params: { q: query },
  });
```

Client method (POST):

```ts
import { clientRequest } from '@/api/client';

export type ExampleCreateRequest = {
  name: string;
};

export type ExampleCreateResponse = {
  id: string;
};

export const createExample = (payload: ExampleCreateRequest) =>
  clientRequest.Post<ExampleCreateResponse>('/example', payload);
```

## Alova notes

- This repo already configures Alova instances for server and client.
- Use method instances (`Get`, `Post`, etc.) and keep them typed.
- For more Alova usage details, read the docs in:
  - `references/alova-docs/03-method.md`
  - `references/alova-docs/04-alova-instance.md`
  - `references/alova-docs/05-global-interceptor.md`
  - `references/alova-docs/06-method-metadata.md`
