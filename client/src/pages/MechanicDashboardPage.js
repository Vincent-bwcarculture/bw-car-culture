import { useAuth } from '../context/AuthContext.js';
import MechanicDashboard from '../components/MechanicDashboard/MechanicDashboard.js';

export default function MechanicDashboardPage() {
  const { user } = useAuth();
  return <MechanicDashboard profileData={user} />;
}
