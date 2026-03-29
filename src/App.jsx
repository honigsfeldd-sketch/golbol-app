import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Home from './pages/Home';
import Teams from './pages/Teams';
import ScheduleMatch from './pages/ScheduleMatch';
import UpcomingMatch from './pages/UpcomingMatch';
import History from './pages/History';
import Settings from './pages/Settings';
import Lineup from './pages/Lineup';
import PostMatch from './pages/PostMatch';
import PlayerProfilePage from './pages/PlayerProfilePage';
import MatchDetail from './pages/MatchDetail';
import TabBar from './components/TabBar';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/schedule" element={<ScheduleMatch />} />
          <Route path="/lineup" element={<Lineup />} />
          <Route path="/upcoming" element={<UpcomingMatch />} />
          <Route path="/post-match" element={<PostMatch />} />
          <Route path="/player/:id" element={<PlayerProfilePage />} />
          <Route path="/match/:matchId" element={<MatchDetail />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
        <TabBar />
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
