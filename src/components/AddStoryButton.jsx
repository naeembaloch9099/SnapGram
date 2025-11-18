import React, { useRef, useState } from "react";
import api from "../services/api";

const AddStoryButton = ({ className = "", onUploaded }) => {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    const results = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const fd = new FormData();
      fd.append("file", f);
      try {
        const res = await api.post("/stories/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        results.push(res.data);
      } catch (err) {
        console.warn("AddStoryButton upload failed", err);
      }
    }
    setLoading(false);
    // notify other components
    try {
      window.dispatchEvent(
        new CustomEvent("stories:changed", { detail: results })
      );
    } catch (e) {
      console.warn("CustomEvent not supported, using fallback", e);
      // older browsers
      const ev = document.createEvent("CustomEvent");
      ev.initCustomEvent("stories:changed", true, true, results);
      window.dispatchEvent(ev);
    }
    if (typeof onUploaded === "function") onUploaded(results);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        onClick={() => inputRef.current && inputRef.current.click()}
        className={`w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-white ${
          loading ? "opacity-60" : ""
        }`}
        aria-label="Add story"
      >
        {loading ? "Uploading..." : "+"}
      </button>
    </div>
  );
};

export default AddStoryButton;
