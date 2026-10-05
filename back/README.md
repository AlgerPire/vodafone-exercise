# Customer Service API — Spring Boot Technical Exercise

A production-minded REST API for customer profile management, built for a technical interview / architecture presentation.

## Stack

- Java 25 LTS
- Spring Boot 4.1.1
- Spring Security 7.1.x / OAuth 2.1 Authorization Server + JWT Resource Server
- Maven
- PostgreSQL
- Spring Data JPA / Hibernate
- Flyway database migrations
- Caffeine + Spring Cache
- Spring Mail
- Thymeleaf login page for the OAuth2 authorization-code flow
- JUnit 5 + Mockito
- JaCoCo coverage
- Docker Compose

Spring Boot 4.1.1 is used because it is the latest stable Spring Boot release at the time this project was prepared. Java 25 is used because it is the current LTS JDK.

## Architecture

The project intentionally separates API, domain, security, persistence, configuration and cross-cutting concerns:

```text
src/main/java/io/github/algerpire/customerservice
├── admin              # Seeds the initial admin account
├── auth               # Registration and email verification
├── common             # Error model
├── config             # Application properties and cache config
├── customer           # Customer profile API, including admin customer operations, and its request/response records
├── mail               # Outbound mail
├── security           # OAuth2/OIDC infrastructure and authenticated user mapping
└── spa                # Hosts the Angular app: client-route forwarding and the CSRF token the browser login needs
```

Controllers live in the feature that owns the endpoint. The `spa` package serves the single-page app: it forwards client routes to `index.html` and exposes the CSRF token the browser login needs. Request and response records sit next to the controller that uses them. Controllers stay thin and business rules live in services.

## Functional coverage

### Customer self-registration

`POST /api/v1/auth/register`

A customer provides name, email, password and photo URL. The account is created with:

- role `CUSTOMER`
- active status `true`
- email verified `false`
- a delegating password hash (bcrypt is the default encoder)
- a single-use verification token stored as a SHA-256 hash

The raw verification token is never persisted.

### Email confirmation

`GET /api/v1/auth/verify-email?token=...`

The token expires after 24 hours and can only be used once. After successful verification, the customer can authenticate through the OAuth2 authorization-code flow.

For a development demo, set `APP_MAIL_ENABLED=false`. The verification URL is logged. For real SMTP delivery, set `APP_MAIL_ENABLED=true` and provide SMTP settings.

### Customer profile

`GET /api/v1/customers/me`

Returns:

- name
- email
- photo URL
- role
- active state
- email verification state
- timestamps

`PUT /api/v1/customers/me`

Updates name, email and photo URL. Changing the email resets `emailVerified=false`, so the new email must be verified before the next login.

`DELETE /api/v1/customers/me`

Does not physically delete the row. It deactivates the account. This keeps historical data and auditability while preventing future authentication.

### Admin operations

Admin-only APIs are under `/api/v1/admin/customers`.

- `GET /api/v1/admin/customers`
- `GET /api/v1/admin/customers/{id}`
- `PATCH /api/v1/admin/customers/{id}/status`
- `PATCH /api/v1/admin/customers/{id}/role`

The default admin can be seeded via environment variables. Never keep the example password in a real deployment.

## OAuth2 security

This project uses a real OAuth2 authorization-code flow with PKCE, rather than a custom login token endpoint or the deprecated password grant.

There is one public PKCE demo client:

- client id: `presentation-client`
- client authentication: none
- authorization grant: authorization code
- PKCE: required
- access-token lifetime: 15 minutes
- refresh-token lifetime: 30 days

The API itself is a JWT resource server. The authorization server places `customer_id`, `name`, `email` and role claims into access tokens. The API maps the `roles` claim to Spring Security authorities.

### Login flow

1. Register the customer.
2. Confirm the email.
3. Open the OAuth2 `/oauth2/authorize` URL in a browser using PKCE.
4. Sign in through `/login`.
5. Receive the authorization code at the registered redirect URI.
6. Exchange the code at `/oauth2/token` for an access token.
7. Send `Authorization: Bearer <access-token>` to the customer APIs.

A frontend application can implement the same standard authorization-code + PKCE flow.

## Caching and consistency

Customer profiles are cached with Caffeine for 10 minutes and capped at 10,000 entries.

The important consistency detail is that profile updates do not simply evict the cache immediately inside the transaction. The service publishes `CustomerProfileChangedEvent`, and `CustomerCacheListener` handles that event with `@TransactionalEventListener(phase = AFTER_COMMIT)`.

That means:

- a failed database transaction does not invalidate a valid cache entry;
- a successful transaction evicts the corresponding profile entry;
- the next read retrieves the new state from PostgreSQL and repopulates the cache.

This gives predictable read-after-write behavior without requiring Redis for this exercise.

For a horizontally scaled production deployment, the same event concept can be moved to a shared broker (or use Redis-backed caching) so cache invalidation propagates across instances.

## Validation and error handling

The API uses Jakarta Bean Validation and RFC 9457-style `ProblemDetail` responses.

