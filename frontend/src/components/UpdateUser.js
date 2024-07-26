// src/components/UpdateUser.js
import React, { useState } from 'react';
import axios from 'axios';
import './UserForm.css';

const UpdateUser = () => {
    const [formState, setFormState] = useState({ username: '', newUsername: '', password: '' });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`http://127.0.0.1:8000/users/${formState.username}`, {
                username: formState.newUsername,
                password: formState.password
            });
            setMessage(response.data.message);
        } catch (error) {
            setMessage('Error updating user: ' + error.response.data.detail);
        }
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                <h2>Update User</h2>
                <input
                    type="text"
                    name="username"
                    placeholder="Current Username"
                    value={formState.username}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="newUsername"
                    placeholder="New Username"
                    value={formState.newUsername}
                    onChange={handleChange}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="New Password"
                    value={formState.password}
                    onChange={handleChange}
                />
                <button type="submit">Update</button>
                {message && <p>{message}</p>}
            </form>
        </div>
    );
};

export default UpdateUser;
