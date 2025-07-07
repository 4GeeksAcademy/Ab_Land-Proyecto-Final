import { useState, useEffect } from 'react';
import useGlobalReducer from "../hooks/useGlobalReducer";

export function EditProject({ project, isOpen, onClose, onUpdate }) {
    const { store } = useGlobalReducer();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [projectPictureUrl, setProjectPictureUrl] = useState("");
    const [urlInputValue, setUrlInputValue] = useState("");
    const [status, setStatus] = useState("in progress");
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        if (project) {
            setTitle(project.title || "");
            setDescription(project.description || "");
            setDueDate(project.due_date ? project.due_date.split('T')[0] : "");
            setProjectPictureUrl(project.project_picture_url || "");
            setUrlInputValue(""); // Siempre vacío al abrir el modal
            setStatus(project.status || "in progress");
        }
    }, [project]);

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
            setUrlInputValue("");
            handleFileUpload(file);
        } else {
            setImageFile(null);
            setProjectPictureUrl("");
            setUrlInputValue("");
        }
    };

    const handleUrlChange = (e) => {
        if (e.key === 'Enter') {
            setImageFile(null);
            const url = e.target.value;
            setProjectPictureUrl(url);
            setUrlInputValue(url);
        }
    };

    const handleUrlInputChange = (e) => {
        setUrlInputValue(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);

        if (uploading) {
            setError("Please wait for the image upload to complete.");
            return;
        }

        fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${project.id}`, {
            method: "PUT",
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
                    setError((data && data.msg) || "An error occurred while updating the project.");
                    return;
                }
                window.alert("¡Proyecto actualizado exitosamente!");
                onUpdate(data.project); // Pasar el proyecto actualizado
                onClose(); // Cerrar el modal
            })
            .catch(() => {
                setError("Connection error with the server.");
            });
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show flex-center text-black" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Project</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Project Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-control"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <div className="row">
                                <div className="col-6">
                                    <label className="form-label">Due Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-6">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
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
                            </div>

                            <div className="mb-3 mt-3">
                                <label className="form-label">Project picture: URL or file</label>
                                <div className="d-flex gap-2">
                                    <input
                                        type="url"
                                        className="form-control"
                                        placeholder="Enter image URL"
                                        value={urlInputValue}
                                        onChange={handleUrlInputChange}
                                        onKeyDown={handleUrlChange}
                                        disabled={!!imageFile}
                                    />
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={!!projectPictureUrl && !imageFile || uploading}
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

                            {projectPictureUrl && (
                                <div className="mb-3 text-center">
                                    <img
                                        src={projectPictureUrl}
                                        alt="Vista previa"
                                        style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }}
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={uploading}
                        >
                            Update Project
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
