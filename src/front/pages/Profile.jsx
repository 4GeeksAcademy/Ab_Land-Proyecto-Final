import React, { useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

export function Profile() {
  const { store, dispatch } = useGlobalReducer();
  const [tab, setTab] = useState("overview");
  const [formData, setFormData] = useState({
    full_name: store.user.full_name || "",
    country: store.user.country || "",
    phone: store.user.phone || "",
    profile_picture_url: store.user.profile_picture_url || "",
    email: store.user.email || "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Avatar fallback for initials
  const getInitials = (name) => {
    if (!name) return "U";
    const arr = name.split(" ");
    return (arr[0][0] || "") + (arr[1]?.[0] || "");
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadMessage("Uploading image...");
    const appUploadPreset = import.meta.env.VITE_UPLOAD_PRESET;
    const appCloudName = import.meta.env.VITE_CLOUD_NAME;
    const formDataToSend = new FormData();
    formDataToSend.append("file", file);
    formDataToSend.append("upload_preset", appUploadPreset);
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${appCloudName}/image/upload`,
        { method: "POST", body: formDataToSend }
      );
      const data = await res.json();
      if (!res.ok) throw new Error("Upload failed");
      setFormData(prev => ({ ...prev, profile_picture_url: data.secure_url }));
      setUploadMessage("Image uploaded ✅");
    } catch {
      setUploadMessage("Upload failed ❌");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (uploading) {
      setError("Please wait for the image upload to complete.");
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + store.token,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || "Error updating profile.");
        return;
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      dispatch({ type: "LOGIN_SUCCESS", payload: { user: data.user, token: store.token } });
      setSuccess("Profile updated successfully!");
    } catch {
      setError("Server error.");
    }
  };

  return (
    <div
      className="container py-5"
      style={{
        maxWidth: 950,
        minHeight: "92vh",
        color: "var(--blue-800)",
      }}
    >
      <div className="mb-4">
        <span className="text-muted small">Account &nbsp; / &nbsp; Profile</span>
        <h1 className="fw-bold d-flex align-items-center">
          <img
            src={
              formData.profile_picture_url ||
              "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(formData.full_name || "U") +
                "&background=0D8ABC&color=fff"
            }
            alt="Profile"
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid var(--blue-500)",
              marginRight: "1.5rem",
            }}
          />
          <span>
            {formData.full_name}{" "}
            <span title="Verified" className="text-primary" style={{ fontSize: 28 }}>
              <i className="fa-solid fa-circle-check"></i>
            </span>
          </span>
        </h1>
        <div className="d-flex gap-3 mt-3">
          <button
            className={`btn btn-link px-2 ${tab === "overview" ? "border-bottom border-2 border-primary" : ""}`}
            style={{color: tab==="overview" ? "#0D8ABC" : "#555", fontWeight:"bold"}}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          <button
            className={`btn btn-link px-2 ${tab === "projects" ? "border-bottom border-2 border-primary" : ""}`}
            style={{color: tab==="projects" ? "#0D8ABC" : "#555", fontWeight:"bold"}}
            onClick={() => setTab("projects")}
          >
            Projects
          </button>
        </div>
      </div>
      {tab === "overview" && (
        <form className="card shadow p-4 border-0" style={{ background: "#fff" }} onSubmit={handleSubmit}>
          <h5 className="mb-3 fw-bold">Basic Info</h5>
          <div className="row">
            <div className="col-md-4 text-center mb-4">
              <img
                src={
                  formData.profile_picture_url ||
                  "https://ui-avatars.com/api/?name=" +
                    encodeURIComponent(formData.full_name || "U") +
                    "&background=0D8ABC&color=fff"
                }
                alt="Profile"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid var(--blue-500)",
                  marginBottom: "1rem",
                }}
              />
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                disabled={uploading}
              />
              {uploadMessage && <div className="mt-2 text-muted">{uploadMessage}</div>}
            </div>
            <div className="col-md-8">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 d-flex justify-content-end">
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              Save Changes
            </button>
          </div>
          {success && <div className="alert alert-success mt-3">{success}</div>}
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </form>
      )}
      {tab === "projects" && (
        <div className="card shadow p-4 border-0">
          <h5>Projects - coming soon</h5>
        </div>
      )}
    </div>
  );
}
