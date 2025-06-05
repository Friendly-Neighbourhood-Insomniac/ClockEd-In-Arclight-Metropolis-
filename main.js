import React from 'react';
import { createRoot } from 'react-dom/client';
import Game from 'game';
function App() {
  return React.createElement(Game, null);
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(App, null));