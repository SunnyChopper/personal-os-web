import { NavLink, Outlet } from 'react-router-dom';
import { Home, Camera, UtensilsCrossed, PawPrint, User } from 'lucide-react';
import { ROUTES } from '@/routes';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
    isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
  }`;

/**
 * Mobile-first spouse shell: no admin / assistant / vault navigation.
 */
export default function SidecarLayout() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 flex flex-col max-w-screen-sm mx-auto w-full safe-area-pb">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">Household</h1>
        <p className="text-xs text-slate-500">Shared sidecar</p>
      </header>

      <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-screen-sm mx-auto border-t border-slate-800 bg-slate-950/95 backdrop-blur px-2 py-2 flex justify-around">
        <NavLink to={ROUTES.sidecar.home} className={navClass} end>
          <Home className="h-5 w-5" />
          Home
        </NavLink>
        <NavLink to={ROUTES.sidecar.dropzone} className={navClass}>
          <Camera className="h-5 w-5" />
          Dropzone
        </NavLink>
        <NavLink to={ROUTES.sidecar.meals} className={navClass}>
          <UtensilsCrossed className="h-5 w-5" />
          Meals
        </NavLink>
        <NavLink to={ROUTES.sidecar.pets} className={navClass}>
          <PawPrint className="h-5 w-5" />
          Pets
        </NavLink>
        <NavLink to={ROUTES.sidecar.profile} className={navClass}>
          <User className="h-5 w-5" />
          Profile
        </NavLink>
      </nav>
    </div>
  );
}
