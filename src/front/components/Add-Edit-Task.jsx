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


    useEffect(() => {
    if (onEdit && task !== null) {
        setFormData({
            title: task.title,
            description: task.description,
            status: task.status,
            assigned_to_id: task.assigned_to_id,
        });
    } else if (isOpen) {
        // Reset form when opening for a new task
        setFormData({
            title: "",
            description: "",
            status: "in progress",
            assigned_to_id: "",
        });
    }
}, [task, project, onEdit, isOpen]);


    const handleSubmit = (e) => {
        e.preventDefault();
        onEdit ? putTask() : postTask()
    };

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.name === "status" ?
                e.target.value.toLowerCase() : e.target.value,
        }));
    };
    console.log(`task: ${task}`);

    const postTask = () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/project/${project.id}/task`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + store.token,
            },
            body: JSON.stringify(formData),
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) {
                    dispatch({ type: "error", payload: (data.msg?.toString?.() || "There was an error posting the task") });

                    return;
                }
                dispatch({type:"success", payload: data.msg?.message || "Task Created"})
                onUpdate(data); // Callback para actualizar la lista?
                onClose(); // Cerrar el modal
            })
            .catch((err) => {
                dispatch({ type: "error", payload: err || "Connection error with the server." });
            });
    }

    const putTask = () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/project/${project.id}/task/${task.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + store.token,
            },
            body: JSON.stringify(formData),
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) {
                    dispatch({ type: "error", payload: data.msg || "There was an error posting the task" });
                    return;
                }
                onUpdate(data); // Callback para actualizar la lista?
                onClose(); // Cerrar el modal
            })
            .catch((err) => {
                dispatch({ type: "error", payload: err || "Connection error with the server." });
            });
    }
    

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
                                    <label className="form-label">assigned</label>
                                    <select
                                        className="form-select"
                                        name='assigned_to_id'
                                        value={formData.assigned_to_id}
                                        onChange={handleChange}

                                    >
                                        <option value="" disabled>Select a member</option>
                                        {project?.members?.map((member) => (
                                            <option key={member.id} value={member.id}>
                                                {member.full_name}
                                            </option>
                                        ))}

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
