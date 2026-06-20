import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-sand">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <main className="container-page py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
