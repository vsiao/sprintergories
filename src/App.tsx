import logo from './logo.svg';
import './App.css';
import { useAppSelector } from './store/hooks';

function App() {
  const auth = useAppSelector(state => state.auth);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          {auth.state === "connected" ? `User id: ${auth.userId}` : <>&nbsp;</>}
        </p>
      </header>
    </div>
  );
}

export default App;
