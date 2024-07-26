import React, { useState } from 'react';
import axios from 'axios';
import './UserForm.css';

const DeleteUser = () => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.delete(`http://127.0.0.1:8000/users/${username}`);
            if (response.status === 200) {
                setSuccess('User deleted successfully');
                setUsername('');
                setError('');
            }
        } catch (error) {
            setError('Error deleting user. Please try again.');
            console.error('Delete user error', error);
            setSuccess('');
        }
    };

    return (
        <div className="form-container">
            <h2>Delete User</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="field-label">Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Delete User</button>
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
            </form>
        </div>
    );
};

export default DeleteUser;
