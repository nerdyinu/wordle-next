
import { QueryClient } from '@tanstack/react-query';
import Home from './components/Home';

export default function HomePage() {
  const client = new QueryClient();
  return <Home />
}


