import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './GroupChat.css';

const groupMembers = ['leesa', 'mohendran', 'deepan', 'sathish'];

const GroupChat = () => {
    const location = useLocation();
    const { username } = location.state || {};
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [userStatuses, setUserStatuses] = useState({});
    const websocketRef = useRef(null);

    useEffect(() => {
        fetchUserStatuses();
        fetchGroupMessages();

        const ws = new WebSocket(`ws://localhost:8000/ws/${username}`);
        websocketRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connection opened');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'message') {
                setMessages((prevMessages) => [...prevMessages, data.data]);
            } else if (data.type === 'status') {
                updateUserStatus(data.data);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [username]);

    const fetchUserStatuses = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/user_status');
            const data = await response.json();
            setUserStatuses(data);
        } catch (error) {
            console.error('Error fetching user statuses:', error);
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

    const handleSendMessage = async () => {
        if (newMessage.trim()) {
            const messageData = {
                sender: username,
                text: newMessage,
                room: 'opcode_convo',
                type: 'group',
            };

            try {
                await fetch('http://127.0.0.1:8000/send_message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(messageData),
                });

                setNewMessage('');

                if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                    websocketRef.current.send(JSON.stringify({
                        type: 'group',
                        room: 'opcode_convo',
                        sender: username,
                        text: newMessage,
                    }));
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    

    const updateUserStatus = (statusData) => {
        setUserStatuses(statusData);
    };

    return (
        <div className="chat-container">
            <div className="sidebar">
                <h3>Users</h3>
                <ul className="users-list">
                    {groupMembers.map((user) => (
                        <li key={user} className="user-item">
                            <span className="username">{user}</span>
                            <span className="status-container">
                                <span className={`status-dot ${userStatuses[user] === 'online' ? 'online' : 'offline'}`}></span>
                                <span className={`user-status-text ${userStatuses[user] === 'online' ? 'online' : 'offline'}`}>
                                    {userStatuses[user]}
                                </span>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="chat-content">
                <div className="chat-header">
                    <h1>Opcode Convo</h1>
                </div>
                <div className="chat-body">
                    <div className="messages-list" id="messages">
                        {messages.map((message, index) => (
                            <div key={index} className={`message-item ${message.sender === username ? 'sent' : 'received'}`}>
                                <div className="message-text">
                                    <span className="message-sender">{message.sender}: </span>
                                    <span>{message.text}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="message-input">
                    <input
                        type="text"
                        placeholder="Type a message"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button onClick={handleSendMessage}>Send</button>
                </div>
                <div className="username-display">
                    <p>Logged in as: {username}</p>
                </div>
            </div>
        </div>
    );
};

export default GroupChat;
