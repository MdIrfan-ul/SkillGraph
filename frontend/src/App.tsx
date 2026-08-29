import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { DeveloperProfile } from './pages/DeveloperProfile';
import { PathFinder } from './pages/PathFinder';
import { SkillAffinity } from './pages/SkillAffinity';
import { TeamBuilder } from './pages/TeamBuilder';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="developers/:id" element={<DeveloperProfile />} />
          <Route path="path-finder" element={<PathFinder />} />
          <Route path="affinity" element={<SkillAffinity />} />
          <Route path="team-builder" element={<TeamBuilder />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}