import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-gray-500 text-sm">Your account information</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center text-primary text-xl font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.fullName}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-background rounded-lg p-4">
            <p className="text-gray-500">Role</p>
            <p className="font-medium mt-1">{user?.roleName}</p>
          </div>
          <div className="bg-background rounded-lg p-4">
            <p className="text-gray-500">Department</p>
            <p className="font-medium mt-1">{user?.departmentName || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
