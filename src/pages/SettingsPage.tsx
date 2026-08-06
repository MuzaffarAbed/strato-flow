export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm">Application preferences and configuration</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <section>
          <h3 className="font-semibold text-primary mb-3">Appearance</h3>
          <p className="text-sm text-gray-500">StratoFlow uses a dark enterprise theme with gold accents.</p>
        </section>
        <section>
          <h3 className="font-semibold text-primary mb-3">Notifications</h3>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" defaultChecked className="accent-primary" />
            Email notifications for assignments
          </label>
          <label className="flex items-center gap-3 text-sm mt-2">
            <input type="checkbox" defaultChecked className="accent-primary" />
            In-app notifications for comments
          </label>
        </section>
        <section>
          <h3 className="font-semibold text-primary mb-3">API Connection</h3>
          <p className="text-sm text-gray-500">API URL: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</p>
        </section>
      </div>
    </div>
  );
}
