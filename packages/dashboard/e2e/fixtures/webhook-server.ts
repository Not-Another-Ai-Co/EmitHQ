import http from 'http';
import type { AddressInfo } from 'net';

export interface ReceivedWebhook {
  headers: Record<string, string | string[] | undefined>;
  body: string;
  timestamp: number;
}

/**
 * Lightweight HTTP server that accepts POST requests and records payloads.
 * Used as a webhook endpoint in E2E tests.
 */
export function createWebhookServer(): {
  start: () => Promise<string>;
  stop: () => Promise<void>;
  getPayloads: () => ReceivedWebhook[];
  clear: () => void;
} {
  const payloads: ReceivedWebhook[] = [];
  let server: http.Server | null = null;

  return {
    async start() {
      return new Promise<string>((resolve, reject) => {
        server = http.createServer((req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
              payloads.push({
                headers: req.headers,
                body,
                timestamp: Date.now(),
              });
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true }));
            });
          } else {
            res.writeHead(200);
            res.end('webhook test server');
          }
        });

        server.listen(0, '127.0.0.1', () => {
          const addr = server!.address() as AddressInfo;
          resolve(`http://127.0.0.1:${addr.port}`);
        });

        server.on('error', reject);
      });
    },

    async stop() {
      return new Promise<void>((resolve) => {
        if (server) {
          server.close(() => resolve());
        } else {
          resolve();
        }
      });
    },

    getPayloads() {
      return [...payloads];
    },

    clear() {
      payloads.length = 0;
    },
  };
}
