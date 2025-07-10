import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    country: "",
    phone: "",
    profile_picture_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false)
  const [uploadMessage, setUploadMessage] = useState("");
  const navigate = useNavigate();
  const { store, dispatch } = useGlobalReducer();

  const handleChange = (e) => {
    setFormData((prev) => ({
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
        {
          method: "POST",
          body: formDataToSend,
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error("Image upload failed");
      }
      setFormData((prev) => ({
        ...prev,
        profile_picture_url: data.secure_url,
      }));
      setUploadMessage("Image uploaded ✅");
    } catch (err) {
      setUploadMessage("Upload failed ❌");
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
      setFormData((prev) => ({
        ...prev,
        profile_picture_url: "",
      }));
    }
  };

  const handleUrlChange = (e) => {
    setImageFile(null);
    const url = e.target.value;
    setFormData((prev) => ({
      ...prev,
      profile_picture_url: url,
    }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (uploading) {
      dispatch({
        type: "error",
        payload: "Please wait for the image upload to complete.",
      });
      return;
    }
    postRegister();
  };

  const postRegister = async () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const submitData = { ...formData };
    if (!submitData.phone || isNaN(Number(submitData.phone))) {
      submitData.phone = null;
    } else {
      submitData.phone = Number(submitData.phone);
    }
    try {
      const response = await fetch(`${backendUrl}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      const data = await response.json();
      if (!response.ok) {
        dispatch({ type: "error", payload: data.msg || "Network response was not ok" });
        return;
      } else {
        let successMessage = "¡Usuario creado exitosamente!";
        dispatch({ type: "success", payload: successMessage });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      dispatch({
        type: "error",
        payload:
          error?.message  || "Error al crear el usuario. Por favor, intenta de nuevo.",
      });
    }
  };

  return (
    <div className="container app ">
      <div className="card p-4 max-w-md  mt-10 ">
        <Link to="/login"> ← Back</Link>
        
        <div className="text-center border-bottom">
          <h1 className="text-center mb-4">EchoBoard Registration</h1>
          <p className="text-center mb-4">
            Please fill in the details below to create your account.
          </p>
        </div>
        <div className="row">
          <div className="col-md-3 flex-center border-end ">
            <div className="mb-4">
              <span>{currentStep >= 1 ? "✅" : "❌"} Step 1: Basic Info</span>
              <br />
              <span>{currentStep >= 2 ? "✅" : "❌"} Step 2: Contact Info</span>
              <br />
              <span>
                {currentStep === 3 ? "✅" : "❌"} Step 3: Profile Picture
              </span>
            </div>
          </div>
          <div className=" col-md-8 flex-center flex-column px-0 pt-4 ">
            {currentStep === 1 && (
              <form className="card p-4 m-2 mt-4 w-50">
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      className="form-control"
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary border-0 position-absolute top-50 end-0 translate-middle-y me-2"
                      style={{ zIndex: 2 }}
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? (
                        <i className="fa-regular fa-eye-slash" />
                      ) : (
                        <i className="fa-regular fa-eye" />
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {currentStep === 2 && (
              <form className="card p-4 m-2 mt-4 w-50">
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    className="form-control"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    name="country"
                    className="form-control"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone (optional)</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </form>
            )}

            {currentStep === 3 && (
              <div className="card  p-4 m-2 mt-4 w-50">
                <label className="form-label">
                  Profile Picture: URL or file (optional)
                </label>
                <div className="d-flex gap-2 mb-3">
                  <input
                    type="url"
                    className="form-control"
                    placeholder="Enter image URL"
                    value={imageFile ? "" : formData.profile_picture_url}
                    onChange={handleUrlChange}
                    disabled={!!imageFile}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={handleImageChange}
                    disabled={
                      (!!formData.profile_picture_url && !imageFile) ||
                      uploading
                    }
                  />
                </div>
                {uploadMessage && (
                  <div className="mt-2 text-muted">
                    {uploading ? (
                      <div
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      />
                    ) : null}
                    {uploadMessage}
                  </div>
                )}
                {formData.profile_picture_url && (
                  <div className="mt-3 text-center">
                    <img
                      src={formData.profile_picture_url}
                      alt="Vista previa"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 d-flex justify-content-between mb-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary me-5"
                  onClick={prevStep}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary ms-auto"
                onClick={nextStep}
                disabled={uploading}
              >
                {currentStep < 3 ? "Next" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
