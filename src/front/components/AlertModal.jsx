import { useState } from "react"
import React from 'react'


export const AlertModal = ({ isOpen, onClose, response }) => {
    if (!isOpen) return null; // Only render if open
    const handleClose = () => { onClose() }
    const handleYes = () => {
        response(true)
        handleClose()
    }
    const handleNo = () => {
        response(false)
        handleClose()
    }
    return (
        <div className="modal show flex-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="card border-0 p-4 text-center" >
                <div className=" position-relative text-center p-3 mb-2">
                    <i className="fa-solid fa-circle-exclamation text-warning"
                        style={{ fontSize: "10vh" }} />
                    <button
                        type="button"
                        className="btn-close position-absolute top-0 end-0 m-2"
                        onClick={handleClose}
                    ></button>
                </div>
                <h1 className="mb-3"> Are you sure?</h1>
                <h4 className="mb-4">You won't be able to revert this!</h4>
                <div className="d-flex justify-content-around">
                    <button className="btn btn-secondary me-4"
                        onClick={handleNo}>Cancel</button>
                    <button className="btn btn-danger"
                        onClick={handleYes}>Delete</button>
                </div>
            </div>
        </div>
    )
}
