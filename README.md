
# 📺 Watchly - Video Sharing Backend

Watchly is a scalable backend for a full-featured video-sharing platform, built using **Node.js**, **Express**, and **MongoDB**. It supports user authentication, video uploads, comments, playlists, subscriptions, tweets, likes, watch history, and more — following modern RESTful principles.

---

## 📚 API Documentation

👉 <a href="https://documenter.getpostman.com/view/44539469/2sB34fn22J" target="_blank">Click here to view full API documentation</a>

---

## ✨ Features

- JWT-based authentication with refresh tokens
- Cloudinary integration for video and image uploads
- Playlist creation and video management
- Tweet-style posting
- Comment system with pagination
- Likes on tweets, comments, and videos
- Subscriptions (channel following)
- Watch history tracking
- Advanced filtering and pagination on most routes

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, Cookies
- **Cloud Storage**: Cloudinary
- **File Upload**: Multer
- **Pagination**: mongoose-aggregate-paginate-v2

---

## ⚙️ Installation & Setup

```bash
# Clone the repository
git clone https://github.com/HamzaDevelops42/Watchly-backend.git
cd watchly-backend

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 🧪 Scripts

| Script         | Description                                |
|----------------|--------------------------------------------|
| `npm run dev`  | Starts server with nodemon and loads `.env` |
| `npm start`    | Starts server in production with `.env` loaded |

---

## 📁 Folder Structure

```
/src
  ├── controllers     # Request handlers (videos, users, subscriptions, etc.)
  ├── routes          # Express route definitions
  ├── models          # Mongoose schemas (User, Video, Like, etc.)
  ├── middlewares     # Auth middleware, file upload (multer), error handler
  ├── utils           # Helpers: ApiError, ApiResponse, Cloudinary utilities
  ├── config          # DB config, Cloudinary config
  └── index.js        # Entry point of the server
/public
  └── temp            # Temporary local file storage (used by Multer before Cloudinary upload)
/.env.sample          # Environment variable sample
package.json          # Scripts and dependencies

```

---

## 🌍 Environment Variables

You must create a `.env` file in the root directory. Use the following as a reference:

```
# Port
PORT=8000

# MongoDB
MONGODB_URI=your_mongodb_uri

# JWT Auth
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📜 License

This project is licensed under the **MIT License**.
