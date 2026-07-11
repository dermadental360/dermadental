# DermaDental360 Clinic Portal

DermaDental360 is a premium, clinic-selected skincare and haircare catalog and administration portal.

## Database & Tech Stack
- **Framework**: Next.js 15
- **ORM**: Prisma ORM
- **Database**: SQLite (Local file-based database)

---

## Local Setup Instructions

Follow these steps to run the project locally without requiring any external database services:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a file named `.env.local` (or copy `.env.example` to `.env`) in the root directory:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret-key-goes-here"
ADMIN_EMAIL="admin@dermadental360.com"
ADMIN_PASSWORD="change-this-admin-password"
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Create and Apply Database Migrations
Initialize the local SQLite database (`dev.db`):
```bash
npx prisma migrate dev --name init
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Admin Portal & Credentials
- **Admin Path**: `/admin`
- **Default Login Email**: `admin@dermadental360.com`
- **Default Password**: The password defined under `ADMIN_PASSWORD` in your local `.env.local` or `.env` file.

*Note: Product images uploaded from the admin panel are stored locally under the `/public/uploads/products` folder and saved as paths in the SQLite database.*
