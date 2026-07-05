import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <>
      <Navbar />
      <div className="container-fluid p-3">
        <Outlet />
      </div>
    </>
  );
}