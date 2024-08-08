import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Chat.css';

// Import images based on usernames
const userProfilePics = {
    suba: require('./images/Frame 11.png'),
    sindhu: require('./images/Frame 11.png'),
    dhamodhran: require('./images/Frame 10.png'),
    leesa: require('./images/Frame 11.png'),
    mohendran: require('./images/Frame 30.png'),
    deepan: require('./images/Frame 12 (1).png'),
    sathish: require('./images/Frame 12.png'),
    opcodeconvo: require('./images/Frame 1.png'),
};

const allowedUsers = ['deepan', 'mohendran', 'leesa', 'sathish'];

const Chat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { username, token } = location.state || {};
    const [messages, setMessages] = useState(() => {
        const storedMessages = localStorage.getItem(`chatMessages_${username}`);
        return storedMessages ? JSON.parse(storedMessages) : [];
    });
    const [input, setInput] = useState('');
    const [chatType, setChatType] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [userStatuses, setUserStatuses] = useState({});
    const websocketRef = useRef(null);

    useEffect(() => {
        const fetchUserStatuses = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/user_status');
                const data = await response.json();
                if (data && typeof data === 'object') {
                    setUserStatuses(data);
                } else {
                    console.error('Invalid user status data:', data);
                }
            } catch (error) {
                console.error('Error fetching user statuses:', error);
            }
        };

        fetchUserStatuses();
    }, []);

    useEffect(() => {
        if (username && token) {
            const ws = new WebSocket(`ws://127.0.0.1:8000/ws/${username}`);
            websocketRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connection opened');
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log('Received message:', message);
                if (message.type === 'message') {
                    setMessages((prevMessages) => {
                        const updatedMessages = [...prevMessages, message.data];
                        localStorage.setItem(`chatMessages_${username}`, JSON.stringify(updatedMessages));
                        return updatedMessages;
                    });
                } else if (message.type === 'status') {
                    setUserStatuses(message.data);
                } else if (message.type === 'error') {
                    console.error(message.data);
                }
            };

            ws.onclose = () => {
                console.log('WebSocket connection closed');
                setTimeout(() => {
                    console.log('Reconnecting...');
                    websocketRef.current = new WebSocket(`ws://127.0.0.1:8000/ws/${username}`);
                }, 2000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            return () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            };
        }
    }, [username, token]);

    const sendMessage = () => {
        if (input.trim() !== '') {
            const message = {
                user: username,
                text: input.trim(),
                type: chatType === 'one-to-one' ? 'one-to-one' : 'group',
                recipient: chatType === 'one-to-one' ? selectedUser : undefined,
                room: chatType === 'group' ? 'opcode convo' : undefined,
            };

            if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                websocketRef.current.send(JSON.stringify(message));
                console.log('Sent message:', message);
                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages, message];
                    localStorage.setItem(`chatMessages_${username}`, JSON.stringify(updatedMessages));
                    return updatedMessages;
                });
                setInput(''); // Clear input after sending
            } else {
                console.error('WebSocket connection is not open');
            }
        }
    };

    const handleUserSelect = (user) => {
        setChatType('one-to-one');
        setSelectedUser(user);
        const storedMessages = localStorage.getItem(`chatMessages_${username}_${user}`);
        setMessages(storedMessages ? JSON.parse(storedMessages) : []);
    };

    const handleGroupChat = () => {
        if (allowedUsers.includes(username)) {
            setChatType('group');
            setSelectedUser('opcode convo');
            fetchGroupMessages();
            navigate('/group-chat', { state: { username } });
        } else {
            alert('You are not allowed to access the group chat.');
        }
    };

    const fetchGroupMessages = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/group_messages/opcode_convo');
            const data = await response.json();
            if (data && data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching group messages:', error);
        }
    };

    return (
        <div className="chat-container">
            <div className="sidebar">
                <h3>Users</h3>
                <ul className="users-list">
                    {Object.keys(userStatuses).length > 0 ? (
                        Object.keys(userStatuses).map((user) => (
                            <li
                                key={user}
                                className={`user-item ${userStatuses[user] === 'online' ? 'online' : 'offline'}`}
                                onClick={() => handleUserSelect(user)}
                            >
                                <img src={userProfilePics[user]} alt={`${user} profile`} className="profile-pic" />
                                <div className="user-info">
                                    <span className="username">{user}</span>
                                    <div className="status-container">
                                        <span className={`status-dot ${userStatuses[user]}`}></span>
                                        <span className="user-status-text">{userStatuses[user]}</span>
                                    </div>
                                </div>
                            </li>
                        ))
                    ) : (
                        <li>No users available</li>
                    )}
                    <li className="user-item" onClick={handleGroupChat}>
                        <img src={userProfilePics['opcodeconvo']} alt="opcode convo group" className="profile-pic" />
                        <div className="user-info">
                            <span className="username">opcode convo - Group</span>
                            <span className="user-status-text">Online</span>
                        </div>
                    </li>
                </ul>
            </div>
            <div className="chat-content">
                <div className="chat-header">
                    <div className="user-info">
                        <img src={userProfilePics[username]} alt={`${username} profile`} className="profile-pic" />
                        <div className="username-status">
                            <span className="username">{username}</span>
                            <div className="status-container">
                                <span className={`status-dot ${userStatuses[username]}`}></span>
                                <span className="user-status-text">{userStatuses[username]}</span>
                            </div>
                        </div>
                    </div>
                    {chatType === 'one-to-one' && <h3>Chat with {selectedUser}</h3>}
                </div>

                <div className="chat-body">
                    <div className="messages-list">
                        {messages.map((message, index) => (
                            <div key={index} className="message-item">
                                <strong>{message.user}:</strong> {message.text}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="message-input">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message"
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
