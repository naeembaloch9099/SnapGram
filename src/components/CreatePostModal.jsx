import React, {
  useState,
  useContext,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { PostContext } from "../context/PostContext";
import { MdClose, MdFlipCameraAndroid } from "react-icons/md";
import { FiCamera, FiImage, FiVideo } from "react-icons/fi";

const CreatePostModal = () => {
  const { activeUser, login } = useContext(AuthContext);
  const { addPost } = useContext(PostContext);
  const navigate = useNavigate();
  const [step, setStep] = useState("select"); // 'select' | 'edit'
  const [selectedMedias, setSelectedMedias] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dragActive, setDragActive] = useState(false);
  const [fileWarning, setFileWarning] = useState("");
  // Camera
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const galleryInputRef = useRef(null);
  const desktopInputRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");
  // Gallery
  const [recentPhotos, setRecentPhotos] = useState([]);

  // === SCREEN SIZE ===
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // === AUTO-START CAMERA ON MOBILE ===
  // NOTE: effect moved below where `startCamera` is defined to avoid
  // ReferenceError: Cannot access 'startCamera' before initialization
  // === MEDIA CREATION HELPER ===
  const MAX_FILE_SIZE = 7.5 * 1024 * 1024; // 7.5MB per file (accounting for base64 encoding overhead)

  const createMediaItems = (files) => {
    setFileWarning("");
    const validFiles = [];

    files.forEach((file, i) => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
        setFileWarning(
          `File "${file.name}" is ${sizeMB}MB. Maximum allowed size is ${maxMB}MB`
        );
        return; // Skip this file
      }

      validFiles.push({
        id: `file-${Date.now()}-${i}`,
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
      });
    });

    return validFiles;
  };

  const handleMediaSelect = (files) => {
    const newMedias = createMediaItems(files).slice(0, 10);
    if (newMedias.length === 0) {
      setFileWarning(
        "No valid files selected. Files must be smaller than 7.5MB"
      );
      return;
    }
    setSelectedMedias((prev) => [...prev, ...newMedias].slice(0, 10));
    if (selectedMedias.length === 0) {
      setCurrentIndex(0);
      setStep("edit");
    }
    // Update recent photos (first 30) - only on mobile
    if (isMobile && recentPhotos.length === 0) {
      const thumbs = files.slice(0, 30).map((f) => ({
        url: URL.createObjectURL(f),
        type: f.type.startsWith("video/") ? "video" : "image",
      }));
      setRecentPhotos(thumbs);
    }
  };

  const handleDesktopSelect = (files) => {
    const newMedias = createMediaItems(files).slice(0, 10);
    if (newMedias.length === 0) {
      setFileWarning(
        "No valid files selected. Files must be smaller than 7.5MB"
      );
      return;
    }
    setSelectedMedias(newMedias);
    setCurrentIndex(0);
    setStep("edit");
  };
  // === CAMERA ===
  const startCamera = useCallback(async (mode = "environment") => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera not supported");
      return;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      setCameraError("");
      setFacingMode(mode);
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"
          ? "Camera access denied. Please enable camera permissions and refresh."
          : err.name === "NotFoundError"
          ? "No camera found"
          : "Camera failed to start";
      setCameraError(msg);
      setCameraReady(false);
      // Fallback: If camera fails, try opening the gallery input directly
      galleryInputRef.current?.click();
    }
  }, []);
  // === AUTO-START CAMERA ON MOBILE (moved below startCamera definition) ===
  useEffect(() => {
    if (isMobile && step === "select") {
      startCamera(); // Auto-activate camera like Instagram
    }
  }, [isMobile, step, startCamera]);
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const newMedia = { id: `cap-${Date.now()}`, url, type: "image" };
        setSelectedMedias([newMedia]);
        setCurrentIndex(0);
        setStep("edit");
        // Stop camera after capture
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        setCameraReady(false);
      },
      "image/jpeg",
      0.92
    );
  };
  // === GALLERY ===
  const openGallery = () => galleryInputRef.current?.click();
  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    handleMediaSelect(files);
  };
  // === DRAG & DROP ===
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (files.length) {
      handleDesktopSelect(files);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };
  // === CLEANUP ===
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      recentPhotos.forEach((p) => URL.revokeObjectURL(p.url));
      selectedMedias.forEach((m) => URL.revokeObjectURL(m.url));
    };
  }, [recentPhotos, selectedMedias]);
  // === POST ===
  const handlePost = async () => {
    if (selectedMedias.length === 0) return;
    setPosting(true);
    try {
      // Helper: convert blob/object URLs to persistent data URLs (so saved posts survive reload)
      const urlToDataUrl = async (url) => {
        if (!url) return url;
        if (url.startsWith("data:")) return url;
        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          return await new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result);
            reader.onerror = rej;
            reader.readAsDataURL(blob);
          });
        } catch {
          return url; // fallback
        }
      };
      const newPosts = [];
      for (let i = 0; i < selectedMedias.length; i++) {
        const media = selectedMedias[i];
        const persistentUrl = await urlToDataUrl(media.url);
        newPosts.push({
          id: Date.now() + i,
          owner: activeUser?.username || "user",
          ownerId: activeUser?.id || Date.now(),
          caption: i === 0 ? caption : "",
          image: media.type === "image" ? persistentUrl : null,
          video: media.type === "video" ? persistentUrl : null,
          visibility: activeUser?.isPrivate ? "followers" : "public",
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: [],
        });
      }
      newPosts.forEach((p) => addPost(p));
      login({
        ...activeUser,
        posts: (activeUser?.posts || 0) + newPosts.length,
      });
      // revoke object URLs we created for UI previews (they're now converted)
      selectedMedias.forEach((m) => {
        try {
          if (m.url && m.url.startsWith("blob:")) URL.revokeObjectURL(m.url);
        } catch {
          /* ignore */
        }
      });
      navigate(`/profile/${encodeURIComponent(activeUser?.username)}`);
    } catch (err) {
      console.error(err);
      alert("Failed to post");
    } finally {
      setPosting(false);
    }
  };
  const currentMedia = selectedMedias[currentIndex];
  // === UI ===
  return (
    <>
      {/* Hide native controls */}
      <style>{`
        video::-webkit-media-controls,
        video::-internal-media-controls-download-button {
          display: none !important;
        }
      `}</style>
      <div
        className={`fixed inset-0 z-50 flex ${
          isMobile
            ? "flex-col bg-white"
            : "items-center justify-center bg-black/50 p-4"
        }`}
      >
        <div
          className={`flex flex-col ${
            isMobile
              ? "w-full h-full"
              : "w-full max-w-lg h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            {step === "edit" ? (
              <>
                <button onClick={() => setStep("select")}>
                  <MdClose className="w-6 h-6" />
                </button>
                <h1 className="font-semibold">Crop</h1>
                <button
                  onClick={handlePost}
                  disabled={posting}
                  className="text-blue-500 font-medium disabled:opacity-50"
                >
                  {posting ? "Sharing..." : "Share"}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate(-1)}>
                  <MdClose className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-lg">Create new post</h1>
                <button
                  onClick={() => selectedMedias.length > 0 && setStep("edit")}
                  className="text-blue-500 font-medium disabled:opacity-50"
                  disabled={selectedMedias.length === 0}
                >
                  Next
                </button>
              </>
            )}
          </div>

          {/* File Warning */}
          {fileWarning && (
            <div className="px-4 py-2 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
              {fileWarning}
            </div>
          )}
          {/* SELECT STEP */}
          {step === "select" ? (
            <div className={`flex-1 overflow-y-auto ${!isMobile ? "p-4" : ""}`}>
              {isMobile ? (
                <>
                  {/* Camera Preview - Now auto-activated */}
                  <div className="relative bg-black aspect-square">
                    {cameraReady ? (
                      <>
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          playsInline
                          muted
                          autoPlay
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        {/* Capture Button */}
                        <button
                          onClick={capturePhoto}
                          className="absolute bottom-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg"
                        />
                        {/* Flip Camera */}
                        <button
                          onClick={() =>
                            startCamera(
                              facingMode === "environment"
                                ? "user"
                                : "environment"
                            )
                          }
                          className="absolute bottom-6 right-6 w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-md"
                        >
                          <MdFlipCameraAndroid className="w-6 h-6" />
                        </button>
                      </>
                    ) : cameraError ? (
                      <div className="flex flex-col items-center justify-center h-full text-white p-6">
                        <p className="text-sm text-red-300 text-center max-w-xs mb-4">
                          {cameraError}
                        </p>
                        <button
                          onClick={openGallery}
                          className="px-6 py-3 bg-blue-600 rounded-full text-lg font-medium flex items-center gap-2"
                        >
                          <FiImage /> Open Gallery
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-white">
                        <div className="text-lg">Loading camera...</div>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 text-white text-sm bg-black/60 px-2 py-1 rounded">
                      {cameraReady
                        ? facingMode === "user"
                          ? "Front"
                          : "Back"
                        : "Camera"}
                    </div>
                  </div>
                  {/* Gallery Bar */}
                  <div className="flex items-center justify-between px-4 py-2 bg-white border-t">
                    <span className="font-medium text-sm">Recents</span>
                    <label className="text-blue-500 text-sm font-medium cursor-pointer">
                      SELECT MULTIPLE
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleGallerySelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {/* Recent Photos Grid */}
                  <div className="p-1 bg-white">
                    <div className="grid grid-cols-4 gap-px">
                      <button
                        onClick={openGallery}
                        className="aspect-square bg-gray-100 flex items-center justify-center"
                      >
                        <FiImage className="w-8 h-8 text-gray-600" />
                      </button>
                      {recentPhotos.map((photo, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedMedias([
                              {
                                id: `recent-${i}`,
                                url: photo.url,
                                type: photo.type,
                              },
                            ]);
                            setCurrentIndex(0);
                            setStep("edit");
                          }}
                          className="aspect-square overflow-hidden"
                        >
                          {photo.type === "video" ? (
                            <video
                              src={photo.url}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={photo.url}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </button>
                      ))}
                      {Array.from({
                        length: Math.max(0, 30 - recentPhotos.length - 1),
                      }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="aspect-square bg-gray-50"
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Desktop Drag & Drop */}
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-xl font-semibold mb-4">
                      Create new post
                    </h2>
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 w-full transition-colors ${
                        dragActive
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="flex flex-col items-center gap-2 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                          <FiImage className="w-6 h-6 text-gray-500" />
                        </div>
                        <p className="text-gray-600">
                          Drag photos and videos here
                        </p>
                      </div>
                      <div className="block w-full">
                        <input
                          ref={desktopInputRef}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length) handleDesktopSelect(files);
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => desktopInputRef.current?.click()}
                          className="w-full py-3 px-4 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium text-gray-700"
                        >
                          Select from computer
                        </button>
                      </div>
                    </div>
                    {/* Suggested Users */}
                    <div className="mt-6 w-full">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">
                        Suggested for you
                      </h3>
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {["mairaafaisal", "anna.saee0027", "mangat.ahmad"].map(
                          (user, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 flex-shrink-0"
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                                {user.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-900 max-w-20 truncate">
                                {user}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* EDIT STEP */
            <div className={`flex-1 flex flex-col ${!isMobile ? "p-4" : ""}`}>
              <div className="flex-1 relative bg-black flex items-center justify-center">
                {/* Constrain preview height so uploaded media doesn't take full screen */}
                {currentMedia?.type === "video" ? (
                  <video
                    src={currentMedia.url}
                    controls
                    className="max-h-[60vh] max-w-full w-auto h-auto object-contain rounded"
                    controlsList="nodownload"
                  />
                ) : (
                  <img
                    src={currentMedia?.url}
                    className="max-h-[60vh] max-w-full w-auto h-auto object-contain rounded"
                    alt="preview"
                  />
                )}
                {selectedMedias.length > 1 && (
                  <button
                    onClick={() => {
                      setSelectedMedias((prev) =>
                        prev.filter((_, i) => i !== currentIndex)
                      );
                      if (currentIndex >= selectedMedias.length - 1) {
                        setCurrentIndex(Math.max(0, selectedMedias.length - 2));
                      }
                    }}
                    className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    <MdClose className="w-5 h-5" />
                  </button>
                )}
                {selectedMedias.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                    {selectedMedias.map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === currentIndex ? "bg-white w-4" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="w-full text-sm resize-none outline-none"
                  rows={3}
                />
              </div>
              {selectedMedias.length > 1 && (
                <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
                  {selectedMedias.map((media, i) => (
                    <button
                      key={media.id}
                      onClick={() => setCurrentIndex(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${
                        i === currentIndex
                          ? "border-blue-500"
                          : "border-transparent"
                      }`}
                    >
                      {media.type === "image" ? (
                        <img
                          src={media.url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CreatePostModal;
