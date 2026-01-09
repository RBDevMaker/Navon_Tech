# ☁️ Cloud-Native Tech Company Website & Intranet Platform

### React + AWS Amplify + Cognito + Lambda + API Gateway + DynamoDB + S3

A **cloud-native technology company platform** migrated from GoDaddy to **AWS**, rebuilt with **React** and **AWS Amplify**.  
The application supports a **customer-facing public website** and a **secure employee intranet/portal**, designed for scalability, collaboration, and future growth.

---

## 🧭 Overview

This project is a **non–lift-and-shift migration** from a traditional hosting provider (GoDaddy) to a **modern AWS-native architecture**.

The platform includes:
- A **public-facing marketing website**
- **Solution and partner descriptions**
- **Career postings with application workflows**
- A **secure employee intranet** with tools, resources, and role-based access

All content is modular and extensible to support continuous evolution.

---

## 🏗️ Migration Strategy (GoDaddy → AWS)

**What was migrated:**
- All existing website text/content
- Branding and layout concepts
- Business structure and information architecture

**What was redesigned:**
- Frontend rebuilt in **React**
- Hosting migrated to **AWS Amplify**
- Authentication implemented with **AWS Cognito**
- Backend APIs created with **Lambda + API Gateway**
- Storage moved to **Amazon S3**
- Data stored in **DynamoDB**

This enables:
- Better performance
- Stronger security
- Easier scaling
- Faster feature development

---

## 🛠️ Tech Stack

### Frontend
- **React**
- **HTML5 / CSS3**
- **JavaScript (ES6+)**
- Custom CSS (no locked UI framework)

### Cloud & Backend
- **AWS Amplify** (Hosting, CI/CD)
- **AWS Cognito** (Authentication & Roles)
- **AWS Lambda**
- **Amazon API Gateway**
- **Amazon DynamoDB**
- **Amazon S3**
- **CloudFront**

---

## 📁 Project Structure

├── public/ # Customer-facing website
│ ├── index.html
│ ├── css/
│ ├── images/
│ └── assets/
│
├── Portal/ # Employee intranet
│ ├── dashboard/
│ ├── tools/
│ ├── resources/
│ ├── documents/
│ └── admin/
│
├── src/
│ ├── components/
│ ├── services/
│ ├── auth/
│ └── styles/
│
├── amplify/
├── package.json
└── README.md


---

## 🚀 Features

### 🌐 **Public Website (Customer-Facing)**

* Company overview & solution offerings
* Partner descriptions
* Career postings
* Job application submission
* Mobile-responsive design
* Static + dynamic content support

---

### 🧑‍💼 **Employee Intranet / Portal**

* Secure employee login
* Role-based access (Employee, Manager, Admin)
* Internal tools & dashboards
* Company resources & documentation
* Downloadable PDFs and assets
* Internal announcements
* Admin-only management sections

---

## 🔐 Authentication & Security

### **AWS Cognito + Amplify Authentication**

* Secure email & password login
* Email verification
* Password reset
* Session management
* Role-based authorization
* Protected routes (public vs intranet)

### **User Roles**
- **Public Users** – website visitors
- **Employees** – intranet access
- **Admins** – full portal management

---

## 🧱 Cloud Architecture



React Frontend
│
AWS Amplify Hosting & CI/CD
│
AWS Cognito (Authentication & Roles)
│
API Gateway
│
Lambda Functions
│
DynamoDB (Users, Jobs, Applications, Resources)
│
S3 (PDFs, Documents, Images)


---

## 📄 Career Postings & Applications

### **Features**
* Job listings managed dynamically
* Application submission form
* Resume upload (PDF)
* Secure storage in S3
* Application metadata stored in DynamoDB

### **Data Flow**


Applicant → React Form → API Gateway → Lambda → S3 + DynamoDB


---

## 🔐 Environment Variables



REACT_APP_AWS_REGION=
REACT_APP_USER_POOL_ID=
REACT_APP_USER_POOL_CLIENT_ID=
REACT_APP_IDENTITY_POOL_ID=
REACT_APP_API_URL=
REACT_APP_S3_BUCKET=


---



## 🏗️ Future Enhancements

Advanced intranet dashboards

Document approval workflows

Internal messaging system

Analytics & reporting

Multi-environment support (dev / staging / prod)

CI/CD pipeline enhancements


📄 License

MIT License

👩🏽‍💻 Author

Rachelle L. Briscoe (RBDev),
Cloud Software Developer
