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
  // Start with mint starter as the default tab
  const [activeTab, setActiveTab] = useState("mint-starter");
  const [animate, setAnimate] = useState(false);
  const [headerGlow, setHeaderGlow] = useState(false);
  const [tabHover, setTabHover] = useState("");
  const [footerPulse, setFooterPulse] = useState(0);
  const [showAllTabs, setShowAllTabs] = useState(false);
  const wallet = useWallet();

  // Enhanced animation effect when changing tabs
  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => {
      setAnimate(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Header glow animation
  useEffect(() => {
    const glowInterval = setInterval(() => {
      setHeaderGlow(prev => !prev);
    }, 2000);
    return () => clearInterval(glowInterval);
  }, []);

  // Footer pulse animation
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setFooterPulse(prev => (prev + 1) % 4);
    }, 800);
    return () => clearInterval(pulseInterval);
  }, []);

  // Enhanced glowing effect for fluorescent elements
  const glowingEffect = "animate-pulse shadow-lg transform hover:scale-110 transition-all duration-300";
  const strongGlow = "drop-shadow-[0_0_15px_currentColor] animate-pulse";
  
  // Enhanced fluorescent colors
  const colors = {
    primary: "text-fuchsia-500",
    secondary: "text-cyan-400",
    accent1: "text-lime-400",
    accent2: "text-purple-500",
    accent3: "text-pink-500",
    accent4: "text-emerald-400",
    accent5: "text-yellow-400",
    accent6: "text-orange-400",
    accent7: "text-red-400"
  };
  
  const bgColors = {
    primary: "bg-fuchsia-500",
    secondary: "bg-cyan-400",
    accent1: "bg-lime-400",
    accent2: "bg-purple-500",
    accent3: "bg-pink-500",
    accent4: "bg-emerald-400",
    accent5: "bg-yellow-400",
    accent6: "bg-orange-400",
    accent7: "bg-red-400"
  };

  const getNeonBorder = (tabName) => {
    if (activeTab === tabName) {
      switch(tabName) {
        case "mint-starter": return "border-b-4 border-emerald-400 shadow-[0_4px_20px_rgba(52,211,153,0.6)] animate-pulse";
        case "wallet": return "border-b-4 border-fuchsia-500 shadow-[0_4px_20px_rgba(236,72,153,0.6)] animate-pulse";
        case "creatures": return "border-b-4 border-cyan-400 shadow-[0_4px_20px_rgba(34,211,238,0.6)] animate-pulse";
        case "battle": return "border-b-4 border-lime-400 shadow-[0_4px_20px_rgba(163,230,53,0.6)] animate-pulse";
        case "leaderboard": return "border-b-4 border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.6)] animate-pulse";
        case "pokidesk": return "border-b-4 border-pink-500 shadow-[0_4px_20px_rgba(236,72,153,0.6)] animate-pulse";
        case "dao": return "border-b-4 border-yellow-400 shadow-[0_4px_20px_rgba(250,204,21,0.6)] animate-pulse";
        case "tcg": return "border-b-4 border-orange-400 shadow-[0_4px_20px_rgba(251,146,60,0.6)] animate-pulse";
        case "gym-brawler": return "border-b-4 border-red-400 shadow-[0_4px_20px_rgba(248,113,113,0.6)] animate-pulse";
        case "pokemon-brawl": return "border-b-4 border-indigo-400 shadow-[0_4px_20px_rgba(129,140,248,0.6)] animate-pulse";
        default: return "border-b-4 border-emerald-400";
      }
    }
    return "border-b-2 border-transparent hover:border-gray-500 transition-all duration-300";
  };

  const getTabColor = (tabName) => {
    const baseColor = (() => {
      switch(tabName) {
        case "mint-starter": return colors.accent4;
        case "wallet": return colors.primary;
        case "creatures": return colors.secondary;
        case "battle": return colors.accent1;
        case "leaderboard": return colors.accent2;
        case "pokidesk": return colors.accent3;
        case "dao": return colors.accent5;
        case "tcg": return colors.accent6;
        case "gym-brawler": return colors.accent7;
        case "pokemon-brawl": return "text-indigo-400";
        default: return colors.accent4;
      }
    })();
    
    if (activeTab === tabName) {
      return `${baseColor} ${strongGlow} font-bold`;
    }
    return `${baseColor} hover:${strongGlow} transition-all duration-300`;
  };

  // All tabs data
  const allTabs = [
    { id: "mint-starter", name: "🌟 Mint Starter", priority: 1 },
    { id: "wallet", name: "💰 Wallet", priority: 1 },
    { id: "creatures", name: "👾 Creatures", priority: 1 },
    { id: "battle", name: "⚔️ Pokemon Puzzle Rush", priority: 2 },
    { id: "leaderboard", name: "🏆 Leaderboard", priority: 2 },
    { id: "pokidesk", name: "📱 My PokiDesk", priority: 2 },
    { id: "dao", name: "🏛️ DAO", priority: 3 },
    { id: "tcg", name: "🎴 Pokemon Game-TCG", priority: 3 },
    { id: "gym-brawler", name: "🥊 Gym Brawler", priority: 3 },
    { id: "pokemon-brawl", name: "⚡ Pokemon Brawl", priority: 3 },
  ];

  // Show main tabs by default, with option to expand
  const visibleTabs = showAllTabs ? allTabs : allTabs.filter(tab => tab.priority <= 2);
  const hiddenTabsCount = allTabs.length - visibleTabs.length;

  return (
    <Router>
      <Web3Provider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 transition-all duration-500 ease-in-out">
        {/* Animated background particles */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 ${Object.values(bgColors)[i % Object.values(bgColors).length]} rounded-full animate-bounce opacity-20`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Enhanced Header with neon glow */}
        <header className={`bg-gray-800/90 backdrop-blur-md border-b-2 border-gray-700 p-6 shadow-2xl transition-all duration-500 ${headerGlow ? 'shadow-fuchsia-500/20' : 'shadow-cyan-500/20'}`}>
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Animated logo bars */}
              {[bgColors.primary, bgColors.secondary, bgColors.accent1].map((color, index) => (
                <div 
                  key={index}
                  className={`${color} w-4 h-10 rounded-full ${glowingEffect} shadow-lg`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                />
              ))}
              <h1 className={`text-5xl font-bold ${colors.primary} ml-6 tracking-widest transition-all duration-500 hover:scale-110 hover:text-fuchsia-300 ${strongGlow} cursor-pointer select-none`}>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>S</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>u</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>i</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>M</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>o</span>
                <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>n</span>
              </h1>
            </div>
            <div className="flex space-x-6 items-center">
              {/* Enhanced status indicators */}
              <div className="hidden md:block">
                <div className="flex space-x-3">
                  {[bgColors.primary, bgColors.secondary, bgColors.accent1, bgColors.accent2].map((color, index) => (
                    <div 
                      key={index}
                      className={`h-4 w-4 rounded-full ${color} animate-pulse shadow-lg ${strongGlow}`}
                      style={{ animationDelay: `${index * 0.3}s` }}
                    />
                  ))}
                </div>
              </div>
              <ConnectButtonWrapper className={`${bgColors.primary} hover:bg-fuchsia-600 px-8 py-4 rounded-xl font-bold shadow-2xl shadow-fuchsia-500/30 hover:shadow-fuchsia-500/60 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 ${strongGlow}`} />
            </div>
          </div>
        </header>

        {/* Enhanced Navigation Tabs - Responsive Grid Layout */}
        <nav className="bg-gray-800/80 p-4 backdrop-blur-md sticky top-0 z-50 border-b-2 border-gray-700 shadow-xl">
          <div className="container mx-auto">
            {/* Primary tabs - always visible */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 mb-2">
              {visibleTabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  onMouseEnter={() => setTabHover(tab.id)}
                  onMouseLeave={() => setTabHover("")}
                  className={`px-3 py-2 rounded-lg text-sm ${getNeonBorder(tab.id)} ${getTabColor(tab.id)} 
                    transition-all duration-300 hover:bg-gray-700/50 hover:scale-105 hover:-translate-y-1
                    transform ${activeTab === tab.id ? "scale-105 font-bold shadow-2xl" : "hover:shadow-lg"}
                    ${tabHover === tab.id ? "animate-pulse" : ""}
                    backdrop-blur-sm border border-gray-600 hover:border-gray-400 text-center min-h-[3rem] flex items-center justify-center`}
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)'
                  }}
                >
                  <span className="break-words leading-tight">{tab.name}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 w-3/4 bg-gradient-to-r from-transparent via-current to-transparent animate-pulse rounded-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Show More/Less Button */}
            {hiddenTabsCount > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowAllTabs(!showAllTabs)}
                  className={`px-4 py-2 rounded-full ${colors.accent5} hover:${strongGlow} 
                    transition-all duration-300 hover:bg-gray-700/50 hover:scale-105
                    backdrop-blur-sm border border-gray-600 hover:border-gray-400 text-sm font-medium
                    bg-gray-800/60 shadow-lg hover:shadow-xl`}
                >
                  {showAllTabs ? (
                    <>
                      <span className="mr-1">▲</span> Show Less
                    </>
                  ) : (
                    <>
                      <span className="mr-1">▼</span> Show More ({hiddenTabsCount})
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Active tab indicator */}
            <div className="mt-3 text-center">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-current to-transparent animate-pulse rounded-full opacity-50 max-w-xs mx-auto"></div>
            </div>
          </div>
        </nav>

        {/* Enhanced Main Content with advanced animations */}
        <main className={`container mx-auto p-8 transition-all duration-700 ease-out ${
          animate ? 'opacity-0 translate-y-8 scale-95' : 'opacity-100 translate-y-0 scale-100'
        }`}>
          <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl p-8 border-2 border-gray-700 shadow-2xl min-h-screen hover:shadow-3xl transition-all duration-500 hover:border-gray-600">
            <div className={`transition-all duration-500 ${animate ? 'blur-sm' : 'blur-none'}`}>
              {activeTab === "mint-starter" && (
                <div className="animate-fadeIn transform hover:scale-[1.02] transition-all duration-300">
                  <StarterPickerPage />
                </div>
              )}
              {activeTab === "wallet" && (
                <div className="animate-fadeIn transform hover:scale-[1.02] transition-all duration-300">
                  <WalletDashboard wallet={wallet} />
                </div>
              )}
              {activeTab === "creatures" && (
                <div className="animate-fadeIn transform hover:scale-[1.02] transition-all duration-300">
                  <CreatureCollection wallet={wallet} />
                </div>
              )}
              {activeTab === "battle" && (
                <div className="animate-fadeIn transform hover:scale-[1.02] transition-all duration-300">
                  <PokemonPuzzleRush wallet={wallet} />
                </div>
              )}
              {activeTab === "leaderboard" && (
                <div className="animate-fadeIn transform hover:scale-[1.02] transition-all duration-300">
                  <Leaderboard wallet={wallet} />
                </div>
              )}
              {activeTab === "dao" && (
                <div className="animate-fadeIn transform hover:scale-[1.02] transition-all duration-300">
                  <MemeDAOInterface />
                </div>
              )}
              {activeTab === "tcg" && (
                <div className="animate-fadeIn transform hover:scale-[1.02] transition-all duration-300">
                  <GameBoard wallet={wallet} />
                </div>
              )}
              {activeTab === "gym-brawler" && (
                <div className="animate-fadeIn transform hover:scale-[1.02] transition-all duration-300">
                  <PokemonGymBattle />
                </div>
              )}
              {activeTab === "pokemon-brawl" && (
                <div className="animate-fadeIn transform hover:scale-[1.02] transition-all duration-300">
                  <PokemonBattle />
                </div>
              )}
              {activeTab === "pokidesk" && (
                <div className="animate-fadeIn transform hover:scale-[1.02] transition-all duration-300">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/detail/:id" element={<DetailPage />} />
                    <Route path="/starter-picker" element={<StarterPickerPage />} />
                  </Routes>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Enhanced Footer with dynamic animations */}
        <footer className="bg-gray-800/90 backdrop-blur-md border-t-2 border-gray-700 p-6 mt-12 shadow-2xl">
          <div className="container mx-auto flex justify-between items-center">
            <div className={`${colors.primary} text-lg font-semibold ${strongGlow} hover:scale-105 transition-all duration-300 cursor-pointer`}>
              SuiMon © 2025 ✨
            </div>
            <div className="flex space-x-4">
              {Object.values(bgColors).slice(0, 6).map((color, index) => (
                <div 
                  key={index}
                  className={`w-3 h-3 rounded-full ${color} animate-pulse shadow-lg hover:scale-150 transition-all duration-300 cursor-pointer ${strongGlow}`}
                  style={{ 
                    animationDelay: `${index * 0.2}s`,
                    transform: footerPulse === index ? 'scale(1.5)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Additional footer animation */}
          <div className="mt-4 text-center">
            <div className="h-0.5 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent animate-pulse rounded-full opacity-50"></div>
          </div>
        </footer>
      </div>
      </Web3Provider>
    </Router>
  );
}

export default App;