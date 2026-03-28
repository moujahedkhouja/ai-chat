# AI Chat Project Summary

## Overview

AI Chat is a full-stack application designed to provide a modern chat experience powered by AI. The project is structured as a monorepo with separate backend and frontend components, containerized for easy development and deployment.

## Project Structure

- **ai-chat-backen/**: Spring Boot backend service, responsible for API, authentication, user management, and business logic.
- **ai-chat-frontend/**: Angular frontend application, providing the user interface and client-side logic.
- **docker-compose.yml**: Container orchestration for local development, including a PostgreSQL database.
- **docs/**: Documentation, specifications, and planning resources.
- **uploads/**: Directory for storing uploaded files, such as user avatars.

## Backend (ai-chat-backen)
- Built with Java and Spring Boot.
- Uses Gradle for build automation.
- Connects to a PostgreSQL database (configured in docker-compose).
- Handles authentication, user roles, and chat logic.
- Includes tests and support for Spring Data pagination.

## Frontend (ai-chat-frontend)
- Built with Angular.
- Uses modern Angular features, including signals for state management.
- Supports internationalization (i18n) and theming.
- Communicates with the backend via REST APIs.

## Development & Deployment
- Use `docker-compose up` to start the database and supporting services.
- Backend and frontend can be started independently for development.
- Node.js and npm are required for frontend development (see `.nvmrc` or use the specified Node version).

## Key Features
- User authentication and role management (admin, user, etc.).
- AI-powered chat interface.
- Admin user creation on first login.
- Internationalization support.
- Theming and responsive design.

## Getting Started
1. Clone the repository.
2. Start the database with Docker Compose.
3. Build and run the backend and frontend as per their respective README files.
4. Access the application via the frontend URL.

## Documentation
- See the `docs/` directory for specifications, design documents, and planning notes.

## Authors
- Main admin user: `moujahed` (created on first login)

---

For more details, refer to the individual README files in each subproject and the documentation in the `docs/` directory.

