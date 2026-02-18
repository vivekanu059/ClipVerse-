# ClipVerse 
A Full-Stack Video Streaming & Management Platform

ClipVerse is a scalable, backend-driven video platform inspired by YouTube-like functionality.  
The project focuses heavily on **backend architecture, storage, APIs, and system automation**, with a modern frontend for user interaction.

This project is designed with **real-world production concepts** such as object storage, containerization, environment configuration, and modular service design.

---

## Key Features

###  Authentication & User Management
- Secure user authentication
- Role-based access control
- Protected routes and APIs

###  Video Upload & Streaming
- Video upload handling
- Efficient media storage using **object storage**
- Video metadata management
- Public & private video access
  
###  Storage & Media Handling
- **MinIO object storage** for video files
- Optimized backend media handling
- Separation of media storage and application logic

###  Backend-First Architecture
- RESTful APIs built with Node.js & Express
- Modular service-based backend structure
- Environment-based configuration using `.env`

###  DevOps & Deployment Ready
- Docker & Docker Compose support
- Service isolation for backend and storage
- Easy local and production deployment setup

---

##  Tech Stack

### Backend
- **Node.js**
- **Express.js**
- **MongoDB**
- **MinIO (Object Storage)**
- **Docker & Docker Compose**

### Frontend
- **React.js**
- Modern component-based UI
- API-driven data flow

### Other Tools
- REST APIs
- Environment variables
- Git version control

---

##  Project Structure

videoProjectOriginal/
│
├── backend/
│ ├── src/ # Core backend logic
│ ├── public/ # Static assets
│ ├── app.js # Express app setup
│ ├── index.js # Server entry point
│ ├── docker-compose.yml # Service orchestration
│ ├── .env # Environment variables
│ └── package.json
│
├── frontend/
│ └── client/ # React frontend
│
└── README.md

##  Environment Setup

Create a `.env` file inside the **backend** directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key

