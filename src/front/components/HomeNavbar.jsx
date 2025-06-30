import React from 'react'
import logo from '../assets/img/SVG/logo_v2.svg'
import { Link } from 'react-router-dom'


export const HomeNavbar = () => {
    const goTo = (id) => {
        document.getElementById(id).scrollIntoView({ behavior: "smooth" });
    }
    return (
        <div className='container-fluid px-5 py-none'>
            <a class="navbar-brand d-flex align-items-center text-white" href="#">
                <img src={logo} alt="Logo" style={{ width: '7rem', height: '7rem' }} class="d-inline-block mx-2 " />
                EchoBoard
            </a>

            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon navbar-dark"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className='nav mx-auto '>
                <li className='nav-item'>
                    <button className='nav-link text-white' onClick={() => { goTo('home') }}> Home</button>
                </li>
                <li className='nav-item '>
                    <button className='nav-link text-white' onClick={() => { goTo('howitworks') }}> How it Works</button>
                </li>
                <li className='nav-item'>
                    <button className='nav-link text-white' onClick={() => { goTo('ourteam') }}> Our Team</button>
                </li>

            </ul>
            <Link to="/" className='shadow-lg ms-3'>
                <button className='btn text-white' style={{ background: "var(--green-500)" }}>Sing In</button>
            </Link>
            </div>

        </div>
    )
}
