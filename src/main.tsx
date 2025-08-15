
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx: Starting application...');

const rootElement = document.getElementById("root");
console.log('Main.tsx: Root element found:', rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  console.log('Main.tsx: Creating React root and rendering App...');
  root.render(<App />);
} else {
  console.error('Main.tsx: Root element not found!');
}
