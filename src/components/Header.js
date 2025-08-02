import { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';

import { Info, HelpCircle, Moon, Sun } from 'react-feather';

function Header() {
    const [showInfoPopup, setShowInfoPopup] = useState(false);
    const [showHelpPopup, setShowHelpPopup] = useState(false);

    const ThemeToggleButton = () => {
        const { theme, toggleTheme } = useTheme();
        return (
            <button
                id='dark-mode-toggle'
                className='dark-mode-toggle'
                type='button'
                onClick={toggleTheme}>
                <div className='icon-text'>
                    {theme === 'dark-mode' ? <Moon /> : <Sun />}
                    <p> {theme === 'dark-mode' ? 'Light Mode' : 'Dark Mode'}</p>
                </div>
            </button >
        );
    };

    return (
        <div className='header'>
            <div className='header-title'>
                <img src='logo192.png' width={'50'} height={'50'} style={{ display: 'block', borderRadius: 8 }} alt='logo png' />
                <h2 className='title'>Movement Tray Forge</h2>
            </div>
            <div className='header-buttons'>
                <ThemeToggleButton />
                <button
                    className='dark-mode-toggle'
                    type='button'
                    onClick={
                        //show popup for features coming soon
                        () => setShowInfoPopup(true)
                    }>
                    <div className='icon-text' >
                        <Info />
                        <p>Info</p>
                    </div>
                </button >
                {showInfoPopup && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>New in this version </h2>
                            <ul>
                                <li>Mobile-friendly interface</li>
                                <li>Saved dark/light mode preferences</li>
                            </ul>
                            <h2>Upcoming Features</h2>
                            <ul>
                                <li>Different formations including staggered, wedge and diamond</li>
                                <li>Support for different base shapes (oval, square)</li>
                                <li>Customizable support slots for different models</li>
                                <li>Export to other formats (OBJ, 3MF)</li>
                                <li>Save and load configurations</li>
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
                        <HelpCircle />
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
