# Customer Service — local run

Run the Angular frontend and the Spring Boot API on your machine. Use two terminals. Start the database and the API first, then the frontend.

## Requirements

- Java 25
- Node.js `^22.22.3`, `^24.15.0`, or `>=26` (this frontend uses Angular 22)
- npm 10 (the frontend pins `npm@10.9.8`)
- Docker Desktop (or another Docker engine with Compose)

Maven is already included as the wrapper in `back` (`mvnw` / `mvnw.cmd`). You do not need a separate Maven install.

## 1. Start PostgreSQL

From the `back` folder:

```powershell
cd back
docker compose up -d
```

This starts:

| Service | Address |
| --- | --- |
| PostgreSQL | `localhost:5433` (database, user, and password are all `customer_service`) |
| Mailpit (local inbox, used only when mail is off) | UI at http://localhost:8025, SMTP on port `1025` |

Wait until Postgres is healthy before starting the API:

```powershell
docker compose ps
```

## 2. Start the backend

Stay in `back` and run:

```powershell
.\mvnw.cmd spring-boot:run
```

On Linux or macOS:

```bash
./mvnw spring-boot:run
```

The API listens on http://localhost:8080. Flyway applies the schema on startup.

A demo admin is created from the defaults in `back/src/main/resources/application.yml`:

- email: `admin@example.com`
- password: `ChangeMe-Admin-Password-25!`

Optional SMTP settings go in `back/application-local.yml`. Copy `back/application-local.yml.example` and fill in your own mailbox. That local file is gitignored. If it is missing, mail stays disabled and verification links are written to the API log.

Check that the API is up:

```powershell
curl http://localhost:8080/actuator/health
```

## 3. Start the frontend

Open a second terminal, from the project root:

```powershell
cd front
npm install
npm start
```

`npm start` runs `ng serve` on http://localhost:4200. The dev server proxies `/api`, `/oauth2`, login, logout, CSRF, and actuator calls to http://localhost:8080, so the browser stays on port 4200.

Open http://localhost:4200.

## Everyday commands

Start the stack again later (database already created):

```powershell
cd back
docker compose up -d
.\mvnw.cmd spring-boot:run
```

```powershell
cd front
npm start
```

Stop the database when you are done:

```powershell
cd back
docker compose down
```

`docker compose down` keeps the Postgres volume. Add `-v` only when you want to delete the local database.

## Ports

| What | URL |
| --- | --- |
| Frontend | http://localhost:4200 |
| API | http://localhost:8080 |
| API health | http://localhost:8080/actuator/health |
| Mailpit | http://localhost:8025 |
