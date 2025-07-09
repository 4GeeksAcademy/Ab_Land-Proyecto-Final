import React, { useState } from 'react';

export const MemberCard = ({
    member,
    memberRole,
    userRole,
    projectId,
    token,
    onMemberRemoved
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDelete = async () => {
        if (!window.confirm(`Remove ${member.full_name} from project?`)) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `${process.env.BACKEND_URL || 'http://localhost:3001'}/project/${projectId}/member/${member.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            const data = await res.json();
            if (res.ok) {
                // Notify parent to refresh member list, or remove from UI
                if (onMemberRemoved) onMemberRemoved(member.id);
            } else {
                setError(data.msg || 'Error removing member');
            }
        } catch (err) {
            setError('Server error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card shadow rounded-pill p-2 mb-2 border-0 ">
            <div className="d-flex align-items-center px-1 ">
                <img
                    src={member.profile_picture_url}
                    alt={`${member.full_name}'s portrait`}
                    onError={e => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=random`;
                    }}
                    className="rounded-circle cover me-4"
                    style={{ width: 40, height: 40 }}
                />
                <h5 className="me-2 text-capitalize" style={{ width: "20%" }}>{member.full_name}</h5>
                <h6 className='me-2 text-capitalize'><strong>Role:</strong> {memberRole}</h6>
                {userRole === "admin" && (
                    <button
                        className="btn btn-outline-danger btn-sm rounded-circle ms-auto"
                        onClick={handleDelete}
                        disabled={loading}
                        title="Remove member"
                    >
                        <i className="fa-regular fa-trash-can"></i>
                    </button>
                )}
            </div>
            {error && (
                <div className="text-danger small mt-1 ms-5">
                    {error}
                </div>
            )}
        </div>
    );
};