Example validation response shape:

```json
{
  "type": "about:blank",
  "title": "VALIDATION_ERROR",
  "status": 400,
  "detail": "Request validation failed.",
  "timestamp": "2026-10-02T18:00:00Z",
  "path": "/api/v1/auth/register",
  "fieldErrors": {
    "email": "must be a well-formed email address"
  }
}
```

The API deliberately avoids exposing stack traces or internal exception details to clients.

## Local setup

### Requirements

- Java 25
- Docker + Docker Compose

Maven is included through the Maven Wrapper.

### 1. Start PostgreSQL and Mailpit

```bash
docker compose up -d
```

Mailpit UI: http://localhost:8025

### 2. Run the application

Linux/macOS:

```bash
./mvnw spring-boot:run
```

Windows:

```powershell
.\\mvnw.cmd spring-boot:run
```

The API starts at `http://localhost:8080`.

### 3. Demo admin

The example configuration creates an admin on startup when these values are present:

```text
APP_ADMIN_EMAIL=admin@example.com
APP_ADMIN_PASSWORD=ChangeMe-Admin-Password-25!
```

Use a new password for any public repository / real environment.

## API examples

### Register

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "StrongPassword123!",
    "photoUrl": "https://example.com/photos/jane.jpg"
  }'
```

When `APP_MAIL_ENABLED=false`, look at the application log for the verification URL.

### Confirm email

```bash
curl 'http://localhost:8080/api/v1/auth/verify-email?token=PASTE_TOKEN_HERE'
```

### Get profile

```bash
curl http://localhost:8080/api/v1/customers/me \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### Update profile

```bash
curl -X PUT http://localhost:8080/api/v1/customers/me \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Jane Updated",
    "email": "jane@example.com",
    "photoUrl": "https://example.com/photos/jane-updated.jpg"
  }'
```

### Close account

```bash
curl -X DELETE http://localhost:8080/api/v1/customers/me \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### Admin list customers

```bash
curl 'http://localhost:8080/api/v1/admin/customers?page=0&size=20' \
  -H 'Authorization: Bearer ADMIN_ACCESS_TOKEN'
```

### Admin deactivate a customer

```bash
curl -X PATCH http://localhost:8080/api/v1/admin/customers/CUSTOMER_ID/status \
  -H 'Authorization: Bearer ADMIN_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"active":false}'
```

## Testing

Run unit tests:

```bash
./mvnw test
```

Run verification including the JaCoCo report:

```bash
./mvnw verify
```

Coverage report:

```text
target/site/jacoco/index.html
```

The build enforces a minimum 60% line coverage per package as a guardrail. The test suite focuses on business rules, token generation flow, profile update semantics, account deactivation and controller validation.

## Database

Flyway owns schema evolution. Hibernate runs with `ddl-auto=validate`, which prevents the application from silently changing a shared production schema.

This is intentionally stronger than `ddl-auto=update` for a production-oriented code sample.

## Security decisions

- Passwords are hashed; plaintext passwords are never persisted.
- Email verification tokens are hashed at rest.
- Customer registration only creates the `CUSTOMER` role; users cannot self-promote.
- Admin-only endpoints are protected with method-level authorization and URL-level authorization.
- JWT access tokens are short lived.
- PKCE is required for the public OAuth2 client.
- Account closure is a reversible/deactivating operation instead of destructive deletion.
- CORS is intentionally not globally enabled because this service is API-first and a browser client should configure a known origin in production.
- CSRF is ignored only for `/api/**` because the API uses bearer access tokens; the browser login flow keeps CSRF protection.
- Actuator exposure is limited to health/info.

## Assumptions

1. `photo` is represented by a URL rather than a binary upload. This keeps the exercise focused on profile management and security while making the API deployable without object storage.
2. OAuth authorization state and registered demo clients are intentionally in-memory for the technical exercise. In a multi-instance production deployment, use a shared persistent implementation.
3. A mail provider is external to the application. SMTP settings are environment-driven.
4. The application uses one service instance for the local cache. A distributed cache should be introduced if this service is scaled horizontally.

## Presentation talking points

A good way to walk through this solution during an interview is:

1. Start with the domain model and explain why `active` and `emailVerified` are separate states.
2. Explain why registration does not automatically authenticate the new user.
3. Walk through OAuth2 authorization code + PKCE and the JWT resource-server boundary.
4. Demonstrate how roles enter the JWT and become Spring authorities.
5. Show the `AFTER_COMMIT` cache invalidation event and explain why it avoids transaction/cache races.
6. Show Flyway + `ddl-auto=validate` as the migration strategy.
7. Run `./mvnw verify` and open the JaCoCo report.

## Public repository checklist

Before publishing:

- replace the default admin password;
- set production SMTP credentials through secrets;
- use a stable HTTPS issuer URL;
- register the real frontend redirect URI;
- persist OAuth2 authorizations / clients for a multi-instance deployment;
- move profile photos to object storage if upload functionality is needed;
- add structured audit logging and centralized observability for production.
