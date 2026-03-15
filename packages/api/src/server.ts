import { serve } from '@hono/node-server';
import { app } from './index';

const port = parseInt(process.env.PORT || '4000', 10);

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`EmitHQ API server listening on http://0.0.0.0:${info.port}`);
});
