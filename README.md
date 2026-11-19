# Java Sales Application

The project is separated into independent frontend and backend folders.

- `frontend/`: React 19 + TypeScript + Vite UI for user and product management
- `backend/user-service/`: Spring Boot 4 user microservice
- `backend/products/`: Spring Boot product module with CRUD API and JPA persistence
- `backend/module-explorer/`: React app with a simple endpoint list and draggable, plain-language flow trees

## Run

### Backend

```powershell
cd backend\user-service
.\mvnw.cmd spring-boot:run
```

The API runs at `http://localhost:8081/api/v1/users`.

### Products API

```powershell
cd backend\products
..\..\mvnw.cmd spring-boot:run
```

The products API runs at `http://localhost:8082/api/v1/products`. On startup, Hibernate creates or updates the `products` table in the configured PostgreSQL database. By default, it uses `sales_user_db`; set `PRODUCT_DB_URL`, `PRODUCT_DB_USERNAME`, and `PRODUCT_DB_PASSWORD` to use a dedicated database.

### Backend module explorer

```powershell
cd backend\module-explorer
npm install
npm run dev
```

Open the local URL printed by Vite to browse the backend service catalog.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies user requests to port 8081 and product requests to port 8082.