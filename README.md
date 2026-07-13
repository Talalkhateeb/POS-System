# POS System

نظام نقاط بيع (POS System) متكامل لمتجر واحد، تم تطويره باستخدام **Laravel 12** كواجهة خلفية (REST API) و**React + Vite** كواجهة أمامية، مع استخدام **Laravel Sanctum** للمصادقة.

يوفر النظام إدارة كاملة لعمليات البيع اليومية، المنتجات، المستخدمين، الورديات، الإرجاعات، والصلاحيات، بالإضافة إلى لوحة تحكم تعرض أهم مؤشرات الأداء.

---

# Project Structure

```text
POS-System/
├── pos-backend/     # Laravel REST API
├── pos-frontend/    # React + Vite Frontend
└── README.md
```

---

# Technologies Used

## Backend

- Laravel 12
- Laravel Sanctum
- MySQL / SQLite
- PHPUnit

## Frontend

- React
- Vite
- Bootstrap
- React Router DOM
- Axios

---

# Main Features

## Authentication

- Secure login using Laravel Sanctum.
- Change password.
- Logout.
- User profile management.

## User Management

- Create users.
- Edit users.
- Activate or deactivate accounts.
- Manager and Cashier roles.

## Products

- Add products.
- Edit products.
- Delete products.
- Inventory management.
- Low stock warning.
- If a product with the same name already exists, its quantity is increased instead of creating a duplicate product.

## Sales (POS)

- Cashier POS interface.
- Shopping cart.
- Invoice generation.
- Automatic stock deduction.
- Sales are not allowed unless a shift is opened.

## Shift Management

- Open shift.
- Close shift.
- Initial cash balance.
- Expected balance calculation.
- Cash movement tracking.

## Returns

- Return products using invoice number.
- Quantity validation.
- Restore returned quantities to inventory.
- Cash movement is recorded automatically.
- Manager confirmation when required.
- Cashiers with permission can process returns directly.

## Dashboard

Manager dashboard displaying:

- Total sales
- Total returns
- Net revenue
- Best-selling products
- Most returned products
- Cashier performance

## Language Support

- Arabic (RTL)
- English (LTR)
- Language preference stored in Local Storage.

---

# Running the Project

## Backend

```bash
cd pos-backend

composer install

cp .env.example .env

php artisan key:generate

php artisan migrate --seed

php artisan serve
```

Backend runs on:

```text
http://127.0.0.1:8000
```

---

## Frontend

```bash
cd pos-frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# Database Configuration

The project supports both **MySQL** and **SQLite**.

Example MySQL configuration:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pos_system
DB_USERNAME=root
DB_PASSWORD=
```

After updating the database configuration:

```bash
php artisan migrate:fresh --seed
```

---

# Default Accounts

## Admin

```
Username: admin
Password: admin1234
```

## Cashier

```
Username: cashier
Password: cashier1234
```

---

# Useful Commands

## Run Backend Tests

```bash
cd pos-backend

php artisan test
```

## Build Frontend

```bash
cd pos-frontend

npm run build
```

## Run Frontend

```bash
cd pos-frontend

npm run dev
```

---

# Main Routes

| Route | Description |
|--------|-------------|
| /login | Login |
| /dashboard | Manager Dashboard |
| /products | Product Management |
| /users | User Management |
| /permissions | Permissions |
| /settings | Settings |
| /pos | POS Screen |
| /shifts | Shift Management |
| /returns | Product Returns |
| /account | User Profile |

---

# Business Rules

- A cashier must open a shift before making any sale.
- Returned quantities are restored to inventory.
- Returns create negative cash movements.
- Expected shift balance = Opening Balance + Cash Sales − Returns.
- Adding a product with the same name updates its stock instead of creating a duplicate record.
- Selected language is stored in Local Storage and automatically updates the page direction (RTL/LTR).

---

# Future Improvements

- Printable invoices.
- Advanced reporting.
- Barcode scanner support.
- Multi-store support.
- More detailed permission system.

---

# Project Status

This project was developed as a full-stack training project to demonstrate modern web application architecture using **Laravel** and **React**.

It implements the core functionality of a single-store Point of Sale system with a clear separation between the frontend and backend, following REST API architecture and role-based access control. The project is designed to be easily extendable with additional reporting, invoice printing, barcode support, and multi-branch functionality.
