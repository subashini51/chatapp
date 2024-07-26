// src/components/CreateUser.js
import React, { useState } from 'react';
import axios from 'axios';
import './UserForm.css';

const CreateUser = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            await axios.post('http://127.0.0.1:8000/users', {
                username,
                hashed_password: password
            });
            setSuccess('User created successfully');
            setUsername('');
            setPassword('');
            setError('');
        } catch (error) {
            setError('Error creating user. Please try again.');
            console.error('Create user error', error);
        }
    };

    return (
        <div className="user-form-container">
            <h2>Create User</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Create User</button>
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
            </form>
        </div>
    );
};

export default CreateUser;
