import React, { useState } from "react";
import Game from "./components/Game";
import TitleScreen from "./components/TitleScreen";
import CharacterCreator from "./components/CharacterCreator";

function App() {
  const [stage, setStage] = useState("title"); // 'title' | 'creator' | 'game'
  const [player, setPlayer] = useState(null);

  const startNew = () => setStage("creator");

  const onCreate = (p) => {
    setPlayer(p);
    setStage("game");
  };

  const goHome = () => {
    setPlayer(null);
    setStage("title");
  };

  if (stage === "title") return <TitleScreen onStart={startNew} />;

  if (stage === "creator")
    return <CharacterCreator onConfirm={onCreate} onCancel={goHome} />;

  return <Game player={player} onExit={goHome} />;
}

export default App;
