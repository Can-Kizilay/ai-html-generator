import React, { useState, useEffect } from 'react';
import './Toaster.css'; // We'll create this CSS file next

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToasterProps {
  messages: ToastMessage[];
  removeMessage: (id: string) => void;
}

const Toaster: React.FC<ToasterProps> = ({ messages, removeMessage }) => {
  return (
    <div className="toaster-container">
      {messages.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => removeMessage(toast.id)}>&times;</button>
        </div>
      ))}
    </div>
  );
};

export default Toaster;
