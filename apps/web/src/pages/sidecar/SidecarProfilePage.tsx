import { useAuth } from '@/contexts/Auth';

export default function SidecarProfilePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
        <p className="text-slate-500 text-xs">Signed in as</p>
        <p className="text-slate-100 font-medium">{user?.email}</p>
        <p className="text-slate-500 text-xs mt-2">Role: {user?.role ?? '—'}</p>
        {user?.householdId && (
          <p className="text-slate-500 text-xs mt-1">Household: {user.householdId}</p>
        )}
      </div>
      <button
        type="button"
        className="w-full rounded-xl border border-slate-700 py-2 text-slate-300 text-sm"
        onClick={() => void signOut()}
      >
        Sign out
      </button>
    </div>
  );
}
