# Architecture

```mermaid
flowchart LR
    Client[Browser / SPA / Postman] --> OAuth[OAuth2 Authorization Server]
    Client --> API[Customer REST API]
    OAuth --> CustomerDB[(PostgreSQL)]
    API --> CustomerDB
    API --> Cache[(Caffeine Cache)]
    API --> Mail[SMTP / Mailpit]
    OAuth --> API

    subgraph SpringBoot[Spring Boot 4.1.1]
      OAuth
      API
      Security[Spring Security 7.1]
      Cache
    end

    OAuth --> Security
    API --> Security
