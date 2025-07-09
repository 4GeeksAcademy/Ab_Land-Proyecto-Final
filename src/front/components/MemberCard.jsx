import React from 'react'
import { useState,useEffect } from 'react'
import useGlobalReducer from '../hooks/useGlobalReducer'

export const MemberCard = ({ member, memberRole, userRole }) => {  
    
        
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
                {userRole === "admin" && <button className="btn btn-outline-danger btn-sm rounded-circle ms-auto">
                    <i className="fa-regular fa-trash-can"></i>
                </button>}

            </div>
        </div>
    )
}
