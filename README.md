# 🛍️ SRC Ecommerce Backend

A robust and scalable **E-commerce Backend** built with **Node.js**, **Express.js**, and **MongoDB**, designed to support a multi-role system — **Super Admin**, **Seller**, and **Buyer**.  
This project also integrates **Stripe** for secure payments and **Firebase** for real-time notification handling.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based authentication.
- Role-based access control for:
  - **Super Admin**: Manage users, sellers, and products globally.
  - **Seller**: Manage own products, orders, and profile.
  - **Buyer**: Browse products, place orders, and make payments.

### 💳 Payment Integration
- **Stripe** integration for secure online payments.
- Order and payment tracking.

### 🔔 Notifications
- **Firebase Cloud Messaging (FCM)** integration for:
  - Real-time order status updates.
  - Notifications for sellers and buyers.

### 📦 Product Management
- CRUD operations for products.
- Product categories, images, and pricing support.

### 🛒 Order Management
- Buyer can place, view, and cancel orders.
- Seller can manage received orders.
- Admin can monitor all transactions.

### 🧑‍💼 User Management
- Role creation and user assignment.
- Super Admin can block/unblock users.

---

## 🧰 Tech Stack

| Category | Technologies |
|-----------|---------------|
| **Backend Framework** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) |
| **Authentication** | JSON Web Token (JWT), bcrypt |
| **Payment** | Stripe |
| **Notifications** | Firebase Cloud Messaging (FCM) |
| **Environment Variables** | dotenv |
| **Version Control** | Git, GitHub |

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/SouravChowdhuryRimel/SRC-Ecommerce-backend.git
cd SRC-Ecommerce-backend
