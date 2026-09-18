import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import handler, { parseApiKeys, executeAiChat } from './chat.js';

describe('Vercel AI Serverless Function: api/ai/chat', () => {
  // Key Parsing Tests
  describe('parseApiKeys', () => {
    test('handles single key string', () => {
      const keys = parseApiKeys('gsk_test_123');
      assert.deepEqual(keys, ['gsk_test_123']);
    });

    test('handles comma-separated keys', () => {
      const keys = parseApiKeys('gsk_1, gsk_2,gsk_3 ');
      assert.deepEqual(keys, ['gsk_1', 'gsk_2', 'gsk_3']);
    });

    test('handles JSON array format', () => {
      const keys = parseApiKeys('["gsk_1", "gsk_2"]');
      assert.deepEqual(keys, ['gsk_1', 'gsk_2']);
    });

    test('handles empty or undefined values safely', () => {
      assert.deepEqual(parseApiKeys(''), []);
      assert.deepEqual(parseApiKeys(undefined), []);
      assert.deepEqual(parseApiKeys('   '), []);
    });
  });

  // Logical Tests A-F
  describe('executeAiChat and handler contract', () => {
    test('A. valid prompt + Groq configured -> reply returned', async () => {
      const mockFetch = async (url, opts) => {
        assert.ok(url.includes('groq.com'));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: 'Phim hành động hay: John Wick!' } }]
          })
        };
      };

      const res = await executeAiChat({
        prompt: 'Gợi ý phim hành động',
        groqKeys: ['test_groq_key'],
        fetchFn: mockFetch
      });

      assert.equal(res.success, true);
      assert.equal(res.provider, 'groq');
      assert.ok(res.reply.includes('John Wick'));
      assert.equal(res.text, res.reply);
    });

    test('B. Groq fails + Gemini configured -> Gemini fallback returns reply', async () => {
      let groqCalled = false;
      let geminiCalled = false;

      const mockFetch = async (url, opts) => {
        if (url.includes('groq.com')) {
          groqCalled = true;
          return {
            ok: false,
            status: 500,
            text: async () => 'Groq Internal Error'
          };
        }
        if (url.includes('generativelanguage.googleapis.com')) {
          geminiCalled = true;
          return {
            ok: true,
            status: 200,
            json: async () => ({
              candidates: [{ content: { parts: [{ text: 'Gemini gợi ý: Extraction!' }] } }]
            })
          };
        }
        throw new Error('Unexpected URL: ' + url);
      };

      const res = await executeAiChat({
        prompt: 'Gợi ý phim',
        groqKeys: ['bad_groq_key'],
        geminiKeys: ['good_gemini_key'],
        fetchFn: mockFetch
      });

      assert.ok(groqCalled, 'Groq should be attempted first');
      assert.ok(geminiCalled, 'Gemini fallback should succeed');
      assert.equal(res.success, true);
      assert.equal(res.provider, 'gemini');
      assert.ok(res.reply.includes('Extraction'));
    });

    test('C. no provider keys -> clean error', async () => {
      await assert.rejects(
        async () => {
          await executeAiChat({
            prompt: 'Hello',
            groqKeys: [],
            geminiKeys: []
          });
        },
        (err) => {
          assert.equal(err.code, 'NO_KEYS');
          return true;
        }
      );
    });

    test('D. malformed prompt -> 400 Bad Request', async () => {
      const mockReq = {
        method: 'POST',
        body: { prompt: '' } // empty prompt
      };

      let statusCode = 0;
      let responseBody = null;

      const mockRes = {
        setHeader: () => {},
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => {
              responseBody = data;
            }
          };
        }
      };

      await handler(mockReq, mockRes);
      assert.equal(statusCode, 400);
      assert.equal(responseBody?.success, false);
      assert.equal(responseBody?.error, 'INVALID_REQUEST');
    });

    test('E. provider error -> sanitized failure response', async () => {
      // Mock process.env with a key that fails
      process.env.GROQ_API_KEYS = 'test_key';
      delete process.env.GEMINI_API_KEYS;
      delete process.env.VITE_GROQ_API_KEYS;
      delete process.env.VITE_GEMINI_API_KEYS;

      // We test handler with mock failing fetch
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        text: async () => 'Provider crashed'
      });

      try {
        const mockReq = {
          method: 'POST',
          body: { prompt: 'Valid prompt' }
        };

        let statusCode = 0;
        let responseBody = null;

        const mockRes = {
          setHeader: () => {},
          status: (code) => {
            statusCode = code;
            return {
              json: (data) => {
                responseBody = data;
              }
            };
          }
        };

        await handler(mockReq, mockRes);
        assert.equal(statusCode, 500);
        assert.equal(responseBody?.success, false);
        assert.equal(responseBody?.error, 'AI_PROVIDER_UNAVAILABLE');
        assert.ok(!JSON.stringify(responseBody).includes('test_key'));
      } finally {
        globalThis.fetch = originalFetch;
        delete process.env.GROQ_API_KEYS;
      }
    });

    test('F. response contract -> success/reply/provider structure', async () => {
      const mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'Contract test response' } }]
        })
      });

      const res = await executeAiChat({
        prompt: 'test contract',
        groqKeys: ['k1'],
        fetchFn: mockFetch
      });

      assert.equal(typeof res.success, 'boolean');
      assert.equal(typeof res.reply, 'string');
      assert.equal(typeof res.text, 'string');
      assert.equal(typeof res.provider, 'string');
      assert.equal(typeof res.model, 'string');
    });

    test('G. server-side env variable priority: GROQ_API_KEYS takes priority over migration fallback', async () => {
      process.env.GROQ_API_KEYS = 'primary_server_key';
      process.env.VITE_GROQ_API_KEYS = 'fallback_key';

      let receivedAuthHeader = '';
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url, opts) => {
        receivedAuthHeader = opts?.headers?.Authorization || '';
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: 'Success with primary key' } }]
          })
        };
      };

      try {
        const mockReq = {
          method: 'POST',
          body: { prompt: 'Check key priority' }
        };

        let statusCode = 0;
        let responseBody = null;

        const mockRes = {
          setHeader: () => {},
          status: (code) => {
            statusCode = code;
            return {
              json: (data) => {
                responseBody = data;
              }
            };
          }
        };

        await handler(mockReq, mockRes);
        assert.equal(statusCode, 200);
        assert.equal(responseBody?.success, true);
        assert.equal(receivedAuthHeader, 'Bearer primary_server_key');
      } finally {
        globalThis.fetch = originalFetch;
        delete process.env.GROQ_API_KEYS;
        delete process.env.VITE_GROQ_API_KEYS;
      }
    });
  });
});
