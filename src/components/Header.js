import { useState, useEffect } from 'react';

function Header() {

    const [darkMode, setDarkMode] = useState(false);
    const [showInfoPopup, setShowInfoPopup] = useState(false);
    const [showHelpPopup, setShowHelpPopup] = useState(false);

    useEffect(() => {
        document.body.classList.toggle('dark-mode', darkMode);

    }, [darkMode]);

    return (
        <div className='header'>
            <div className='header-title'>
                <img src='logo192.png' width={'50'} height={'50'} style={{ display: 'block', borderRadius: 8 }} alt='logo png' />
                <h2 className='title'>Movement Tray Forge</h2>
            </div>
            {/* <div style={{ gap: '1rem', position: 'absolute', top: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'row' }}> */}
            <div className='header-buttons'>
                <button
                    id='dark-mode-toggle'
                    className='dark-mode-toggle'
                    type='button'
                    onClick={() => setDarkMode(dm => !dm)}>
                    <div className='icon-text'>
                        <i data-feather={darkMode ? "moon" : "sun"} aria-label="dark-mode-icon" />
                        <p> {darkMode ? 'Light Mode' : 'Dark Mode'}</p>
                    </div>
                </button>
                <button
                    className='dark-mode-toggle'
                    type='button'
                    onClick={
                        //show popup for features coming soon
                        () => setShowInfoPopup(true)
                    }>
                    <div className='icon-text' >
                        <i data-feather="info" aria-label="info" />
                        <p>Info</p>
                    </div>
                </button >
                {showInfoPopup && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Upcoming Features</h2>
                            <ul>
                                <li>Different formations including staggered, wedge and diamond</li>
                                <li>Support for different base shapes (oval, square)</li>
                                <li>Customizable support slots for different models</li>
                                <li>Export to other formats (OBJ, 3MF)</li>
                                <li>Save and load configurations</li>
                                <li>Mobile-friendly interface</li>
                                <li>Improved performance for large trays</li>
                                <li>And much more...</li>
                            </ul>
                            <h3>Licenses & Credits</h3>
                            <p>Developed using:</p>
                            <ul>
                                <li><a className='link' href='https://github.com/mrdoob/three.js/'>Three.js - MIT License</a></li>
                                <li><a className='link' href="https://github.com/facebook/react">React - MIT License</a></li>
                                <li><a className='link' href="https://github.com/feathericons/feather">Feather - MIT License </a></li>
                                {/* Add more credits as needed */}
                            </ul>

                            <a className='link' href='https://github.com/tomkneller/movement-tray-gen'> https://github.com/tomkneller/movement-tray-gen</a>
                            <p>Copyright © 2025 Thomas Kneller</p>

                            <button className='button' onClick={() => setShowInfoPopup(false)}>Close</button>
                        </div>
                    </div>
                )
                }
                <button
                    className='dark-mode-toggle'
                    type='button'
                    onClick={
                        //show popup for features coming soon
                        () => setShowHelpPopup(true)
                    }>
                    <div className='icon-text'>
                        <i data-feather="help-circle" aria-label="help-icon" />
                        <p>Help</p>
                    </div>
                </button>
                {
                    showHelpPopup && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Help</h2>
                                <h3>Controls</h3>
                                <p>You can look around the movement tray using the mouse</p>
                                <p><b>Hold Left Click</b> and move the mouse to change your viewing angle</p>
                                <p><b>Hold Right Click</b> and move the mouse to pan</p>
                                <p><b>ScrollWheel</b> to zoom in and out</p>
                                <button className='button' onClick={() => setShowHelpPopup(false)}>Close</button>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
}
export default Header;
