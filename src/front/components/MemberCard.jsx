import React, { useState } from 'react';
import { AlertModal } from "../components/AlertModal"
import useGlobalReducer from "../hooks/useGlobalReducer";

export const MemberCard = ({
    member,
    memberRole,
    userRole,
    projectId,
    onUpdate

}) => {

    const [showAlertModal, setShowAlertModal] = useState(false)
    const { store, dispatch } = useGlobalReducer();

    const handleDeleteMember = () => {
        setShowAlertModal(true)
    };
    const handleAlertResponse = (res)=>{
    if (res === true){
      deleteMember()
    }
  }
    const deleteMember = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/project/${projectId}/member/${member.id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + (store.token || localStorage.getItem("token")),
                },
            });
            const data = await res.json();
            if (!res.ok) {
                dispatch({ type: "error", payload: data.msg || "Failed to remove member" });
                return;
            }
            // Re-fetch project to update member list
            onUpdate(data)
            dispatch({ type: "success", payload: data.msg || "Member removed! " })
        } catch (error) {
            dispatch({ type: "error", payload: error || "Could not remove member" });
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
                        onClick={handleDeleteMember}
                        title="Remove member"
                    >
                        <i className="fa-regular fa-trash-can"></i>
                    </button>
                )}
            </div>
            <AlertModal
                isOpen={showAlertModal}
                onClose={() => { setShowAlertModal(false) }}
                response={handleAlertResponse}
            />
        </div>
    );
};

