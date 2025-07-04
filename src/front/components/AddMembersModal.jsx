import { useState, useEffect } from 'react';
import useGlobalReducer from "../hooks/useGlobalReducer";

export function AddMembersModal({ project, isOpen, onClose, onUpdate }) {
    const { store } = useGlobalReducer();
    const [memberEmail, setMemberEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentProject, setCurrentProject] = useState(project);

    // Actualizar el proyecto local cuando cambie el prop
    useEffect(() => {
        setCurrentProject(project);
    }, [project]);

    if (!isOpen || !currentProject) return null;

    const handleAddMember = async () => {
        const email = memberEmail.trim();
        if (!email) {
            setError("Please enter an email address.");
            return;
        }

        // Validación básica de email
        const emailRegex = /\S+@\S/
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Verificar si el usuario existe
            const checkResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user?email=${encodeURIComponent(email)}`, {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + store.token,
                },
            });

            if (!checkResponse.ok) {
                setError(`User with email "${email}" not found in the system.`);
                return;
            }

            const userData = await checkResponse.json();
            if (!userData.found) {
                setError(`User with email "${email}" not found in the system.`);
                return;
            }

            // Agregar el miembro al proyecto
            const addResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/project/${currentProject.id}/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + store.token,
                },
                body: JSON.stringify({
                    members: [email]
                }),
            });

            const data = await addResponse.json();
            
            if (addResponse.ok) {
                if (data.added_members && data.added_members.length > 0) {
                    setSuccess(`Successfully added ${userData.user.full_name} to the project!`);
                    setMemberEmail(""); // Limpiar el input pero no cerrar el modal
                    onUpdate(); // Actualizar el proyecto en el Dashboard
                    
                    // Limpiar el mensaje de éxito después de 3 segundos
                    setTimeout(() => {
                        setSuccess("");
                    }, 3000);
                } else if (data.errors && data.errors.length > 0) {
                    setError(data.errors.join(', '));
                }
            } else {
                setError(data.msg || "Error adding member to project.");
            }
        } catch (err) {
            setError("Connection error with the server.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddMember();
        }
    };

    const handleClose = () => {
        setMemberEmail("");
        setError("");
        setSuccess("");
        onClose();
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Add Team Member</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <p className="mb-3">
                            Add a new member to <strong>{currentProject.title}</strong>
                        </p>

                        <div className="mb-3">
                            <label className="form-label">Member Email</label>
                            <div className="input-group">
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Enter member email"
                                    value={memberEmail}
                                    onChange={e => {
                                        setMemberEmail(e.target.value);
                                        if (error || success) {
                                            setError("");
                                            setSuccess("");
                                        }
                                    }}
                                    onKeyDown={handleKeyPress}
                                    disabled={loading}
                                />
                                <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={handleAddMember}
                                    disabled={!memberEmail.trim() || loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Member'
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success" role="alert">
                                {success}
                            </div>
                        )}

                        {/* Current Members */}
                        <div className="mt-4">
                            <h6>Current Team Members:</h6>
                            <div className="d-flex flex-wrap gap-2">
                                {/* Admin */}
                                <div className="d-flex align-items-center mb-2">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                            currentProject.admin_full_name
                                        )}&background=28a745&color=fff`}
                                        alt={currentProject.admin_full_name}
                                        className="rounded-circle me-2"
                                        width="24"
                                        height="24"
                                    />
                                    <small>
                                        <strong>{currentProject.admin_full_name}</strong> (Admin)
                                    </small>
                                </div>

                                {/* Members */}
                                {currentProject.members && currentProject.members.map((member, idx) => (
                                    <div key={idx} className="d-flex align-items-center mb-2">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                member.full_name || `M${idx + 1}`
                                            )}&background=0D8ABC&color=fff`}
                                            alt={member.full_name || `Member ${idx + 1}`}
                                            className="rounded-circle me-2"
                                            width="24"
                                            height="24"
                                        />
                                        <small>{member.full_name}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleClose}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
