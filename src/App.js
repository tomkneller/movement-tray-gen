import React, { } from 'react';
import MovementTrayGenerator from './MovementTrayGen';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ flex: 1, height: '100vh', width: '100vw' }}>
        <MovementTrayGenerator />
      </div>

    </div>
  );
}

export default App;