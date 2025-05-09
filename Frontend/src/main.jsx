import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Or './style/index.css' if preferred
import { WalletProvider } from '@suiet/wallet-kit';
import { NotificationProvider } from './components/NotificationProvider.jsx';
import '@suiet/wallet-kit/style.css'; // Import wallet kit styles

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <NotificationProvider>
    <StrictMode>
      <WalletProvider autoConnect={false}>
        <App />
      </WalletProvider>
    </StrictMode>
  </NotificationProvider>
);
