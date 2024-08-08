import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import logo from './images/download.png'; // Import your logo image

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('http://127.0.0.1:8000/login', {
                username,
                password
            });
            const { token } = response.data;
            navigate('/chat', { state: { username, token } });
        } catch (error) {
            setError('Login failed. Please check your username and password.');
            console.error('Login error', error);
        }
    };

    return (
        <div className="container">
            <div className="logo-box">
                <img src={logo} alt="Logo" className="logo" /> {/* Use the imported logo here */}
            </div>
            <div className="login-box">
                <h2>Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn">Login</button>
                    {error && <p className="error-message">{error}</p>}
                </form>
                <div className="signup-link">
                    <p>Don't have an account? <Link to="/signup">Signup</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
