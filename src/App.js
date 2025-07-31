import MovementTrayGenerator from './MovementTrayGen';
import Header from './components/Header';

function App() {
  return (
    <>
      <Header />
      <MovementTrayGenerator />
      <div className='footer'>
        <p>Copyright © 2025 tomkneller</p>
      </div>
    </>
  );
}

export default App;