# CodeForge API

## Interactive Documentation
Swagger UI is available at `/api-docs` when running the backend locally.

## Endpoints

### Health
- `GET /live`: Check if the process is active.
- `GET /ready`: Check if the database and dependencies are ready.
- `GET /metrics`: Internal metrics and observability (latenct, error counts).

### Projects
- `GET /api/projects`: Retrieve all projects.
- `GET /api/projects/:id`: Retrieve a specific project.
- `POST /api/projects`: (Admin only) Create a project.
- `PUT /api/projects/:id`: (Admin only) Update a project.
- `DELETE /api/projects/:id`: (Admin only) Delete a project.

### Experiences
- `GET /api/experiences`: Retrieve all experiences.
- `GET /api/experiences/:id`: Retrieve a specific experience.
- `POST /api/experiences`: (Admin only) Create an experience.
- `PUT /api/experiences/:id`: (Admin only) Update an experience.
- `DELETE /api/experiences/:id`: (Admin only) Delete an experience.

### Auth
- `POST /api/auth/login`: Admin login.
- `POST /api/auth/logout`: Admin logout.
