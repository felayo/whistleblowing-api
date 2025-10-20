# 🕵️‍♂️ Whistleblowing API

## 📘 Project Overview
This project is part of my M.Sc. thesis titled **“Design and Implementation of an Online Whistle-Blower Reporting System to Combat Public Property Vandalism in Lagos State.”**

The **Whistleblowing API** provides a secure and anonymous platform that enables citizens to report public property vandalism, attach evidence, and track their report’s progress without revealing their identity.  
Administrators can review, assign, and follow up on reports efficiently, ensuring accountability and transparency.

---

## 🚀 Features
- **Anonymous & Confidential Reporting** — reporters can choose to hide or reveal their identity.
- **Evidence Upload** — supports file uploads (e.g., images, videos, PDFs) to AWS S3.
- **Secure Follow-ups** — whistle-blowers can communicate using a system-generated case password.
- **Admin Dashboard Support** — administrators can add messages, assign agencies, and update report status.
- **Audit Logging** — every action is recorded for transparency and traceability.
- **Password-based Access** — no user account needed; each report is accessible via a unique password.

---

## 🛠️ Tech Stack
- **Backend Framework:** Node.js + Express.js  
- **Database:** MongoDB (Mongoose ODM)  
- **Authentication:** Bcrypt + SHA256 (secure case password system)  
- **File Storage:** AWS S3 Bucket  
- **Logging:** Custom Audit Logs  
- **Documentation:** Swagger (OpenAPI 3.0)

---

## 📂 Project Structure
``` whistleblowing-api/ ├── controllers/ │ ├── reporterController.js │ ├── agencyController.js │ ├── userController.js │ ├── authController.js │ ├── adminController.js │ └── auditController.js ├── models/ │ ├── Report.js │ ├── Category.js │ ├── User.js │ ├── Agency.js │ └── AuditLog.js ├── routes/ │ ├── reporterRoutes.js │ ├── adminRoutes.js │ ├── agencyRoutes.js │ └── authRoutes.js ├── middleware/ │ ├── auth.js │ ├── error.js │ ├── logger.js │ ├── loginLimiter.js │ └── multer.js ├── config/ │ └── corsOptions.js ├── utils/ │ └── fileUploadS3.js ├── .env ├── swagger.json ├── package.json ├── app.js  └── server.js ```

---

## ⚙️ Installation and Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/felayo/whistleblowing-api.git
cd whistleblowing-api

### Install Dependencies

run `npm install`

## ⚙️ Environment Variables

remove .sample from `.env.sample` file in the root directory of your project and add the following variables:

```env
PORT=8081
NODE_ENV=development

# MongoDB Connection
MONGO_URI=your_mongodb_connection_string
NODE_ENV=

# AWS S3 Credentials
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=your_bucket_name
S3_REGION=your_bucket_region

# Security / JWT
JWT_COOKIE_EXPIRE=
ACCESS_JWT_EXPIRE=
REFRESH_JWT_EXPIRE=
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=


### Run the Server
run `npm run dev`

## API BASE URL
The API base URL is http://localhost:8081
The App is hosted locally on port 8081

## API Endpoints Documentation
Swagger documentation is available at  http://localhost:8081/api-docs
