
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './infrastructure/auth/AuthProvider';
import { useAuth } from './infrastructure/auth/AuthContext';
import { AuthLayout } from './ui/layouts/AuthLayout';
import { DashboardLayout } from './ui/layouts/DashboardLayout';
import { LoginPage } from './ui/pages/auth/LoginPage';
import { DashboardPage } from './ui/pages/dashboard/DashboardPage';
import { ClientsListPage } from './ui/pages/clients/ClientsListPage';
import { MachinesListPage } from './ui/pages/machines/MachinesListPage';
import { ReportsListPage } from './ui/pages/reports/ReportsListPage';
import { ReportDetailsPage } from './ui/pages/reports/ReportDetailsPage';
import { ReportOverview } from './ui/pages/reports/ReportOverview';
import { RiskAssessmentList } from './ui/pages/reports/risk/RiskAssessmentList';
import { ChecklistExecution } from './ui/pages/reports/checklist/ChecklistExecution';
import { ActionPlanPage } from './ui/pages/reports/action-plan/ActionPlanPage';
import { ValidationPage } from './ui/pages/reports/validation/ValidationPage';
import { SettingsPage } from './ui/pages/settings/SettingsPage';
import { TrainingPage } from './ui/pages/training/TrainingPage';
import { JobsListPage } from './ui/pages/jobs/JobsListPage';
import { SitesListPage } from './ui/pages/sites/SitesListPage';
import { AuditLogPage } from './ui/pages/audit/AuditLogPage';

// Protected Route Wrapper
function ProtectedRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsListPage />} />
            <Route path="/machines" element={<MachinesListPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/jobs" element={<JobsListPage />} />
            <Route path="/sites" element={<SitesListPage />} />
            <Route path="/reports" element={<ReportsListPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/reports/:id" element={<ReportDetailsPage />}>
              <Route index element={<ReportOverview />} />
              <Route path="risks" element={<RiskAssessmentList />} />
              <Route path="checklist" element={<ChecklistExecution />} />
              <Route path="action-plan" element={<ActionPlanPage />} />
              <Route path="validation" element={<ValidationPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
