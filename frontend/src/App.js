import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Chat from './components/Chat';
import GroupChat from './components/GroupChat';

function App() {
    const username = 'your_username_here'; // Replace with actual logic to get username

    return (
        <Router>
            <Routes>
                {/* Route for login page */}
                <Route path="/" element={<Login />} />
                
                {/* Route for signup page */}
                <Route path="/signup" element={<Signup />} />
                
                {/* Route for chat page */}
                <Route path="/chat" element={<Chat />} />
                
                {/* Route for group chat page */}
                <Route path="/group-chat" element={<GroupChat username={username} />} />
                {/* Add other routes as needed */}
            </Routes>
        </Router>
    );
}

export default App;
