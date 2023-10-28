import { Outlet } from 'react-router-dom';
import './App.css';

export default function App() {
  return (
    <div className="App">
      <header className="App-header">
        <a className="App-homeLink" href="/">Sprintergories</a>
      </header>
      <Outlet />
    </div>
  );
}
;