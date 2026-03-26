import type { MessageBatch } from "@cloudflare/workers-types";
import type { AsyncJob } from "./domain";
import { createApp } from "./app";
import { createServices } from "./services";
import type { AppBindings } from "./bindings";

export default {
  async fetch(request: Request, env: AppBindings, ctx: ExecutionContext) {
    const app = createApp(env);
    return app.fetch(request, env, ctx);
  },
  async queue(batch: MessageBatch<AsyncJob>, env: AppBindings) {
    const services = createServices(env);
    for (const message of batch.messages) {
      try {
        await services.processAsyncJob(message.body);
        message.ack();
      } catch {
        message.retry();
      }
    }
  },
};
