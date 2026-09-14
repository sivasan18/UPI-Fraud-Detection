// ==============================================================================
// Smart UPI Fraud Detection System
// Application Router
// ==============================================================================
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tutorial from './pages/Tutorial';
import UploadTransaction from './pages/UploadTransaction';
import OCRExtraction from './pages/OCRExtraction';
import DataConfirmation from './pages/DataConfirmation';
import TransactionHistory from './pages/TransactionHistory';
import BehaviourProfile from './pages/BehaviourProfile';
import AnalyseTransaction from './pages/AnalyseTransaction';
import FraudAnalysisResult from './pages/FraudAnalysisResult';
import SuspiciousAlert from './pages/SuspiciousAlert';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import AdaptiveLearning from './pages/AdaptiveLearning';
import ModelMonitoring from './pages/ModelMonitoring';
import Settings from './pages/Settings';
import AboutProject from './pages/AboutProject';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/upload" element={<UploadTransaction />} />
        <Route path="/extraction" element={<OCRExtraction />} />
        <Route path="/confirm" element={<DataConfirmation />} />
        <Route path="/history" element={<TransactionHistory />} />
        <Route path="/profile" element={<BehaviourProfile />} />
        <Route path="/analyse" element={<AnalyseTransaction />} />
        <Route path="/result" element={<FraudAnalysisResult />} />
        <Route path="/suspicious" element={<SuspiciousAlert />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/adaptive" element={<AdaptiveLearning />} />
        <Route path="/monitoring" element={<ModelMonitoring />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<AboutProject />} />
      </Route>
    </Routes>
  );
}

export default App;
