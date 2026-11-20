import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";

process.env.JWT_SECRET = "unit-test-secret-with-at-least-32-bytes";
process.env.CLIENT_ORIGIN = "http://localhost:5173, https://mern-online-marketing-web.onrender.com/, https://mern-online-marketing-client.onrender.com/";

const { createApp } = await import("../src/app.js");

test("CORS permits only configured origins, including preflight requests", async () => {
    const server = createApp().listen(0);
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}/health`;

    try {
        for (const origin of [
            "http://localhost:5173",
            "https://mern-online-marketing-web.onrender.com",
            "https://mern-online-marketing-client.onrender.com",
        ]) {
            const response = await fetch(url, {
                method: "OPTIONS",
                headers: { Origin: origin, "Access-Control-Request-Method": "GET" },
            });
            assert.equal(response.headers.get("access-control-allow-origin"), origin);
            assert.equal(response.headers.get("access-control-allow-credentials"), "true");
        }

        const response = await fetch(url, { headers: { Origin: "https://untrusted.example" } });
        assert.equal(response.headers.get("access-control-allow-origin"), null);
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
});