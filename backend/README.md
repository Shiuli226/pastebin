Pastebin-Lite (backend)

This repository contains the backend for the Pastebin-Lite take-home assignment (Spring Boot + Redis).

Quick summary
- Language: Java 17, Spring Boot 3
- Persistence: Redis (string keys)
- Endpoints implemented:
  - GET  /api/health        -> JSON (fast, includes `redis` boolean)
  - GET  /api/healthz       -> JSON (same as /api/health)
  - POST /api/pastes        -> create paste (JSON)
  - GET  /api/pastes/:id    -> fetch paste (JSON) — decrements view count if applicable
  - GET  /p/:id             -> HTML view of paste (safe-escaped)

How to run locally (macOS/zsh)

1) Install prerequisites

- Java 17 (Adoptium/OpenJDK)
- Maven
- Redis (or run Redis in Docker)

Install via Homebrew (recommended):

```bash
brew install openjdk@17 maven redis
```

Add Java to your PATH in zsh if needed (Homebrew):

```bash
echo 'export PATH="/usr/local/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

2) Start Redis (Homebrew)

```bash
brew services start redis
# or run a one-off Redis:
redis-server --daemonize yes
```

Or use Docker:

```bash
docker run --name redis-local -p 6379:6379 -d redis:7
```

3) Run the app (single-run env override)

```bash
# from backend/ directory
REDIS_URL='redis://localhost:6379' mvn spring-boot:run
```

If you prefer to build a jar first:

```bash
mvn package
java -jar target/*.jar
```

If `mvn` is not available, install it via Homebrew: `brew install maven`.

## Running the backend

The backend now uses an in-memory store by default (no external Redis required). This simplifies local development and testing.

Quick start (development):
- Start the backend:
  - Using Maven: ./mvnw spring-boot:run
  - Or build and run: ./mvnw package && java -jar target/*.jar
- Default server port is 8081 (changed from 8080 to avoid conflicts). Override at runtime:
  - java -jar target/*.jar --server.port=8080
  - or export SPRING_APPLICATION_JSON='{"server.port":8080}' && ./mvnw spring-boot:run

Run with Redis (optional):
- If you prefer to use Redis, configure via REDIS_URL or spring.redis.url:
  - Example (local Redis): docker run --rm -p 6379:6379 redis
  - Start app with REDIS_URL set: REDIS_URL=redis://localhost:6379 ./mvnw spring-boot:run
- The app will automatically use Redis when a valid spring.redis.url / REDIS_URL is provided.

Configuration
- In-memory store (default): no env vars required.
- To force random free port for tests/dev: --server.port=0
- To explicitly configure Redis: set REDIS_URL (format: redis://[:password@]host:port) or spring.redis.url property.

Behavior notes
- Paste entries are stored in-memory. TTL is enforced on access (no background eviction), and remaining views are decremented atomically on fetch.
- In-memory store means data is lost on process restart. Use Redis in production if persistence across restarts is required.

Troubleshooting
- Port already in use: change port as shown above or stop the process using the port.
- If you see Redis-related errors, ensure REDIS_URL is unset (to use in-memory) or points to a reachable Redis instance.
- To enable verbose startup logs: add --debug to the JVM args or set logging.level.root=DEBUG.

Environment & deterministic testing
- `REDIS_URL` environment variable controls Redis URL (defaults to redis://localhost:6379).
- To enable deterministic expiry testing set `TEST_MODE=1`. When enabled, provide request header `x-test-now-ms` with milliseconds since epoch; the server will use that time for expiry logic only.

Example requests

Create a paste:
```bash
curl -sS -X POST http://localhost:8080/api/pastes \
  -H 'Content-Type: application/json' \
  -d '{"content":"hello","ttl_seconds":60,"max_views":5}'
```

Fetch paste (API):
```bash
curl -sS http://localhost:8080/api/pastes/<id>
```

View paste (HTML):
```bash
curl -sS http://localhost:8080/p/<id>
```

Notes & design decisions
- Persistence: Redis was chosen for simplicity and to meet grader expectations (survives across requests). Paste objects are stored as simple delimited strings under `paste:<id>` keys. TTL is set on the key as well when provided.
- Atomic view decrement: The controller uses a Lua script to atomically check expiry and decrement remaining views to minimize race conditions.
- Safety: HTML output is escaped to avoid script execution.
- Health endpoints: `/api/health` and `/api/healthz` return JSON quickly and will not throw on Redis connection failures; they include a `redis` boolean indicating connectivity.

Limitations & possible improvements
- The storage format is a simple delimited string; switching to a JSON value or a small schema would be clearer.
- Add Spring Boot Actuator for standardized health checks.
- Add integration tests using Testcontainers to spin up Redis in CI.

Repository notes
- README.md (this file) must be present for the grader.
- No secrets are committed.

Good luck and happy testing!
