import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { updateProfile } from "../../services/userService";
import { FiCamera, FiCheck, FiX, FiLock, FiGlobe } from "react-icons/fi";

const EditProfile = () => {
  const { activeUser, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    username: "",
    bio: "",
    isPrivate: false,
    profilePic: "",
  });

  const [originalPic, setOriginalPic] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Load user data
  useEffect(() => {
    if (!activeUser) return;
    setForm({
      name: activeUser.name || "",
      username: activeUser.username || "",
      bio: activeUser.bio || "",
      isPrivate: !!activeUser.isPrivate,
      profilePic: activeUser.profilePic || "",
    });
    setOriginalPic(activeUser.profilePic || "");
  }, [activeUser]);

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setForm((prev) => ({ ...prev, profilePic: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.username.trim()) {
      setError("Username is required");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      username: form.username.trim(),
      bio: form.bio.trim(),
      isPrivate: form.isPrivate,
      profilePic: form.profilePic || originalPic,
    };

    try {
      const res = await updateProfile(payload);
      const newUser = (res && res.data && res.data.user) || null;
      if (newUser) {
        // update auth context so app reflects persisted profile
        login(newUser);
      }
      setSuccess(true);
      setTimeout(() => {
        navigate(
          `/profile/${encodeURIComponent(
            (newUser && newUser.username) || payload.username
          )}`
        );
      }, 800);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to save profile";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!activeUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 mb-6" />
        <p className="text-lg font-medium text-gray-700">Sign in required</p>
        <button
          onClick={() => navigate("/login")}
          className="mt-4 px-6 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const bioLength = form.bio.length;
  const maxBio = 150;

  return (
    <div className="max-w-2xl mx-auto p-5 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <FiX className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        <div className="w-10" />
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2">
          <FiCheck className="w-5 h-5" />
          Profile saved successfully!
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <FiX className="w-5 h-5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <img
              src={
                form.profilePic ||
                `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><circle fill='%23e5e7eb' cx='60' cy='60' r='60'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='48' font-family='system-ui'>${(
                  form.name || "?"
                )
                  .charAt(0)
                  .toUpperCase()}</text></svg>`
              }
              alt="Profile"
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-xl"
            />
            <button
              type="button"
              onClick={openFilePicker}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all"
            >
              <FiCamera className="w-8 h-8 text-white" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <p className="mt-3 text-sm text-gray-600">Tap to change photo</p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your full name"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            maxLength={50}
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              @
            </span>
            <input
              type="text"
              value={form.username}
              onChange={(e) =>
                setForm({
                  ...form,
                  username: e.target.value.replace(/[^a-z0-9._]/gi, ""),
                })
              }
              placeholder="username"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              maxLength={30}
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Only letters, numbers, underscores, and periods
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell us about yourself..."
            rows={4}
            maxLength={maxBio}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition"
          />
          <div className="flex justify-end mt-1">
            <span
              className={`text-xs ${
                bioLength > maxBio * 0.9 ? "text-red-600" : "text-gray-500"
              }`}
            >
              {bioLength}/{maxBio}
            </span>
          </div>
        </div>

        {/* Privacy */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            {form.isPrivate ? (
              <FiLock className="w-5 h-5 text-indigo-600" />
            ) : (
              <FiGlobe className="w-5 h-5 text-green-600" />
            )}
            <div>
              <p className="font-medium text-gray-800">
                {form.isPrivate ? "Private Account" : "Public Account"}
              </p>
              <p className="text-xs text-gray-600">
                {form.isPrivate
                  ? "Only approved followers can see your posts"
                  : "Anyone can see your posts"}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={(e) =>
                setForm({ ...form, isPrivate: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <FiCheck className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
