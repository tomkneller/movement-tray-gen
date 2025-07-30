import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import GridGen from './GridGen';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Vector3 } from 'three';
import './index.css';
const feather = require('feather-icons');

function MovementTrayGenerator() {
    const cameraRef = useRef();
    const controlsRef = useRef();

    const [darkMode, setDarkMode] = useState(false);
    const [showInfoPopup, setShowInfoPopup] = useState(false);
    const [showHelpPopup, setShowHelpPopup] = useState(false);

    const [slotType, setSlotType] = useState('circle');

    const [diameter, setDiameter] = useState(25);
    const [ovalLength, setOvalLength] = useState(60);
    const [ovalWidth, setOvalWidth] = useState(35);

    const [magnetWidth, setMagnetWidth] = useState(4);
    const [magnetDepth, setMagnetDepth] = useState(1);

    const [gap, setGap] = useState(0);
    const [baseThickness, setBaseThickness] = useState(2);
    const [edgeHeight, setEdgeHeight] = useState(5);
    const [edgeThickness, setEdgeThickness] = useState(1.5);
    const [staggerFormation, setStaggerFomation] = useState(false);
    const [hasSupportSlot, setHasSupportSlot] = useState(false);
    const [hasMagnetSlot, setHasMagnetSlot] = useState(true);

    const [supportMode, setSupportMode] = useState('circle');
    const [supportCount, setSupportCount] = useState(6);

    const [formationCols, setFormationCols] = useState(3);
    const [formationRows, setFormationRows] = useState(4);

    const [bounds, setBounds] = useState(null);

    const [hasStraySlot, setHasStraySlot] = useState(false);

    const [maxSlots, setMaxSlots] = useState(100);

    const [exportMesh, setExportMesh] = useState(null);

    const [, setMaxReached] = useState(false);

    const handleBaseMeshReady = useCallback((mesh) => {
        setExportMesh(mesh);
    }, []);

    //Center camera
    const recenterCamera = useCallback(() => {
        if (!bounds || !cameraRef.current || !controlsRef.current) return;

        const center = new Vector3();
        bounds.getCenter(center);

        const size = new Vector3();
        bounds.getSize(size);

        const maxDim = Math.max(size.x, size.y);
        const distance = maxDim * 1.4; // adjust zoom factor

        // Position camera back and above
        cameraRef.current.position.set(center.x, center.y - distance, center.z + distance);
        cameraRef.current.lookAt(center);

        controlsRef.current.target.copy(center);
        controlsRef.current.update();
    }, [bounds]);

    const supportSlot = useMemo(() => ({
        enabled: hasSupportSlot,
        length: ovalLength + 1,
        width: ovalWidth + 1,
        mode: supportMode,
        count: supportCount
    }), [hasSupportSlot, ovalLength, ovalWidth, supportCount, supportMode]);

    const magnetSlot = useMemo(() => ({
        enabled: hasMagnetSlot,
        depth: magnetDepth,
        width: magnetWidth
    }), [hasMagnetSlot, magnetDepth, magnetWidth]);

    const handleMaxReached = (value) => {
        setMaxReached(true);

        setMaxSlots(value);

        setSupportCount(value)
        console.log("Maximum value reached in the counter!");
        // Potentially disable increment button or show a message
    };

    const resetMaxSlots = () => {
        setMaxReached(false);
        setMaxSlots(100);
    }

    useEffect(() => {
    }, [bounds]);

    useEffect(() => {
        if (supportMode === 'circle') {
            setOvalLength(ovalWidth);
        }
    }, [supportMode, ovalWidth]);

    useEffect(() => {
        document.body.classList.toggle('dark-mode', darkMode);

    }, [darkMode]);

    const setCameraView = (view) => {
        const center = new Vector3();
        bounds.getCenter(center);

        const size = new Vector3();
        bounds.getSize(size);

        const maxDim = Math.max(size.x, size.y);
        const distance = maxDim * 1.4; // adjust zoom factor

        switch (view) {
            case 'top':
                cameraRef.current.position.set(0, 0, distance);
                cameraRef.current.lookAt(center);
                break;
            case 'bottom':
                cameraRef.current.position.set(0, 0, -distance);
                cameraRef.current.lookAt(center);
                break;
            default:
                break
        }

        cameraRef.current.updateProjectionMatrix();
    };

    useEffect(() => {
        recenterCamera();
    }, [bounds, recenterCamera]);

    //Required for feather icons to work
    useEffect(() => {
        feather.replace();
    }, []);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        switch (name) {
            case 'slotType':
                setSlotType(value);
                if (value === 'square') {
                    setGap(edgeThickness);
                }
                break;
            case 'diameter':
                setDiameter(parseFloat(value));
                resetMaxSlots();
                break;
            case 'ovalLength':
                setOvalLength(parseFloat(value));
                resetMaxSlots();
                break;
            case 'ovalWidth':
                setOvalWidth(parseFloat(value));
                resetMaxSlots();
                break;
            case 'gap':
                setGap(parseFloat(value));
                if (slotType === 'square') {
                    setEdgeThickness(parseFloat(value));
                }
                break;
            case 'baseThickness':
                setBaseThickness(parseFloat(value));
                break;
            case 'edgeHeight':
                setEdgeHeight(parseFloat(value));
                break;
            case 'edgeThickness':
                setEdgeThickness(parseFloat(value));
                if (slotType === 'square') {
                    setGap(parseFloat(value));
                }
                break;
            case 'staggerFormation':
                setStaggerFomation(!staggerFormation);
                if (staggerFormation) {
                    // If turning off stagger, also turn off stray slot
                    setHasStraySlot(false);
                }
                break;
            case 'supportSlot':
                setHasSupportSlot(!hasSupportSlot);
                break;
            case 'supportMode':
                setSupportMode(value);
                break;
            case 'supportCount':
                setSupportCount(parseFloat(value));
                break;
            case 'magnetSlot':
                setHasMagnetSlot(!hasMagnetSlot);
                break;
            case 'magnetDepth':
                setMagnetDepth(parseFloat(value));
                break;
            case 'magnetWidth':
                setMagnetWidth(parseFloat(value));
                break;
            case 'formationCols':
                setFormationCols(parseFloat(value));
                break;
            case 'formationRows':
                setFormationRows(parseFloat(value));
                break;
            case 'straySlot':
                setHasStraySlot(!hasStraySlot);
                break;
            default:
                break;
        }
    };


    const generateVisualization = () => {
        return (<div style={{ width: '100%', height: '100%' }}>
            <Canvas style={{ width: '100%', height: '100%', borderRadius: '16px' }} shadows>
                {/* <CameraControls bounds={bounds} /> */}
                <PerspectiveCamera ref={cameraRef}
                    makeDefault
                    fov={70} />
                <ambientLight intensity={0.5} />
                <directionalLight castShadow
                    position={[0, 0, 5]}
                    intensity={1}
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                    shadow-camera-far={50}
                    shadow-camera-left={-10}
                    shadow-camera-right={10}
                    shadow-camera-top={10}
                    shadow-camera-bottom={-10} />
                <OrbitControls ref={controlsRef} />
                <GridGen setBounds={setBounds} slotType={slotType} baseThickness={baseThickness} baseWidth={diameter} edgeThickness={edgeThickness} edgeHeight={edgeHeight} stagger={staggerFormation} rows={formationRows} cols={formationCols} gap={gap} supportSlot={supportSlot} magnetSlot={magnetSlot} straySlot={hasStraySlot} onMaxReached={handleMaxReached} onBaseMeshReady={handleBaseMeshReady} darkMode={darkMode} />
            </Canvas>
        </div>);
    };

    /**
    * TODO: Implementation of backend for downloading stl
    */
    const handleDownloadSTL = () => {
        console.log('Requesting STL download with current parameters...');
        if (!exportMesh) {
            console.warn('No mesh to export.');
            return;
        }

        const exporter = new STLExporter();
        const stlString = exporter.parse(exportMesh);

        const blob = new Blob([stlString], { type: 'text/plain' });
        const link = document.createElement('a');
        link.style.display = 'none';
        document.body.appendChild(link);

        link.href = URL.createObjectURL(blob);
        link.download = 'movement_tray.stl';
        link.click();
    };

    return (
        <div className='background-body'>
            <div className='header'>
                <img src='logo192.png' width={'50'} height={'50'} style={{ display: 'block', borderRadius: 8 }} alt='logo png' />
                <h2 className='title'>Movement Tray Forge</h2>
            </div>

            <div style={{ gap: '1rem', position: 'absolute', top: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'row' }}>
                <button
                    id='dark-mode-toggle'
                    className='dark-mode-toggle'
                    onClick={() => setDarkMode(dm => !dm)}
                >
                    {/* {darkMode ? 'Light Mode' : 'Dark Mode'} */}
                    <div className='icon-text'>
                        <i data-feather={darkMode ? "moon" : "sun"} aria-label="dark-mode-icon" />
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </div>
                </button>
                <button
                    className='dark-mode-toggle'
                    style={{ top: 24, right: 150 }}
                    onClick={
                        //show popup for features coming soon
                        () => setShowInfoPopup(true)
                    }>
                    <div className='icon-text' >
                        <i data-feather="info" aria-label="info" style={{ marginRight: 6 }} />
                        Info
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
                                <li><a href='https://github.com/mrdoob/three.js/'>Three.js - MIT License</a></li>
                                <li><a href="https://github.com/facebook/react">React - MIT License</a></li>
                                <li><a href="https://github.com/feathericons/feather">Feather - MIT License </a></li>
                                {/* Add more credits as needed */}
                            </ul>

                            <a href='https://github.com/tomkneller/movement-tray-gen' style={{ color: darkMode ? 'grey' : 'blue' }}> https://github.com/tomkneller/movement-tray-gen</a>
                            <p>Copyright © 2025 Thomas Kneller</p>

                            <button className='button' onClick={() => setShowInfoPopup(false)}>Close</button>
                        </div>
                    </div>
                )
                }

                <button
                    className='dark-mode-toggle'
                    style={{ top: 24, right: 275 }}
                    onClick={
                        //show popup for features coming soon
                        () => setShowHelpPopup(true)
                    }>
                    <div className='icon-text'>
                        <i data-feather="help-circle" aria-label="help-icon" />
                        Help
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

            <div className='container' style={{ height: '82vh' }}>
                <div className='tray-panel'>
                    <Tabs
                        selectedTabClassName="react-tabs__tab--selected"
                        style={{ marginBottom: 16 }}
                    >
                        <TabList style={{ borderBottom: '1px solid #dfe6e9', marginBottom: 16 }}>
                            <Tab id="tab">
                                Tray Options
                            </Tab>
                            <Tab id="tab">
                                Magnet Slots
                            </Tab>
                            <Tab id="tab">
                                Formations
                            </Tab>
                            <Tab id="tab">
                                Support Slots
                            </Tab>
                        </TabList>
                        <TabPanel>
                            <h3 className='tabTitle'>Tray Options</h3>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Slot Shape:</label>
                                <select name='slotType' value={slotType} onChange={handleInputChange} className="input">
                                    <option value={'circle'}>Circle</option>
                                    <option value={'square'}>Square</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Diameter:</label>
                                <input type="number" name="diameter" value={diameter} onChange={handleInputChange}
                                    className="input" />
                                <label style={{ fontWeight: 500 }}>mm</label>
                            </div>
                            <div inert={hasSupportSlot} style={{ marginBottom: 12 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Columns:</label>
                                    <input type="number" name="formationCols" value={formationCols} onChange={handleInputChange}
                                        className="input" />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Rows:</label>
                                    <input type="number" name="formationRows" value={formationRows} onChange={handleInputChange}
                                        className="input" />
                                </div>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Base Thickness:</label>
                                <input type="number" name="baseThickness" value={baseThickness} onChange={handleInputChange} min={2} max={edgeHeight}
                                    className="input" />
                                <label style={{ fontWeight: 500 }}>mm</label>

                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Edge Height:</label>
                                <input type="number" name="edgeHeight" value={edgeHeight} onChange={handleInputChange} min={2} max={10}
                                    className="input" />
                                <label style={{ fontWeight: 500 }}>mm</label>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Edge Thickness:</label>
                                <input type="number" name="edgeThickness" value={edgeThickness} onChange={handleInputChange} min={1}
                                    className="input" />
                                <label style={{ fontWeight: 500 }}>mm</label>
                            </div>
                            <div inert={hasSupportSlot} style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Gap:</label>
                                <input type="number" name="gap" value={gap} onChange={handleInputChange} min={0}
                                    className="input" />
                                <label style={{ fontWeight: 500 }}>mm</label>
                            </div>
                        </TabPanel>
                        <TabPanel>
                            <h3 className='tabTitle'>Add Magnet Slots</h3>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Magnet Slots:</label>
                                <input type="checkbox" name="magnetSlot" checked={hasMagnetSlot} value={hasMagnetSlot} onChange={handleInputChange}
                                    style={{ marginLeft: 8 }} />
                            </div>
                            <div inert={!hasMagnetSlot}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Magnet Diameter:</label>
                                    <input type="number" name="magnetWidth" value={magnetWidth} onChange={handleInputChange} min={1} max={diameter - 2}
                                        className="input" />
                                    <label style={{ fontWeight: 500 }}>mm</label>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Magnet Depth:</label>
                                    <input type="number" name="magnetDepth" value={magnetDepth} onChange={handleInputChange} min={1} max={baseThickness - 1}
                                        className="input" />
                                    <label style={{ fontWeight: 500 }}>mm</label>
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel>
                            <h3>Formation</h3>
                            <div inert={hasSupportSlot || slotType === 'square'}>
                                <div>
                                    <label style={{ fontWeight: 500 }}>Stagger Formation:</label>
                                    <input type='checkbox' name="staggerFormation" checked={staggerFormation} value={staggerFormation} onChange={handleInputChange} />
                                </div>
                                <div inert={!staggerFormation}>
                                    <label style={{ fontWeight: 500 }}>Remove Stray Slots:</label>
                                    <input type="checkbox" name="straySlot" checked={hasStraySlot} value={hasStraySlot} onChange={handleInputChange} />
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel>
                            <h3 className='tabTitle'>Add support slot</h3>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Support Slot:</label>
                                <input type="checkbox" name="supportSlot" checked={hasSupportSlot} value={hasSupportSlot} onChange={handleInputChange} className="input" />
                            </div>
                            <div inert={!hasSupportSlot} >
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Support Mode:</label>
                                    <select name='supportMode' value={supportMode} onChange={handleInputChange} className="input">
                                        <option value={'circle'}>Circle</option>
                                        <option value={'oval'}>Oval</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Support Slots Count:</label>
                                    <input type="number" name="supportCount" value={supportCount} onChange={handleInputChange} max={maxSlots} className="input" />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Oval Width:</label>
                                    <input type="number" name="ovalWidth" value={ovalWidth} onChange={handleInputChange} className="input" />
                                    <label style={{ fontWeight: 500 }}>mm</label>
                                </div>
                                <div inert={supportMode === 'circle'}>
                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ fontWeight: 500 }}>Oval Length:</label>
                                        <input type="number" name="ovalLength" value={ovalLength} onChange={handleInputChange} className="input" />
                                        <label style={{ fontWeight: 500 }}>mm</label>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                    </Tabs>

                    {/* Download STL button fixed at the bottom */}
                    <button
                        onClick={handleDownloadSTL}
                        className='download-btn'
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >

                        <div className='icon-text' style={{ justifyContent: 'center' }}>
                            <i data-feather="download" aria-label="download-icon" />
                            Download STL
                        </div>
                    </button>

                    <div className="warningBox" style={{ padding: '15px', marginTop: 12, borderRadius: '8px', backgroundColor: 'yellow', width: '500px', color: 'black' }}>
                        <h3>Warning</h3>
                        <p>This application is in early development and it is highly recommended that you use the automatic repair option in your 3D printer slicer or 3D model viewer first before printing as there may be some artifacts which will result in less than optimal printing results </p>
                    </div>
                </div>



                <div className='trayFrame' style={{ height: '100%', minWidth: '300px' }}>
                    <div style={{
                        position: 'absolute',
                        top: '8rem',
                        right: '4rem',
                        zIndex: 10,
                        display: 'flex',
                        gap: '0.5rem',
                        height: '40px',
                        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        alignItems: 'center',
                    }}>
                        <i data-feather="eye" style={{ height: 40 }}></i>
                        <button className='button' style={{ height: 40 }} onClick={() => recenterCamera()}><i data-feather="home"></i></button>
                        <button className='button' style={{ height: 40 }} onClick={() => setCameraView('top')}>Top</button>
                        <button className='button' style={{ height: 40 }} onClick={() => setCameraView('bottom')}>Bottom</button>
                    </div>
                    {generateVisualization()}
                </div>
            </div>
            <div className='footer'>
                <p>Copyright © 2025 tomkneller</p>
            </div>
        </div >
    );
}

export default MovementTrayGenerator;
