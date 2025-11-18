import React, { useRef, useState } from "react";
import api from "../services/api";

const AddStoryButton = ({ className = "", onUploaded }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const openPicker = () => fileRef.current && fileRef.current.click();

  const handleFile = async (e) => {
    const files = e.target.files && Array.from(e.target.files);
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      // Upload files sequentially so backend & Cloudinary are not overwhelmed
      const results = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        // use axios instance so Authorization header and cookies are applied
        const res = await api.post("/stories/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        results.push(res.data);
      }

      // notify listeners that stories changed
      try {
        window.dispatchEvent(
          new CustomEvent("stories:changed", { detail: results })
        );
      } catch (err) {
        console.log("Failed to dispatch custom event, falling back", err);
        window.dispatchEvent(new Event("stories:changed"));
      }
      if (typeof onUploaded === "function") onUploaded(results);
      alert("Stories uploaded");
    } catch (err) {
      console.warn("Story upload failed", err);
      alert("Story upload failed");
    }
    setUploading(false);
    // reset input
    try {
      e.target.value = null;
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFile}
        style={{ display: "none" }}
        multiple
      />
      <button
        onClick={openPicker}
        className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-indigo-50 transition-colors text-sm font-medium bg-white border"
        aria-label="Add Story"
        disabled={uploading}
      >
        <span className="text-lg">➕</span>
        <span>{uploading ? "Uploading..." : "Add Story"}</span>
      </button>
    </div>
  );
};

export default AddStoryButton;
