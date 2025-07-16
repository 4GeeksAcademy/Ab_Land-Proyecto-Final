import { useState } from 'react';
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";

export function NewProject() {
    const { store, dispatch } = useGlobalReducer();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [projectPictureUrl, setProjectPictureUrl] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [error, setError] = useState(null);
    const [status, setStatus] = useState("in progress");
    const [checkEmail, setCheckEmail] = useState("")
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [members, setMembers] = useState([]);
    const [memberEmail, setMemberEmail] = useState("");
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
            dispatch({ type: "error", payload: "Please wait for the image upload to complete." });
            return;
        }
        postNewProject()
    };

    const postNewProject = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/project`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + store.token,
                },
                body: JSON.stringify({
                    title,
                    description,
                    due_date: dueDate,
                    project_picture_url: projectPictureUrl ? projectPictureUrl : null,
                    status,
                    members: members
                })
            });
            const data = await res.json();

            if (res.status === 401 || res.status === 422) {
                dispatch({ type: "LOGOUT" });
                dispatch({ type: "error", payload: "Session expired. Please log in again." });
                navigate("/login");
                return;
            }
            if (!res.ok) {
                dispatch({ type: "error", payload: data.msg || "An error occurred while creating the project." });
                return;
            } else {

                let successMessage = "Project created successfully!";


                if (data.members_info && data.members_info.errors && data.members_info.errors.length > 0) {
                    successMessage += `\n\nWarnings:\n${data.members_info.errors.join('\n')}`;
                }
                dispatch({ type: "reload/delete projects" });
                dispatch({ type: "success", payload: successMessage, });
                navigate("/dashboard");
            }
        } catch (err) {
            dispatch({ type: "error", payload: err?.message || "Could not connect to backend." });
        }
    }


    const handleAddMember = async () => {
        const email = memberEmail.trim();
        setCheckingEmail(true);
        if (!email) return;

        if (members.includes(email)) {
            setCheckEmail("This member is already added.");
            return;
        }

        const emailRegex = /\S+@\S/;
        if (!emailRegex.test(email)) {
            dispatch({ type: "error", payload: "Please enter a valid email address." });
            return;
        }

        setCheckEmail("Checking user...");

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user?email=${encodeURIComponent(email)}`, {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + store.token,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.found) {
                    setMembers([...members, email]);
                    setMemberEmail("");
                    setCheckEmail("");
                } else {
                    throw new Error(`User with email "${email}" not found in the system.`);
                }
            } else {
                dispatch({ type: "error", payload: `User with email "${email}" not found in the system.` });
            }
        } catch (err) {
            dispatch({ type: "error", payload: err?.message || "Could not connect to backend." });
        } finally {
            setCheckingEmail(false);
            setCheckEmail("")
        }
    };

    const handleRemoveMember = (emailToRemove) => {
        setMembers(members.filter(email => email !== emailToRemove));
    };

    const handleMemberKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddMember();
        }
    };

    return (
        <>
            <div className="container app ">
                <div className="card p-5">
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
                                rows={5}
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
                            <label htmlFor="validationCustom04" className="form-label text-dark">Status</label>
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

                            </div>
                            {uploadMessage && (
                                <div className="mt-2 text-muted text-end">
                                    {uploading ? (
                                        <div className="spinner-border spinner-border-sm me-2 " role="status" />
                                    ) : null}
                                    {uploadMessage}
                                </div>
                            )}
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
                        <div className="col-12">
                            <label className="form-label text-dark">Team Members (optional)</label>
                            <div className="input-group mb-3">
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Enter member email"
                                    value={memberEmail}
                                    onChange={e => setMemberEmail(e.target.value)}
                                    onKeyDown={handleMemberKeyPress}
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={handleAddMember}
                                    disabled={!memberEmail.trim()}
                                >
                                    Add
                                </button>
                            </div>
                            {checkEmail && (
                                <div className="mt-2 text-muted">
                                    {uploading ? (
                                        <div className="spinner-border spinner-border-sm me-2 " role="status" />
                                    ) : null}
                                    {checkEmail}
                                </div>
                            )}
                            <div>
                                {members.map((member, index) => (
                                    <div key={index} className="badge bg-blue-500 text-wrap me-2 mb-2">
                                        {member}
                                        <button
                                            type="button"
                                            className="btn-close btn-close-white ms-2"
                                            aria-label="Close"
                                            onClick={() => handleRemoveMember(member)}
                                        ></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col text-end">
                            <button className="btn btn-primary" type="submit">Create new Project</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}