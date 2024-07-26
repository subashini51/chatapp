import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './Chat.css';

const Chat = () => {
    const location = useLocation();
    const { username, token } = location.state || {};
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [chatType, setChatType] = useState('group');
    const [selectedUser, setSelectedUser] = useState('');
    const [userStatuses, setUserStatuses] = useState({});
    const websocketRef = useRef(null);

    useEffect(() => {
        // Fetch user statuses from the backend
        const fetchUserStatuses = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/user_status');
                const data = await response.json();
                setUserStatuses(data);
            } catch (error) {
                console.error('Error fetching user statuses:', error);
            }
        };

        fetchUserStatuses();
    }, []);

    useEffect(() => {
        // Establish WebSocket connection
        if (username && token) {
            const websocket = new WebSocket(`ws://127.0.0.1:8000/ws/${username}?token=${token}`);
            websocketRef.current = websocket;

            websocket.onopen = () => {
                console.log('WebSocket connection opened');
            };

            websocket.onmessage = (event) => {
                try {
                    const messageData = JSON.parse(event.data);
                    if (messageData.type === 'status') {
                        setUserStatuses(messageData.data);
                    } else if (messageData.type === 'message') {
                        setMessages((prevMessages) => [...prevMessages, messageData.data]);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            websocket.onclose = () => {
                console.log('WebSocket connection closed');
            };

            websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            return () => {
                if (websocketRef.current) {
                    websocketRef.current.close();
                }
            };
        }
    }, [username, token]);

    const sendMessage = () => {
        if (input.trim() === '') return;

        const ws = websocketRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                const message = chatType === 'one-to-one' && selectedUser
                    ? `${selectedUser}:${input}`  // Format for one-to-one chat
                    : input;  // Group chat (send as is)

                // Send message to WebSocket server
                ws.send(message);

                // Append message to sender's message list
                const formattedMessage = chatType === 'one-to-one' && selectedUser
                    ? `${username} to ${selectedUser}: ${input}`
                    : `${username}: ${input}`;

                setMessages((prevMessages) => [...prevMessages, formattedMessage]);

                setInput('');
            } catch (error) {
                console.error('Error sending message:', error);
            }
        } else {
            console.error('WebSocket connection is not open');
        }
    };

    const handleChatTypeChange = (type) => {
        setChatType(type);
        setSelectedUser('');
    };

    const handleUserClick = (user) => {
        if (chatType === 'one-to-one') {
            setSelectedUser(user);
        }
    };

    return (
        <div className="chat-container">
            <div className="sidebar">
                <h3>Users</h3>
                <div className="chat-type-buttons">
                    <button onClick={() => handleChatTypeChange('one-to-one')}>One-to-One</button>
                    <button onClick={() => handleChatTypeChange('group')}>Group Chat</button>
                </div>
                <ul>
                    {Object.keys(userStatuses).map((user, index) => (
                        <li
                            key={index}
                            onClick={() => handleUserClick(user)}
                            className={selectedUser === user ? 'selected' : ''}
                        >
                            {user}
                            <span className={`status ${userStatuses[user] === 'online' ? 'online' : 'offline'}`}>
                                {userStatuses[user] === 'online' ? '●' : '○'}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="chat-content">
                <div className="chat-header">
                    <h2>{chatType === 'group' ? `Group Chat - ${username}` : `One-to-One Chat - ${selectedUser}`}</h2>
                </div>
                <div className="chat-body">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.startsWith(username) ? 'sent' : 'received'}`}>
                            <div className="content">{msg}</div>
                        </div>
                    ))}
                </div>
                <div className="message-input">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') sendMessage();
                        }}
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
