# Customer Service frontend

Angular client for the API in `back`. It registers customers, confirms email, signs in with OAuth 2.1 authorization code and PKCE, and calls the profile and admin APIs.

Setup and run instructions for both apps are in the repository root [README](../README.md).

```powershell
npm install
npm start
```

The dev server listens on http://localhost:4200 and proxies API, OAuth, and login calls to http://localhost:8080.
