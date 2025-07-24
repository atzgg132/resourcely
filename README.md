# Resourcely: Makerspace Credit-Based Resource Scheduler

This is a full-stack web application designed to manage shared resources in a collaborative environment like a university lab, workshop, or community makerspace. It uses a virtual credit system to ensure fair and equitable resource allocation.

---

## ✨ Features

- **Credit-Based Economy:** Users spend virtual credits to book resources, promoting mindful usage.
- **Role-Based Access Control:**
    - **Members:** Can register, view resources, and book them.
    - **Admins:** Can manage resources (CRUD), users, and approve pending admin requests.
    - **Superadmin:** The first admin account, with full privileges.
- **Secure Authentication:** JWT-based authentication for secure API access.
- **Resource Management:** Admins can create, update, and delete resources, setting costs and booking rules.
- **Admin Approval Workflow:** A secure process for new users to request and be granted admin privileges.

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js, TypeScript
- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Database:** PostgreSQL (managed with Docker)
- **ORM:** Prisma
- **Authentication:** JSON Web Tokens (JWT), bcrypt for password hashing

---

## 🚀 Getting Started

Follow these instructions to set up and run the project locally for development.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd makerspace-scheduler
```

### 2. Set Up Environment Variables

The backend requires a `.env` file for the database connection and JWT secret.

- Navigate to the `backend` directory: `cd backend`
- Create a copy of the example environment file: `cp .env.example .env` (You may need to create `.env.example` first if it doesn't exist).
- Open the `.env` file and set your variables. It should look like this:

```env
# backend/.env

DATABASE_URL="postgresql://user:password@localhost:5432/makerspace?schema=public"
JWT_SECRET="YOUR_SUPER_SECRET_KEY_REPLACE_THIS"
```
> **Note:** Replace the `JWT_SECRET` with a strong, unique secret key.

### 3. Install Dependencies

You need to install dependencies for both the backend and the frontend.

- **Backend Dependencies:**
  ```bash
  cd backend
  npm install
  ```

- **Frontend Dependencies:**
  ```bash
  cd ../frontend
  npm install
  ```

### 4. Start the Database

The PostgreSQL database runs in a Docker container. From the **root directory** of the project, run:

```bash
docker-compose up -d
```
This will start the database container in the background.

### 5. Run Database Migrations

Before starting the backend server, apply the database schema.

- Navigate to the `backend` directory: `cd backend`
- Run the Prisma migration command:
  ```bash
  npx prisma migrate dev
  ```

---

## 💻 Running the Application

To run the application, you will need two separate terminals.

1.  **Start the Backend Server:**
    - Navigate to the `/backend` directory.
    - Run the development script:
      ```bash
      npm run dev
      ```
    - The backend server will be running at `http://localhost:3001`.

2.  **Start the Frontend Server:**
    - Navigate to the `/frontend` directory.
    - Run the development script:
      ```bash
      npm run dev
      ```
    - The frontend application will be accessible at `http://localhost:5173` (or another port if 5173 is busy).

