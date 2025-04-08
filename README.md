
# MERN Chat App

This is a simple real-time chat application built using the MERN stack: **MongoDB, Express.js, React.js, and Node.js**, along with **Socket.io** for real-time communication.

## Features

### 1. **User Authentication**
- Users can register and log in securely.
- Passwords are hashed using bcrypt.
- JSON Web Tokens (JWT) are used to manage user sessions securely.

### 2. **Real-Time Messaging**
- Uses Socket.io to enable real-time chat functionality.
- Messages are sent and received instantly between connected users without reloading the page.

### 3. **One-to-One Chat**
- Users can select another user to chat with privately.
- Chats are isolated and stored for each user pair.

### 4. **Chat History**
- All chat messages are stored in a MongoDB database.
- Users can see previous conversations when they return.

### 5. **Online Status**
- Basic online/offline status indicator for users.
- Updates in real-time as users connect or disconnect.

### 6. **Responsive Design**
- Frontend is built using React and styled for mobile and desktop compatibility.
- Clean and user-friendly interface.

### 7. **Modular Code Structure**
- Backend and frontend are separated for better organization and scalability.
- Code is organized in models, routes, and components for clarity.
