import {createRoot} from 'react-dom/client';
import App from '@/app/App';
import { ScenarioProvider } from '@/app/scenario/ScenarioProvider';
import '@/styles/index.css';

createRoot(document.getElementById('root')!).render(
  <ScenarioProvider>
    <App />
  </ScenarioProvider>
);
