import { useState, useEffect } from "react";
import "./App.css";
import { useWallet } from "@suiet/wallet-kit";
import ConnectButtonWrapper from "./components/ConnectButtonWrapper.jsx";
import WalletDashboard from "./components/WalletDashboard.jsx";
import CreatureCollection from "./components/CreatureCollection.jsx";
import BattleArena from "./components/BattleArena.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import DetailPage from "./components/DetailPage";
import StarterPickerPage from "./pages/StarterPickerPage";
import GameBoard from "./pages/GameBoard";
import PokemonGymBattle from "./game/PokemonGymBrawler.jsx";
import PokemonBattle from "./brawl/PokemonBattle.jsx";
import { Web3Provider } from "./game/web3Context.jsx";
import PokemonPuzzleRush from "./components/BattleArena.jsx";
import MemeDAOInterface from "./pages/DAO.jsx";

function App() {
  const [activeTab, setActiveTab] = useState("wallet");
  const [animate, setAnimate] = useState(false);
  const wallet = useWallet();

  // Animation effect when changing tabs
  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => {
      setAnimate(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Glowing effect for fluorescent elements
  const glowingEffect = "animate-pulse shadow-lg";
  
  // Fluorescent colors
  const colors = {
    primary: "text-fuchsia-500",
    secondary: "text-cyan-400",
    accent1: "text-lime-400",
    accent2: "text-purple-500",
    accent3: "text-pink-500",
    accent4: "text-emerald-400"
  };
  
  const bgColors = {
    primary: "bg-fuchsia-500",
    secondary: "bg-cyan-400",
    accent1: "bg-lime-400",
    accent2: "bg-purple-500",
    accent3: "bg-pink-500",
    accent4: "bg-emerald-400"
  };

  const getNeonBorder = (tabName) => {
    if (activeTab === tabName) {
      switch(tabName) {
        case "wallet": return "border-b-2 border-fuchsia-500 shadow-fuchsia-500/50";
        case "creatures": return "border-b-2 border-cyan-400 shadow-cyan-400/50";
        case "battle": return "border-b-2 border-lime-400 shadow-lime-400/50";
        case "leaderboard": return "border-b-2 border-purple-500 shadow-purple-500/50";
        case "pokidesk": return "border-b-2 border-pink-500 shadow-pink-500/50";
        case "starter-picker": return "border-b-2 border-emerald-400 shadow-emerald-400/50";
        case "tcg": return "border-b-2 border-yellow-400 shadow-yellow-400/50";
        case "gym-brawler": return "border-b-2 border-orange-400 shadow-orange-400/50";
        case "pokemon-brawl": return "border-b-2 border-red-400 shadow-red-400/50";
        default: return "border-b-2 border-fuchsia-500";
      }
    }
    return "";
  };

  const getTabColor = (tabName) => {
    switch(tabName) {
      case "wallet": return colors.primary;
      case "creatures": return colors.secondary;
      case "battle": return colors.accent1;
      case "leaderboard": return colors.accent2;
      case "pokidesk": return colors.accent3;
      case "starter-picker": return colors.accent4;
      case "tcg": return "text-yellow-400";
      case "gym-brawler": return "text-orange-400";
      case "pokemon-brawl": return "text-red-400";
      default: return colors.primary;
    }
  };

  return (
    <Router>
      <Web3Provider>
      <div className="min-h-screen bg-gray-900 text-gray-100 transition-all duration-300 ease-in-out">
        {/* Header with neon glow */}
        <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 p-6 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className={`${bgColors.primary} w-3 h-8 rounded-full ${glowingEffect}`}></div>
              <div className={`${bgColors.secondary} w-3 h-8 rounded-full ${glowingEffect}`}></div>
              <div className={`${bgColors.accent1} w-3 h-8 rounded-full ${glowingEffect}`}></div>
              <h1 className={`text-4xl font-bold ${colors.primary} ml-4 tracking-widest transition-all duration-300 hover:scale-105 hover:text-fuchsia-400`}>
                SuiMon
    
              </h1>
            </div>
            <div className="flex space-x-4 items-center">
              <div className="hidden md:block">
                <div className="flex space-x-2">
                  <div className={`h-3 w-3 rounded-full ${bgColors.primary} animate-pulse`}></div>
                  <div className={`h-3 w-3 rounded-full ${bgColors.secondary} animate-pulse delay-100`}></div>
                  <div className={`h-3 w-3 rounded-full ${bgColors.accent1} animate-pulse delay-200`}></div>
                </div>
              </div>
              <ConnectButtonWrapper className={`${bgColors.primary} hover:bg-fuchsia-600 px-6 py-3 rounded-lg font-bold shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 transition-all duration-300 transform hover:scale-105`} />
            </div>
          </div>
        </header>

        {/* Navigation Tabs with neon highlight effect */}
        <nav className="bg-gray-800/60 p-4 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-700">
          <div className="container mx-auto flex flex-wrap justify-center md:justify-between gap-4">
            {[
              { id: "wallet", name: "Wallet" },
              { id: "creatures", name: "Creatures" },
              { id: "battle", name: "Pokemon Puzzle Rush" },
              { id: "leaderboard", name: "Leaderboard" },
              { id: "pokidesk", name: "My PokiDesk" },
              { id: "starter-picker", name: "Mint Starter" },
              { id: "dao", name: "Dao" },
              { id: "tcg", name: "Pokemon Game-tcg" },
              { id: "gym-brawler", name: "Gym Brawler" },
              { id: "pokemon-brawl", name: "Pokemon Brawl" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md ${getNeonBorder(tab.id)} ${getTabColor(tab.id)} transition-all duration-300 hover:bg-gray-700/50 hover:scale-105 ${
                  activeTab === tab.id && "font-bold text-xl"
                }`}
              >
                {tab.name}
                {activeTab === tab.id && (
                  <div className="h-0.5 mt-1 bg-gradient-to-r from-transparent via-current to-transparent animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content with animation effect */}
        <main className={`container mx-auto p-6 transition-all duration-500 ${animate ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl min-h-screen">
            {activeTab === "wallet" && (
              <div className="animate-fadeIn">
                <WalletDashboard wallet={wallet} />
              </div>
            )}
            {activeTab === "creatures" && (
              <div className="animate-fadeIn">
                <CreatureCollection wallet={wallet} />
              </div>
            )}
            {activeTab === "battle" && (
              <div className="animate-fadeIn">
                <PokemonPuzzleRush wallet={wallet} />
              </div>
            )}
            {activeTab === "leaderboard" && (
              <div className="animate-fadeIn">
                <Leaderboard wallet={wallet} />
              </div>
            )}
            {activeTab === "starter-picker" && (
              <div className="animate-fadeIn">
                <StarterPickerPage />
              </div>
            )}
            {activeTab === "dao" && (
              <div className="animate-fadeIn">
                <MemeDAOInterface />
              </div>
            )}
            {activeTab === "tcg" && (
              <div className="animate-fadeIn">
                <GameBoard wallet={wallet} />
              </div>
            )}
            {activeTab === "gym-brawler" && (
              <div className="animate-fadeIn">
                <PokemonGymBattle />
              </div>
            )}
            {activeTab === "pokemon-brawl" && (
              <div className="animate-fadeIn">
                <PokemonBattle />
              </div>
            )}
            {activeTab === "pokidesk" && (
              <div className="animate-fadeIn">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/detail/:id" element={<DetailPage />} />
                  <Route path="/starter-picker" element={<StarterPickerPage />} />
                </Routes>
              </div>
            )}
          </div>
        </main>

        {/* Footer with neon accent */}
        <footer className="bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 p-4 mt-8">
          <div className="container mx-auto flex justify-between items-center">
            <div className={`${colors.primary} text-sm`}>SuiMon © 2025</div>
            <div className="flex space-x-3">
              {[bgColors.primary, bgColors.secondary, bgColors.accent1, bgColors.accent2].map((color, index) => (
                <div key={index} className={`w-2 h-2 rounded-full ${color} animate-pulse`} style={{ animationDelay: `${index * 0.2}s` }}></div>
              ))}
            </div>
          </div>
        </footer>
      </div>
      </Web3Provider>
    </Router>
  );
}

export default App;