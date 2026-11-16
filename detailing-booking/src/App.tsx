import { useEffect, useState } from 'react';
import { BookingPage } from './pages/Booking';
import { AdminPage } from './pages/Admin';
import { backend } from './lib/backend';

// L'espace pro est accessible par /admin ou par #admin (lien de test).
const isAdminRoute = () => window.location.pathname.replace(/\/+$/, '') === '/admin' || window.location.hash === '#admin';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(isAdminRoute);
  useEffect(() => {
    const onHash = () => setIsAdmin(isAdminRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return (
    <>
      {backend.mode === 'demo' && (
        <div className="demo-banner">
          Version de test : les réservations restent dans ce navigateur.
          {isAdmin ? ' Identifiants : admin@demo.fr / demo' : ''}
        </div>
      )}
      {isAdmin ? <AdminPage /> : <BookingPage />}
    </>
  );
}
