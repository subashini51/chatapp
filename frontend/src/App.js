import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login'; // Assuming you have a Login component
import Signup from './components/signup';
import Chat from './components/Chat';

function App() {
    return (
        <Router>
            <Routes>
                {/* Route for login page */}
                <Route path="/" element={<Login />} />
                
                {/* Route for signup page */}
                <Route path="/signup" element={<Signup />} />
                
                {/* Route for chat page */}
                <Route path="/chat" element={<Chat />} />
            </Routes>
        </Router>
    );
}

export default App;
