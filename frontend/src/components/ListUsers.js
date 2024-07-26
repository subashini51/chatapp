// src/components/ListUsers.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ListUsers.css';

const ListUsers = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/users');
                setUsers(response.data.users);
            } catch (error) {
                setError('Error fetching users. Please try again.');
                console.error('Fetch users error', error);
            }
        };

        fetchUsers();
    }, []);

    return (
        <div className="list-users-container">
            <h2>Users List</h2>
            {error && <p className="error">{error}</p>}
            <ul>
                {users.map((user) => (
                    <li key={user}>{user}</li>
                ))}
            </ul>
        </div>
    );
};

export default ListUsers;
