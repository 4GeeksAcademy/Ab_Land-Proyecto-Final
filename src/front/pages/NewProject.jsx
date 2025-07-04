import { useState } from 'react';
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";

export function NewProject() {
    const { store } = useGlobalReducer();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [projectPictureUrl, setProjectPictureUrl] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [error, setError] = useState(null);
    const [status, setStatus] = useState("in progress");
    const navigate = useNavigate();


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
            setProjectPictureUrl(data.secure_url);
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
            setProjectPictureUrl("");
        }
    };

    const handleUrlChange = (e) => {
        setImageFile(null);
        const url = e.target.value;
        if (url) {
            setProjectPictureUrl(url);
        } else {
            setProjectPictureUrl("");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        if (uploading) {
            setError("Please wait for the image upload to complete.");
            return;
        }
        fetch(`${import.meta.env.VITE_BACKEND_URL}/project`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + store.token,
            },
            body: JSON.stringify({
                title,
                description,
                due_date: dueDate,
                project_picture_url: projectPictureUrl,
                status,
            }),
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setError((data && data.msg) || "An error occurred while creating the project.");
                    return;
                }
                window.alert("¡Proyecto guardado exitosamente!");
                navigate("/dashboard");
            })
            .catch(() => {
                setError("Connection error with the server.");
            });
    };

    return (
        <>
            <div className="flex-center">
                <div className="container bg-white p-5">
                    <h1 className="text-center mb-4 text-dark">Create New Project</h1>
                    <form className="row g-3" onSubmit={handleSubmit}>
                        <div className="col-12">
                            <label className="form-label text-dark">Project Title</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter project title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label text-dark">Description (optional)</label>
                            <textarea
                                className="form-control"
                                value={description}
                                placeholder="Describe your project"
                                onChange={e => setDescription(e.target.value)}
                                required
                                rows={8}
                            />
                        </div>
                        <div className="col-6">
                            <label className="form-label text-dark">Due Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-6">
                            <label htmlFor="validationCustom04" className="form-label textdark">Status</label>
                            <select
                                className="form-select"
                                id="validationCustom04"
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                required
                            >
                                <option value="in progress">In progress</option>
                                <option value="yet to start">Yet to start</option>
                                <option value="done">Done</option>
                                <option value="dismissed">Dismissed</option>
                            </select>
                        </div>
                        <div className="col-12">
                            <label className="form-label text-dark">Project picture: URL or file (optional)</label>
                            <div className="d-flex gap-2">
                                <input
                                    type="url"
                                    className="form-control mb-2"
                                    style={{ maxWidth: "60%" }}
                                    placeholder="Enter image URL"
                                    value={imageFile ? "" : projectPictureUrl}
                                    onChange={handleUrlChange}
                                    disabled={!!imageFile}
                                />
                                <input
                                    type="file"
                                    className="form-control mb-2"
                                    style={{ maxWidth: "40%" }}
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    disabled={!!projectPictureUrl && !imageFile || uploading}
                                />
                                {uploadMessage && (
                                    <div className="mt-2 text-muted">
                                        {uploading ? (
                                            <div className="spinner-border spinner-border-sm me-2" role="status" />
                                        ) : null}
                                        {uploadMessage}
                                    </div>
                                )}
                            </div>
                            {(projectPictureUrl) && (
                                <div className="mt-2 text-center">
                                    <img
                                        src={projectPictureUrl}
                                        alt="Vista previa"
                                        style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "8px" }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="col-6">
                            <button className="btn btn-primary" type="submit">Create new Project</button>
                        </div>
                        
                        {error && (
                            <div className="col-12">
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}