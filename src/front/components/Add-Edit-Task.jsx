import { useState, useEffect } from 'react';
import useGlobalReducer from "../hooks/useGlobalReducer";

export function AddEditTask({ project, isOpen, onClose, onUpdate, task, onEdit }) {
    const { store, dispatch } = useGlobalReducer();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "in progress",
        assigned_to_id: "",
    });

    // AI state
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (onEdit && task !== null) {
                setFormData({
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    assigned_to_id: task.assigned_to_id || (store.user.id !== project.admin_id ? store.user.id : ""),
                });
            } else {
                setFormData({
                    title: "",
                    description: "",
                    status: "in progress",
                    assigned_to_id: store.user.id !== project.admin_id ? store.user.id : "",
                });
            }
        }
    }, [task, project, onEdit, isOpen, store.user.id, project.admin_id]);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.name === "status"
                ? e.target.value.toLowerCase()
                : e.target.value,
        }));
    };

    // AI Suggest Handler
    const handleAiSuggest = () => {
        if (!formData.title.trim()) return;
        setIsAiLoading(true);
        setAiError("");
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/suggest-description`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: formData.title })
        })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                    setAiError(data.msg || "Error generating description.");
                    return;
                }
                setFormData(prev => ({ ...prev, description: data.suggestion }));
            })
            .catch(err => setAiError("Connection error."))
            .finally(() => setIsAiLoading(false));
    };

    const postTask = (dataToSend) => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/project/${project.id}/task`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + store.token,
            },
            body: JSON.stringify(dataToSend),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    dispatch({ type: "error", payload: (data.msg?.toString?.() || "There was an error posting the task") });
                    return;
                }
                dispatch({ type: "success", payload: data.msg?.message || "Task Created" });
                onUpdate(data);
                onClose();
            })
            .catch((err) => {
                dispatch({ type: "error", payload: err?.message || "Connection error with the server." });
            });
    };

    const putTask = (dataToSend) => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/project/${project.id}/task/${task.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + store.token,
            },
            body: JSON.stringify(dataToSend),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    dispatch({ type: "error", payload: data.msg || "There was an error posting the task" });
                    return;
                }
                onUpdate(data);
                onClose();
            })
            .catch((err) => {
                dispatch({ type: "error", payload: err?.message || "Connection error with the server." });
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let dataToSend = { ...formData };
        if (store.user.id === project.admin_id) {
            if (!formData.assigned_to_id || formData.assigned_to_id === "") {
                dataToSend.assigned_to_id = null;
            } else {
                dataToSend.assigned_to_id = Number(formData.assigned_to_id);
            }
        }
        onEdit ? putTask(dataToSend) : postTask(dataToSend);
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show flex-center text-black" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        {onEdit ? (<h5 className="modal-title">Edit task</h5>
                        ) : (
                            <h5 className="modal-title">Create a task</h5>)}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Task Title</label>
                                <input
                                    type="text"
                                    name='title'
                                    className="form-control"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                                {/* AI Suggest Button placed here */}
                                <button
                                    type="button"
                                    className="btn-ai-suggest my-2"
                                    style={{
                                        width: '100%',
                                        maxWidth: '340px',
                                        margin: '0 auto',
                                        display: 'block',
                                        minHeight: "38px"
                                    }}
                                    onClick={handleAiSuggest}
                                    disabled={isAiLoading || !formData.title.trim()}
                                    title="Suggest a description using AI"
                                >
                                    <span className="ai-sparkle" role="img" aria-label="ai">✨</span> Suggest Description with AI
                                    {isAiLoading && (
                                        <span className="spinner-border spinner-border-sm ms-2" />
                                    )}
                                </button>
                                {aiError && <span className="text-danger">{aiError}</span>}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-control"
                                    name='description'
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                />
                            </div>

                            <div className="row">
                                <div className="col-6">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        name='status'
                                        value={formData.status}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="in progress">In progress</option>
                                        <option value="delegated">Delegated</option>
                                        <option value="done">Done</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div className="col-6">
                                    <label className="form-label">Assigned</label>
                                    <select
                                        className="form-select"
                                        name='assigned_to_id'
                                        value={formData.assigned_to_id}
                                        onChange={handleChange}
                                        required
                                        disabled={store.user.id !== project.admin_id}
                                    >
                                        {store.user.id === project.admin_id ? (
                                            <>
                                                <option value={""}>Select assignee</option>
                                                <option value={store.user.id}>{store.user.full_name} (admin)</option>
                                                {(project.members ?? []).map((member) => (
                                                    <option key={member.member_id || member.id} value={member.id}>
                                                        {member.full_name}
                                                    </option>
                                                ))}
                                            </>
                                        ) : (
                                            <option value={store.user.id}>{store.user.full_name}</option>
                                        )}
                                    </select>
                                </div>
                            </div>
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
                        >
                            {onEdit ? "Edit Task" : "Post"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
