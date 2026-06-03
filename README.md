# 🏗️ Vighnaharta Developers — Plot Management System

A full-stack real estate plot management system built with **Next.js 14**, **MongoDB**, **Material UI**, and **React Konva**.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
```
Edit `.env.local` and fill in:
```
MONGODB_URI=mongodb://localhost:27017/vighnaharta
JWT_SECRET=your-super-secret-key-min-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Seed the database (creates first admin)
```bash
node lib/seed.js
```
Default admin credentials:
- **Email:** admin@vighnaharta.dev
- **Password:** admin@123

### 4. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 👥 User Roles

| Feature | Admin | Agent |
|---------|-------|-------|
| View projects & canvas | ✅ | ✅ |
| Create/edit/delete projects | ✅ | ❌ |
| Draw plots on canvas | ✅ | ❌ |
| Edit plot status & details | ✅ | ❌ |
| View plot + customer info | ✅ | ✅ (read-only) |
| Manage agents | ✅ | ❌ |
| Manage customers | ✅ | ❌ |

---

## 🗂️ Project Structure

```
vighnaharta/
├── app/
│   ├── page.js                    # Landing page
│   ├── login/page.js              # Login page
│   ├── dashboard/page.js          # Dashboard (stats)
│   ├── projects/
│   │   ├── page.js                # Projects list
│   │   └── [id]/canvas/page.js   # Canvas designer
│   ├── agents/page.js             # Agent management
│   ├── customers/page.js          # Customer management
│   └── api/                       # All API routes
│       ├── auth/login|logout|me
│       ├── projects/
│       ├── plots/
│       ├── agents/
│       ├── customers/
│       └── dashboard/
├── components/
│   ├── layout/AppShell.js         # Sidebar + header layout
│   ├── canvas/
│   │   ├── ProjectCanvas.js       # Main Konva canvas
│   │   ├── CanvasToolbar.js       # Tool palette
│   │   ├── PlotFormDialog.js      # Plot create/edit dialog
│   │   ├── PlotDetailDrawer.js    # Plot info side drawer
│   │   ├── RoadFormDialog.js      # Road details dialog
│   │   └── AmenityPicker.js       # Amenity icon picker
│   ├── projects/AddProjectDialog.js
│   └── agents/AddAgentDialog.js
├── models/                        # Mongoose models
│   ├── User.js
│   ├── Project.js
│   ├── Plot.js
│   └── Customer.js
├── lib/
│   ├── db.js                      # MongoDB connection
│   ├── auth.js                    # JWT utilities + withAuth HOC
│   ├── theme.js                   # MUI theme
│   ├── constants.js               # Status colors, tool types
│   └── seed.js                    # DB seed script
├── hooks/
│   └── useAuth.js                 # Auth context + hook
└── middleware.js                   # Next.js edge middleware
```

---

## 🎨 Canvas Tools

| Tool | Description |
|------|-------------|
| Select | Click to select and view plots |
| Rectangle | Drag to draw rectangular plot |
| Polygon | Click points, double-click to close |
| Road | Click points to draw road, double-click to finish |
| Amenity | Place garden/temple/parking icons |
| Text | Add text labels anywhere |
| Delete | Click a plot to delete it |
| Pan | Drag to pan the canvas |

**Zoom:** Mouse wheel to zoom in/out

---

## 🎨 Plot Status Colors

| Status | Color |
|--------|-------|
| Available | 🟢 Green (#4caf50) |
| Token | 🟡 Yellow (#ffeb3b) |
| Booked | 🔵 Blue (#2196f3) |
| Half Payment | 🟠 Orange (#ff9800) |
| Sold | 🔴 Red (#f44336) |

---

## 🔒 Security

- Passwords hashed with **bcryptjs** (12 salt rounds)
- Auth via **JWT** in **HTTP-only cookies** (not accessible to JS)
- All API routes protected by role-based middleware
- Edge middleware redirects unauthenticated users
- Never exposes password fields in API responses

---

## 📦 Tech Stack

- **Frontend:** Next.js 14 App Router, Material UI v5, React Konva
- **Backend:** Next.js API Routes
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs
- **Notifications:** notistack
