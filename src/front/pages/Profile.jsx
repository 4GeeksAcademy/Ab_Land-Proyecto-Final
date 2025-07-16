import React, { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useNavigate, Link, useParams } from "react-router-dom";
import { ProjectCardS } from "../components/ProjectCardS";
import { AlertModal } from "../components/AlertModal";

export function Profile() {
  const { store, dispatch } = useGlobalReducer();
  const [tab, setTab] = useState("overview");
  const [formData, setFormData] = useState({
    full_name: "",
    country: "",
    phone: "",
    profile_picture_url: "",
    email: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [isUserProfile, setIsUserProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState({ admin: [], member: [] });
  const navigate = useNavigate();
  const { id } = useParams();  

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    if (store.user.id == id) {
      setIsUserProfile(true)
      setFormData(prev => ({
        ...prev,
        full_name: store.user.full_name,
        country: store.user.country,
        phone: store.user.phone,
        profile_picture_url: store.user.profile_picture_url,
        email: store.user.email,
      }))
      if (store.projects) { setProjects(store.projects) }
    } else {
      getProfile()
      fetchProjects()
    }
  }, [id]);

  const getProfile = async () => {
    setLoading(true)
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    try {
      const res = await fetch(`${backendUrl}/api/profile/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (store.token || localStorage.getItem("token")),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: "error", payload: data.msg || "Something went wrong" });
        return;
      }
      setFormData(prev => ({
        ...prev,
        full_name: data.user.full_name,
        country: data.user.country,
        phone: data.user.phone,
        profile_picture_url: data.user.profile_picture_url,
        email: data.user.email
      }))
    } catch (error) {
      dispatch({ type: "error", payload: "Could not connect to backend." });
    } finally {
      setLoading(false)
    }
  };

  const fetchProjects = async () => {

    dispatch({ type: "error", payload: null });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/projects/${id}`,
        {
          headers: {
            Authorization: "Bearer " + store.token,
            "Content-Type": "application/json"
          }
        }
      );
      const data = await res.json();

      if (res.status === 401 || res.status === 422) {
        dispatch({ type: "LOGOUT" });
        dispatch({ type: "error", payload: "Session expired. Please log in again." });
        navigate("/login");
        return;
      }

      if (!res.ok) {
        dispatch({ type: "error", payload: data.msg || "Error fetching projects." });

      } else {
        setProjects(data.user_projects);

      }
    } catch (err) {
      dispatch({ type: "error", payload: err?.message || "Could not connect to backend." });
    }
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
      dispatch({ type: "error", payload: "Image upload failed." });
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      handleFileUpload(file);
    } else {
      setImageFile(null);
      setFormData(prev => ({ ...prev, profile_picture_url: "" }));
    }
  };

  const handleUrlChange = (e) => {
    if (e) {
      setImageFile(null);
      const url = e.target.value;      
      setFormData(prev => ({ ...prev, profile_picture_url: url })) 
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (uploading) {
      dispatch({
        type: "error",
        payload: "Please wait for the image upload to complete.",
      });
      return;
    }
    putProfile();
  };

  const handleDeleteAccount = () => {
    setShowAlertModal(true)
  };

  const putProfile = async () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const submitData = { ...formData };
    if (!submitData.phone || isNaN(Number(submitData.phone))) {
      submitData.phone = null;
    } else {
      submitData.phone = Number(submitData.phone);
    }
    try {
      const response = await fetch(`${backendUrl}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + store.token,
        },
        body: JSON.stringify(submitData),
      });
      if (response.status === 401 || response.status === 422) {
        dispatch({ type: "LOGOUT" });
        dispatch({ type: "error", payload: "Session expired. Please log in again." });
        navigate("/login");
        return;
      }
      if (!response.ok) throw new Error("Network response was not ok");
      else {const data = await response.json();
      dispatch({ type: "success", payload: "User updated successfully!" });
      localStorage.setItem("user", JSON.stringify(data.user));
      dispatch({type: "profile_change", payload: data.user})
      setEditing(false);}
    } catch (err) {
      dispatch({
        type: "error",
        payload: err?.message || "Error updating user. Please try again.",
      });
    } finally { setEditing(false); }
  };
  const handleAlertResponse = (res) => {
    setShowAlertModal(false)
    if (res == true) {
      deleteAccount()
    }
  };
  const deleteAccount = async () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    try {
      const response = await fetch(`${backendUrl}/api/user`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + store.token,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        dispatch({ type: "error", payload: data.msg || "Failed to delete account." });
        return;
      }
      dispatch({ type: "LOGOUT" });
      dispatch({ type: "success", payload: "Your account has been deleted." });
      navigate("/login");
    } catch (err) {
      dispatch({
        type: "error",
        payload: err?.message || "Error deleting account. Please try again.",
      });
    }
  };

  if (loading) {
    return (<div className="flex-center my-4" >
      <span className="spinner-border spinner-border me-4" aria-hidden="true"></span>
      <span role="status">Loading...</span>
    </div>)
  };

  return (
    <div className="container py-5 app" style={{ maxWidth: 950, minHeight: "90vh", color: "var(--blue-800)" }}>
      <div className="mb-4 bg-white rounded p-2 pt-3">
        {/* <span className="text-muted small">Account &nbsp; / &nbsp; Profile</span> */}
        <h1 className="fw-bold d-flex align-items-center ms-2">
          <img
            src={store.user.profile_picture_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name || "U")}&background=0D8ABC&color=fff`}
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
          <span className="text-dark">
            {store.user.full_name}{" "}
            <span title="Verified" className="text-primary" style={{ fontSize: 28 }}>
              <i className="fa-solid fa-circle-check"></i>
            </span>
          </span>
        </h1>
        <div className="d-flex gap-3 mt-3 pt-1 border-top align-items-center">
          <button
            className={`btn px-2 ${tab === "overview" ? "border-bottom border-2 border-primary" : ""}`}
            style={{ color: tab === "overview" ? "#0D8ABC" : "#555", fontWeight: "bold" }}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          <button
            className={`btn px-2 ${tab === "projects" ? "border-bottom border-2 border-primary" : ""}`}
            style={{ color: tab === "projects" ? "#0D8ABC" : "#555", fontWeight: "bold" }}
            onClick={() => setTab("projects")}
          >
            Projects
          </button>
        </div>
      </div>

      {tab === "overview" && (
        <form className="card shadow p-4 border-0" style={{ background: "#fff" }} onSubmit={handleSubmit}>
          <div className="d-flex justify-content-between mb-2">
            <h5 className="mb-3 fw-bold">Basic Info</h5>
            {!editing && isUserProfile && (
              <button
                className="btn btn-outline-secondary btn-sm"
                type="button"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            )}
            {editing && (
              <button
                className="btn btn-close"
                type="button"
                onClick={() => setEditing(false)}
              />
            )}
          </div>
          <div className="row">
            <div className="col-md-4 text-center mb-4">
              <img
                src={formData.profile_picture_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name || "U")}&background=0D8ABC&color=fff`}
                alt="Profile"
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid var(--blue-500)",
                  marginBottom: "1rem",
                }}
              />
              {editing && (
                <div>
                  <label className="form-label">Profile picture: URL or file (optional)</label>
                  <div className="d-flex flex-column gap-2 mb-2">
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Enter image URL"
                      onChange={handleUrlChange}
                      disabled={!editing || !!imageFile}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={handleImageChange}
                      disabled={!editing || (!!formData.profile_picture_url && !imageFile) || uploading}
                    />
                  </div>
                  {uploadMessage && (
                    <div className="mt-2 text-muted">
                      {uploading ? (
                        <div className="spinner-border spinner-border-sm me-2" role="status" />
                      ) : null}
                      {uploadMessage}
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="col-md-8">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="full_name"
                    value={formData.full_name || ""}
                    onChange={handleChange}
                    required
                    disabled={!editing}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    name="country"
                    value={formData.country || ""}
                    onChange={handleChange}
                    disabled={!editing}
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
                    value={formData.phone || ""}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email || ""}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {editing && (
            <div className="mt-3 d-flex justify-content-end">
              <button type="submit" className="btn btn-primary" disabled={uploading} onClick={handleSubmit}>
                Save Changes
              </button>
            </div>
          )}

          {/* ---- Delete account button ---- */}
          {!editing && isUserProfile && (
            <div className="mt-4 d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          )}

        </form>
      )}

      {tab === "projects" && (
        <div className="card shadow p-4 border-0">
          <h5 className="mb-4">Projects </h5>
          {(projects.admin.length || projects.member.length > 0)
            ? (<>
              {projects.admin.map(proj => (
                <Link to={`/project/${proj.id}`} key={proj.id + 1}>
                  <ProjectCardS
                    project={proj}
                    role={"admin"}
                  />
                </Link>
              ))}
              {projects.member.map(proj => (
                <Link to={`/project/${proj.id}`} key={proj.id + 1}>
                  <ProjectCardS
                    project={proj}
                    role={"member"}
                  />
                </Link>
              ))}
            </>)
            : <p>You are not a member of any project.</p>}
        </div>
      )}
      <AlertModal
        isOpen={showAlertModal}
        onClose={() => { setShowAlertModal(false) }}
        response={handleAlertResponse} />
    </div>
  );
}
