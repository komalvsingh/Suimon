import { useState } from 'react';
import './App.css'; // or './style/App.css' if needed
import { useWallet } from '@suiet/wallet-kit';
import ConnectButtonWrapper from './components/ConnectButtonWrapper.jsx';
import WalletDashboard from './components/WalletDashboard.jsx';
import CreatureCollection from './components/CreatureCollection.jsx';
import BattleArena from './components/BattleArena.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import Home from './pages/Home'; // Optional if you still want to use Home later

function App() {
  const [activeTab, setActiveTab] = useState('wallet');
  const wallet = useWallet();

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Header */}
      <header className="bg-surface p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">SuiMon</h1>
          <div className="flex space-x-2">
            <ConnectButtonWrapper className="bg-primary hover:bg-primary/80 px-4 py-2 rounded-md" />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-surface/50 p-2">
        <div className="container mx-auto flex space-x-4">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2 rounded-md ${activeTab === 'wallet' ? 'bg-primary text-white' : 'hover:bg-surface'}`}
          >
            Wallet
          </button>
          <button
            onClick={() => setActiveTab('creatures')}
            className={`px-4 py-2 rounded-md ${activeTab === 'creatures' ? 'bg-primary text-white' : 'hover:bg-surface'}`}
          >
            Creatures
          </button>
          <button
            onClick={() => setActiveTab('battle')}
            className={`px-4 py-2 rounded-md ${activeTab === 'battle' ? 'bg-primary text-white' : 'hover:bg-surface'}`}
          >
            Battle Arena
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-md ${activeTab === 'leaderboard' ? 'bg-primary text-white' : 'hover:bg-surface'}`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-2 rounded-md ${activeTab === 'home' ? 'bg-primary text-white' : 'hover:bg-surface'}`}
          >
            Home
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {activeTab === 'wallet' && <WalletDashboard wallet={wallet} />}
        {activeTab === 'creatures' && <CreatureCollection wallet={wallet} />}
        {activeTab === 'battle' && <BattleArena wallet={wallet} />}
        {activeTab === 'leaderboard' && <Leaderboard wallet={wallet} />}
        {activeTab === 'home' && <Home />} 
      </main>
    </div>
  );
}

export default App;
