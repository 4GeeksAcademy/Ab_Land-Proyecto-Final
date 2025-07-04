import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const navigate = useNavigate();

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
      alert("Please wait for the image upload to complete.");
      return;
    }
    postRegister();
  };

  // --- FIXED: Send phone as number or null ---
  const postRegister = async () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const submitData = { ...formData };
    if (!submitData.phone || isNaN(Number(submitData.phone))) {
      submitData.phone = null;
    } else {
      submitData.phone = Number(submitData.phone);
    }
    try {
      const response = await fetch(`${backendUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      navigate("/login");
      console.log("Registration successful:", data);
    } catch (error) {
      console.error("Error during registration:", error);
    }
  };

  return (
    <div className="px-5 container-fluid">
      <div className="card ">
        <div className="card-header text-center">
          <h1 className="text-center mb-4">EchoBoard Registration</h1>
          <p className="text-center mb-4">
            Please fill in the details below to create your account.
          </p>
        </div>
        <div className="row g-0">
          <div className="col-md-4 flex-center border-end">
            <div className="mb-4">
              <span>{currentStep >= 1 ? "✅" : "❌"} Step 1: Basic Info</span>
              <br />
              <span>
                {currentStep >= 2 ? "✅" : "❌"} Step 2: Contact Info
              </span>
              <br />
              <span>
                {currentStep === 3 ? "✅" : "❌"} Step 3: Profile Picture
              </span>
            </div>
          </div>
          <div className="col-md-8 bg-light flex-center flex-column px-0">
            {currentStep === 1 && (
              <form className="card p-4 m-2 mt-4">
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
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </form>
            )}

            {currentStep === 2 && (
              <form className="card p-4 m-2 mt-4">
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
              <div className="card  p-4 m-2 mt-4">
                <label className="form-label">Profile Picture</label>
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
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
                </div>
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

