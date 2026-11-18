# Java Sales Application

The project is separated into independent frontend and backend folders.

- `frontend/`: React 19 + TypeScript + Vite
- `backend/user-service/`: Spring Boot 4 user microservice

## Run

### Backend

```powershell
cd backend\user-service
.\mvnw.cmd spring-boot:run
```

The API runs at `http://localhost:8081/api/v1/users`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` requests to the backend.