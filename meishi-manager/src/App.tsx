import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { CameraView } from './components/camera/CameraView';
import { CardList } from './components/cards/CardList';
import { SearchView } from './components/search/SearchView';
import { SettingsView } from './components/settings/SettingsView';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<CameraView />} />
          <Route path="/cards" element={<CardList />} />
          <Route path="/search" element={<SearchView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </Layout>
      {/* PWAインストールプロンプト */}
      <InstallPrompt />
      {/* オフラインインジケーター */}
      <OfflineIndicator />
    </BrowserRouter>
  );
}

export default App;
