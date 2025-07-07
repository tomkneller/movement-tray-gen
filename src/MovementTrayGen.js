import React, { useState, useEffect, useRef } from 'react';
import GridGen from './GridGen';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Vector3 } from 'three';


function MovementTrayGenerator() {
    const cameraRef = useRef();
    const controlsRef = useRef();

    const [circularDiameter, setCircularDiameter] = useState(25);
    const [ovalLength, setOvalLength] = useState(60);
    const [ovalWidth, setOvalWidth] = useState(35.5);

    const [magnetWidth, setMagnetWidth] = useState(2);
    const [magnetDepth, setMagnetDepth] = useState(1);

    const [gap, setGap] = useState(0);
    const [baseThickness, setBaseThickness] = useState(2);
    const [edgeHeight, setEdgeHeight] = useState(4);
    const [edgeThickness, setEdgeThickness] = useState(2);
    const [staggerFormation, setStaggerFomation] = useState(false);
    const [hasSupportSlot, setHasSupportSlot] = useState(false);
    const [hasMagnetSlot, setHasMagnetSlot] = useState(true);

    const [supportMode, setSupportMode] = useState('wrap');
    const [supportCount, setSupportCount] = useState(6);

    const [formationCols, setFormationCols] = useState(3);
    const [formationRows, setFormationRows] = useState(4);

    const [bounds, setBounds] = useState(null);

    const [hasStraySlot, setHasStraySlot] = useState(false);

    const [maxSlots, setMaxSlots] = useState(100);

    const [exportMesh, setExportMesh] = useState(null);

    const [maxReached, setMaxReached] = useState(false);

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
        console.log("Bounds updated:", bounds);
    }, [bounds]);

    useEffect(() => {
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


    const handleInputChange = (event) => {
        const { name, value } = event.target;
        switch (name) {
            case 'circularDiameter':
                setCircularDiameter(parseFloat(value));
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
                break;
            case 'baseThickness':
                setBaseThickness(parseFloat(value));
                break;
            case 'edgeHeight':
                setEdgeHeight(parseFloat(value));
                break;
            case 'edgeThickness':
                setEdgeThickness(parseFloat(value));
                break;
            case 'staggerFormation':
                setStaggerFomation(!staggerFormation);
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
        console.log('Generating visualization with current parameters:', {
            circularDiameter,
            ovalLength,
            ovalWidth,
            gap,
            baseThickness,
            edgeHeight,
            edgeThickness,
            staggerFormation,
            hasSupportSlot,
        });
        return (<div style={{ flex: 1 }}>
            <Canvas style={{ width: '100%', height: '90vh' }}>
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
                <GridGen setBounds={setBounds} baseThickness={baseThickness} baseWidth={circularDiameter} edgeThickness={edgeThickness} edgeHeight={edgeHeight} stagger={staggerFormation} rows={formationRows} cols={formationCols} gap={gap} supportSlot={{ enabled: hasSupportSlot, length: ovalLength, width: ovalWidth, mode: supportMode, count: supportCount }} magnetSlot={{ enabled: hasMagnetSlot, depth: magnetDepth, width: magnetWidth }} straySlot={hasStraySlot} onMaxReached={handleMaxReached} onBaseMeshReady={(mesh) => setExportMesh(mesh)} />
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
        <div style={{ fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f5f6fa', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: 16, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <img src='logo192.png' width={'50'} height={'50'} style={{ display: 'block', borderRadius: 8 }} alt='logo png' />
                <h2 style={{ paddingLeft: 16, margin: 0, color: '#2d3436', fontWeight: 600, fontSize: 28 }}>Movement Tray Forge</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', width: '100%', marginTop: 24 }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff',
                    minHeight: 500,
                    width: 380,
                    borderRadius: 16,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    marginLeft: 32,
                    marginRight: 32,
                    padding: 24,
                    position: 'relative'
                }}>
                    <Tabs
                        selectedTabClassName="react-tabs__tab--selected"
                        style={{ marginBottom: 16 }}
                    >
                        <TabList style={{ borderBottom: '1px solid #dfe6e9', marginBottom: 16 }}>
                            <Tab style={{ padding: '8px 20px', borderRadius: 8, marginRight: 8, cursor: 'pointer', border: 'none', background: '#f1f2f6', fontWeight: 500 }}>Tray Options</Tab>
                            <Tab style={{ padding: '8px 20px', borderRadius: 8, marginRight: 8, cursor: 'pointer', border: 'none', background: '#f1f2f6', fontWeight: 500 }}>Support Slots</Tab>
                            <Tab style={{ padding: '8px 20px', borderRadius: 8, marginRight: 8, cursor: 'pointer', border: 'none', background: '#f1f2f6', fontWeight: 500 }}>Magnet Slots</Tab>
                            <Tab style={{ padding: '8px 20px', borderRadius: 8, cursor: 'pointer', border: 'none', background: '#f1f2f6', fontWeight: 500 }}>Formations</Tab>
                        </TabList>
                        <TabPanel>
                            <h3 style={{ color: '#636e72', marginTop: 0 }}>Base Size</h3>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Circular Diameter:</label>
                                <input type="number" name="circularDiameter" value={circularDiameter} onChange={handleInputChange}
                                    style={{ ...inputStyle }} />
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Columns:</label>
                                <input type="number" name="formationCols" value={formationCols} onChange={handleInputChange}
                                    style={{ ...inputStyle }} />
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Rows:</label>
                                <input type="number" name="formationRows" value={formationRows} onChange={handleInputChange}
                                    style={{ ...inputStyle }} />
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Base Thickness:</label>
                                <input type="number" name="baseThickness" value={baseThickness} onChange={handleInputChange} min={2} max={edgeHeight}
                                    style={{ ...inputStyle }} />
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Edge Height:</label>
                                <input type="number" name="edgeHeight" value={edgeHeight} onChange={handleInputChange} min={2} max={10}
                                    style={{ ...inputStyle }} />
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Edge Thickness:</label>
                                <input type="number" name="edgeThickness" value={edgeThickness} onChange={handleInputChange} min={1}
                                    style={{ ...inputStyle }} />
                            </div>
                            <div inert={hasSupportSlot} style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Gap:</label>
                                <input type="number" name="gap" value={gap} onChange={handleInputChange}
                                    style={{ ...inputStyle }} />
                            </div>
                        </TabPanel>
                        <TabPanel>
                            <h3 style={{ color: '#636e72', marginTop: 0 }}>Add support slot</h3>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Support Slot:</label>
                                <input type="checkbox" name="supportSlot" checked={hasSupportSlot} value={hasSupportSlot} onChange={handleInputChange}
                                    style={{ marginLeft: 8 }} />
                            </div>
                            <div inert={!hasSupportSlot}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Support Mode:</label>
                                    <select name='supportMode' value={supportMode} onChange={handleInputChange}
                                        style={{ ...inputStyle }}>
                                        <option value={'wrap'}>Wrap</option>
                                        <option value={'ranked'}>Ranked</option>
                                    </select>
                                    <span style={{ color: '#b2bec3', fontSize: 12, marginLeft: 8 }}>Not Yet Implemented</span>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Support Slots Count:</label>
                                    <input type="number" name="supportCount" value={supportCount} onChange={handleInputChange} max={maxSlots}
                                        style={{ ...inputStyle }} />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Oval Length:</label>
                                    <input type="number" name="ovalLength" value={ovalLength} onChange={handleInputChange}
                                        style={{ ...inputStyle }} />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Oval Width:</label>
                                    <input type="number" name="ovalWidth" value={ovalWidth} onChange={handleInputChange}
                                        style={{ ...inputStyle }} />
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel>
                            <h3 style={{ color: '#636e72', marginTop: 0 }}>Add Magnet slots</h3>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Magnet Slots:</label>
                                <input type="checkbox" name="magnetSlot" checked={hasMagnetSlot} value={hasMagnetSlot} onChange={handleInputChange}
                                    style={{ marginLeft: 8 }} />
                            </div>
                            <div inert={!hasMagnetSlot}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Magnet Width:</label>
                                    <input type="number" name="magnetWidth" value={magnetWidth} onChange={handleInputChange} min={1} max={circularDiameter - 2}
                                        style={{ ...inputStyle }} />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Magnet Depth:</label>
                                    <input type="number" name="magnetDepth" value={magnetDepth} onChange={handleInputChange} min={1} max={baseThickness - 1}
                                        style={{ ...inputStyle }} />
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel>
                            <h3 style={{ color: '#636e72', marginTop: 0 }}>Formation</h3>
                            <div inert={hasSupportSlot}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Stagger Formation:</label>
                                    <input type='checkbox' name="staggerFormation" value={staggerFormation} onChange={handleInputChange}
                                        style={{ marginLeft: 8 }} />
                                </div>
                                <div inert={!staggerFormation} style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Remove Stray Slots:</label>
                                    <input type="checkbox" name="straySlot" checked={hasStraySlot} value={hasStraySlot} onChange={handleInputChange}
                                        style={{ marginLeft: 8 }} />
                                </div>
                            </div>
                        </TabPanel>
                    </Tabs>

                    {/* Download STL button fixed at the bottom */}
                    <div style={{
                        position: 'absolute',
                        bottom: 24,
                        left: 24,
                        right: 24,
                        width: 'auto',
                        height: 48,
                        textAlign: 'center',
                        zIndex: 2,
                        background: 'linear-gradient(90deg, #00b894 0%, #00cec9 100%)',
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <button
                            onClick={handleDownloadSTL}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: 18,
                                cursor: 'pointer',
                                padding: '12px 32px',
                                borderRadius: 8,
                                transition: 'background 0.2s',
                                outline: 'none'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
                            onMouseOut={e => e.currentTarget.style.background = 'none'}
                        >
                            Download STL
                        </button>
                    </div>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%)',
                    display: 'flex',
                    flex: 1,
                    borderRadius: 16,
                    marginRight: 32,
                    minHeight: 600,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
                }}>
                    {generateVisualization()}
                </div>
            </div>
        </div>
    );
}

// Modern input style for reuse
const inputStyle = {
    border: '1px solid #dfe6e9',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 16,
    marginLeft: 8,
    marginTop: 4,
    marginBottom: 4,
    outline: 'none',
    background: '#f9f9fb',
    transition: 'border 0.2s'
};

export default MovementTrayGenerator;
