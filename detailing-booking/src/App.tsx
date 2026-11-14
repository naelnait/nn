import { BookingPage } from './pages/Booking';
import { AdminPage } from './pages/Admin';
import { backend } from './lib/backend';

export default function App() {
  const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';
  return (
    <>
      {backend.mode === 'demo' && (
        <div className="demo-banner">
          Mode démo : les réservations sont stockées dans ce navigateur uniquement.
          {isAdmin ? ' Identifiants : admin@demo.fr / demo' : ''}
        </div>
      )}
      {isAdmin ? <AdminPage /> : <BookingPage />}
    </>
  );
}
