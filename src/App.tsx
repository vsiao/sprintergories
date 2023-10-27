import { Outlet } from 'react-router-dom';
import { useAppSelector } from './store/hooks';
import './App.css';

function App() {
  const auth = useAppSelector(state => state.auth);
  return (
    <div className="App">
      <header className="App-header">
        <p>
          {auth.state === "connected" ? `userId: ${auth.userId}` : <>&nbsp;</>}
        </p>
      </header>
      <Outlet />
    </div>
  );
}

export default App;
