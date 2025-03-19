# 🚌 Integrated Smart Shuttle System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22.14.0%20LTS-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)

Welcome to the **Integrated Smart Shuttle System** project! This project, developed by **Vlyde Angeles**, **Dolcielo Fuentes**, and **Lebrone Sacman** from **DLSU-D**, is built using the **MERN** stack (MongoDB, Express.js, React, Node.js). Our goal is to create a smart, efficient, and reliable shuttle tracking system for Camella Daang Hari, operated by MEx, a leading transportation company in the Philippines.

## 📜 Abstract

Camella Daang Hari's dynamic shuttle system, operated by MEx, a nation-wide transportation company established in 2008, has quirks that lead to inefficiencies and unpredictability affecting commuters. This study proposes developing an Integrated Smart Shuttle System to tackle these issues and enhance both efficiency and reliability. By incorporating real-time GPS tracking and advanced communication platforms, the system will improve communication between shuttles and passengers, provide timely and accurate notifications, and streamline commutes and shuttle operations. These upgrades will not only reduce unpredictability and increase accessibility for commuters but also support MEx employees by optimizing operational workflows. Ultimately, the goal is to enhance the overall commuter experience and optimize Camella's transportation network.

## 🚀 Features

- **Real-Time GPS Tracking**: Live location updates of shuttles with OpenStreetMap integration
- **Advanced Communication**: Improved communication channels between shuttles and passengers
- **Timely Notifications**: Smart alerts and notifications for shuttle schedules and delays
- **Operational Optimization**: Streamlined processes for MEx employees to manage shuttle operations
- **User Authentication**: Secure login and registration system for different user roles
- **Responsive Design**: Mobile-first approach ensuring great experience across all devices
- **Real-time Updates**: Live data synchronization using WebSocket connections

## 🛠️ Tech Stack

### Frontend
- React.js 18 with Vite
- OpenStreetMap with Leaflet for maps
- Socket.io-client for real-time updates
- React Router v6 for navigation
- TailwindCSS for styling
- React Query for state management
- Axios for API requests

### Backend
- Node.js & Express.js
- Socket.io for WebSocket connections
- JWT for authentication
- Bcrypt for password hashing
- Express-validator for input validation
- Morgan for HTTP request logging
- CORS for cross-origin resource sharing

### Database
- MongoDB with Mongoose ODM
- MongoDB Atlas for cloud hosting

### Development Tools
- Concurrently for running multiple scripts
- Nodemon for hot reloading
- ESLint & Prettier for code formatting
- Environment variables management with dotenv
- Git for version control

## 📁 Project Structure

```
shutl/
├── frontend/              # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   ├── utils/        # Utility functions
│   │   └── assets/       # Static assets
│   └── public/           # Public static files
├── backend/               # Backend Node.js application
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── utils/           # Utility functions
└── docs/                 # Documentation
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 22.14.0 LTS or higher
- MongoDB 6.x or higher
- Git

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/vldngls/shutl.git
   cd shutl
   ```

2. **Install Dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   Create `.env` files in both frontend and backend directories:

   Backend `.env`:
   ```env
   MONGO_URI=your_mongodb_uri
   PORT=5000
   JWT_SECRET=your_jwt_secret
   FRONTEND_ORIGIN=http://localhost:5173
   EMAIL_USER=your_email
   EMAIL_PASSWORD=your_email_app_password
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5173/ShutlLoggedOut
   ```

   Frontend `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

   > ⚠️ **Security Note**: Never commit your actual `.env` files to version control. The values shown above are placeholders. Make sure to:
   > - Keep your actual credentials secure
   > - Use different credentials for development and production
   > - Add `.env` to your `.gitignore` file

4. **Build the Project**
   ```bash
   # Build frontend
   cd frontend
   npm run build

   # Return to root directory
   cd ..
   ```

5. **Start the Application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run start
   ```

   This will start:
   - Frontend at: http://localhost:5173
   - Backend at: http://localhost:5000

## 🔧 Troubleshooting

Common issues and solutions:

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :5000
   # Kill process
   kill -9 <PID>
   ```

2. **MongoDB Connection Issues**
   - Ensure MongoDB is running
   - Check connection string in .env
   - Verify network connectivity

3. **Build Failures**
   - Clear node_modules and package-lock.json
   - Run `npm install` again
   - Check for version conflicts

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add: your feature description'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request

### Code Style Guidelines
- Follow ESLint configuration
- Use meaningful variable and function names
- Add comments for complex logic
- Write unit tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

For any questions or inquiries, please contact:

- **Vlyde Angeles** - <avp1102@dlsud.edu.ph>
- **Dolcielo Fuentes** - <dbf2010@dlsud.edu.ph>
- **Lebrone Sacman** - <slg1144@dlsud.edu.ph>

## 🙏 Acknowledgments

- MEx Transportation Company
- Camella Daang Hari
- DLSU-D Faculty and Staff
- OpenStreetMap Community
- All contributors and supporters

---

**Thank you for checking out our project! We hope it brings a positive impact on commuter experience and transportation management.**
