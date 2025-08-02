import MovementTrayGenerator from './MovementTrayGen';
import { ThemeProvider } from './ThemeContext';
import Header from './components/Header';

function App() {
  return (
    <ThemeProvider>
      <Header />
      <MovementTrayGenerator />
      <div className='footer'>
        <p>Copyright © 2025 tomkneller</p>
      </div>
    </ThemeProvider>
  );
}

export default App;