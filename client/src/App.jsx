// client/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GameBoard from "./pages/GameBoard";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GameBoard />} />
      </Routes>
    </Router>
  );
};

export default App;
