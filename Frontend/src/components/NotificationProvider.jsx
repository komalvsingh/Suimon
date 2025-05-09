import { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [
      ...prev,
      { id, message, type }
    ]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg border ${
              notification.type === 'success' 
                ? 'bg-green-500/10 border-green-500 text-green-500' 
                : notification.type === 'error'
                ? 'bg-red-500/10 border-red-500 text-red-500'
                : 'bg-surface border-primary text-primary'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  return useContext(NotificationContext);
};