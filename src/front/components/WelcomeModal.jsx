import { useState } from "react"
import React from 'react'
import { Link } from "react-router-dom"


export const WelcomeModal = ({isOpen, onClose}) => {
    if (!isOpen) return null; // Only render if open
    const handleClose = () => { onClose() }
    return (
        <div className="modal show flex-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="card border-0" style={{ height: "70vh", aspectRatio: "1/1.25", }}>
                <div className=" position-relative">
                    <img src="https://res.cloudinary.com/dvawhw99g/image/upload/cld-sample-2.jpg" className="card-img-top cover" alt="..." />
                    <button
                        type="button"
                        className="btn-close position-absolute top-0 end-0 m-2"
                        onClick={handleClose}
                    ></button>
                </div>
                <div className="card-body flex-center flex-column p-4">

                    <h5 className="fw-bold mb-2">Welcome to EchoBoard</h5>
                    <p className="text-muted text-center mb-3">
                        welcome to your dashboard <br />
                        It seems you are new here or do not have any projects <br />
                        have fun and create a new one
                    </p>
                    <Link to={"/newProject"}>
                        <button className="btn btn-primary">Create a new project</button>
                    </Link>
                </div>
            </div>
        </div >
    )
}
