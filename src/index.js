import React from "react";
import ReactDOM from "react-dom/client";
import Game from "./components/Game"; // Make sure this path matches where your Game.jsx is

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>
);

