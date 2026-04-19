import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface ProfileForm {
  name: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Profile() {
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState<ProfileForm>({ name: "", email: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwords, setPasswords] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  useEffect(() => {
    api.get("/users/me")
      .then((res) => {
        const u = res.data.data ?? res.data;
        setProfile({ name: u.name ?? "", email: u.email ?? "" });
      })
      .finally(() => setProfileLoading(false));
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.patch("/users/me", { name: profile.name, email: profile.email });
      const u = res.data.data ?? res.data;
      setProfile({ name: u.name ?? "", email: u.email ?? "" });
      if (user) setUser({ ...user, name: u.name ?? "", email: u.email ?? "" });
      showToast("Profile updated successfully");
    } catch {
      showToast("Failed to update profile", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (passwords.newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    setPwSaving(true);
    try {
      await api.patch("/users/me/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password changed successfully");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to change password";
      showToast(msg, "error");
    } finally {
      setPwSaving(false);
    }
  };

  const initials = (profile.name || user?.phone || "A")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Profile</h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-4 mb-8 p-5 bg-white dark:bg-gray-dark rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-500 text-white text-2xl font-bold">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile.name || "—"}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.phone}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-brand-50 text-brand-600 rounded-full">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="bg-white dark:bg-gray-dark rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Profile</h2>
        {profileLoading ? (
          <div className="space-y-3">
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        ) : (
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={user?.phone || ""}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-400">Phone number cannot be changed</p>
            </div>
            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-lg font-medium text-sm transition"
            >
              {profileSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-dark rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
              placeholder="Enter current password"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder="Min. 6 characters"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Re-enter new password"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition"
          >
            {pwSaving ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Toast */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50 transition ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
