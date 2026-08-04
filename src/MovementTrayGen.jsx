import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue, startTransition } from 'react';
import GridGen from './GridGen';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Vector3 } from 'three';
import './index.css';
import { Download, Eye, Home, RotateCcw } from 'react-feather';

function MovementTrayGenerator() {
    const cameraRef = useRef();
    const controlsRef = useRef();

    const [darkMode] = useState(false);

    const [slotShape, setSlotShape] = useState('circle');
    const [circularDiameter, setCircularDiameter] = useState(25);
    const [rectWidth, setRectWidth] = useState(25);
    const [rectHeight, setRectHeight] = useState(25);
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

    const [hasHollowBottom, setHasHollowBottom] = useState(false);
    const [hasTriangleFormation, setHasTriangleFormation] = useState(false);
    const [hasPerimeterDebug, setHasPerimeterDebug] = useState(false);

    const [supportMode, setSupportMode] = useState('circle');
    const [supportCount, setSupportCount] = useState(6);

    const [formationCols, setFormationCols] = useState(3);
    const [formationRows, setFormationRows] = useState(4);
    const deferredFormationCols = useDeferredValue(formationCols);
    const deferredFormationRows = useDeferredValue(formationRows);

    const [bounds, setBounds] = useState(null);

    const [hasStraySlot, setHasStraySlot] = useState(false);

    const [maxSlots, setMaxSlots] = useState(100);

    const [exportMesh, setExportMesh] = useState(null);

    const [, setMaxReached] = useState(false);

    const handleBaseMeshReady = useCallback((mesh) => {
        setExportMesh(mesh);
    }, []);

    const currentBaseWidth = slotShape === 'rectangle' ? rectWidth : circularDiameter;
    const currentBaseHeight = slotShape === 'rectangle' ? rectHeight : circularDiameter;
    const maxMagnetWidth = Math.max(1, Math.min(currentBaseWidth, currentBaseHeight) - 2);

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

    /* Reset all parameters to default */
    const presetResetDefault = () => {
        setCircularDiameter(25);
        setRectWidth(25);
        setRectHeight(25);
        setEdgeHeight(5);
        setHasMagnetSlot(true);
        setHasSupportSlot(false);
        setGap(0);
        setSupportCount(6);
        setSupportMode('circle');
        setSlotShape('circle');
        setOvalWidth(35);
        setOvalLength(60);
        resetMaxSlots();
    }

    const resetMaxSlots = () => {
        setMaxReached(false);
        setMaxSlots(100);
    }

    /* Set tray to preset for paint holder trays */
    const handlePresetSelect = (diameter) => {
        presetResetDefault();
        setCircularDiameter(diameter);
        setEdgeHeight(10);
        setHasMagnetSlot(false);
        resetMaxSlots();
    };

    /* Set tray to preset for movement trays */
    const handleMovementPreset = (diameter) => {
        presetResetDefault();
        setCircularDiameter(diameter);
        setEdgeHeight(5);
    }

    /* Set tray to preset for movement trays with support slots */
    const handleSpecialPreset = (diameter, supportMode, slotCount, ovalWidth, ovalLength) => {
        presetResetDefault();
        setCircularDiameter(diameter);
        setEdgeHeight(8);
        setHasSupportSlot(true);
        setSupportMode(supportMode);
        setSupportCount(slotCount);

        if (supportMode) {
            if (supportMode === 'circle') {
                setOvalWidth(ovalWidth);
            }
            else {
                setOvalWidth(ovalWidth);
                setOvalLength(ovalLength);
            }
        }

        // resetMaxSlots();
    }

    useEffect(() => {
    }, [bounds]);

    useEffect(() => {
        if (supportMode === 'circle') {
            setOvalLength(ovalWidth);
        }
    }, [supportMode, ovalWidth]);



    const setCameraView = (view) => {
        if (!bounds || !cameraRef.current || !controlsRef.current) return;

        const center = new Vector3();
        bounds.getCenter(center);

        const size = new Vector3();
        bounds.getSize(size);

        const maxDim = Math.max(size.x, size.y);
        const distance = Math.max(maxDim * 1.4, 1);

        switch (view) {
            case 'top':
                cameraRef.current.position.set(center.x, center.y, center.z + distance);
                break;
            case 'bottom':
                cameraRef.current.position.set(center.x, center.y, center.z - distance);
                break;
            default:
                return;
        }

        cameraRef.current.up.set(0, 1, 0);
        controlsRef.current.target.copy(center);
        cameraRef.current.lookAt(center);
        controlsRef.current.update();
        cameraRef.current.updateProjectionMatrix();
    };

    useEffect(() => {
        recenterCamera();
    }, [bounds, recenterCamera]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        switch (name) {
            case 'circularDiameter':
                setCircularDiameter(parseFloat(value));
                resetMaxSlots();
                break;
            case 'rectWidth':
                setRectWidth(parseFloat(value));
                resetMaxSlots();
                break;
            case 'rectHeight':
                setRectHeight(parseFloat(value));
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
                if (staggerFormation) {
                    // If turning off stagger, also turn off stray slot
                    setHasStraySlot(false);
                }
                break;
            case 'triangleFormation':
                setHasTriangleFormation(!hasTriangleFormation);
                setFormationCols(formationRows);
                break;
            case 'supportSlot':
                if (slotShape === 'rectangle') break;
                setHasSupportSlot(!hasSupportSlot);
                break;
            case 'slotShape':
                setSlotShape(value);
                if (value === 'rectangle') {
                    setHasSupportSlot(false);
                }
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
                startTransition(() => {
                    setFormationCols(parseFloat(value));
                });
                break;
            case 'formationRows':
                startTransition(() => {
                    setFormationRows(parseFloat(value));
                });
                break;
            case 'straySlot':
                setHasStraySlot(!hasStraySlot);
                break;
            case 'hollowBottom':
                setHasHollowBottom(!hasHollowBottom);
                break;
            default:
                break;
        }
    };

    const generateVisualization = () => {
        return (<div style={{ width: '100%' }}>
            <Canvas className='tray-canvas' shadows>
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
                <GridGen setBounds={setBounds} baseThickness={baseThickness} baseWidth={slotShape === 'rectangle' ? rectWidth : circularDiameter} baseHeight={slotShape === 'rectangle' ? rectHeight : circularDiameter} slotShape={slotShape} edgeThickness={edgeThickness} edgeHeight={edgeHeight} stagger={staggerFormation} triangleFormation={hasTriangleFormation} rows={deferredFormationRows} cols={deferredFormationCols} gap={gap} supportSlot={supportSlot} magnetSlot={magnetSlot} straySlot={hasStraySlot} onMaxReached={handleMaxReached} onBaseMeshReady={handleBaseMeshReady} darkMode={darkMode} hollowBottom={hasHollowBottom} perimeterDebug={hasPerimeterDebug} />
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
        <div className='container' >
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
                        <Tab id="tab">
                            Presets
                        </Tab>
                    </TabList>
                    <TabPanel>
                        <h3 className='tabTitle'>Tray Options</h3>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontWeight: 500 }}>Base Shape:
                                <select name="slotShape" value={slotShape} onChange={handleInputChange} className="input">
                                    <option value={'circle'}>Circle</option>
                                    <option value={'rectangle'}>Rectangle</option>
                                </select>
                            </label>
                        </div>

                        {slotShape === 'circle' ? (
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Circular Diameter:
                                    <input type="number" name="circularDiameter" value={circularDiameter} onChange={handleInputChange} min={10} max={200}
                                        className="input" />
                                    <label style={{ fontWeight: 500 }}>mm</label>
                                </label>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Rectangle Width:
                                        <input type="number" name="rectWidth" value={rectWidth} onChange={handleInputChange} min={10} max={200}
                                            className="input" />
                                        <label style={{ fontWeight: 500 }}>mm</label>
                                    </label>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Rectangle Depth:
                                        <input type="number" name="rectHeight" value={rectHeight} onChange={handleInputChange} min={10} max={200}
                                            className="input" />
                                        <label style={{ fontWeight: 500 }}>mm</label>
                                    </label>
                                </div>
                            </>
                        )}

                        <div inert={hasSupportSlot} style={{ marginBottom: 12 }}>
                            <div inert={hasTriangleFormation} style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Columns:
                                    <input type="number" name="formationCols" value={formationCols} onChange={handleInputChange} min={1} max={10}
                                        className="input" />
                                </label>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Rows:
                                    <input type="number" name="formationRows" value={formationRows} onChange={handleInputChange} min={1} max={10}
                                        className="input" />
                                </label>
                            </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontWeight: 500 }}>Base Thickness:
                                <input type="number" name="baseThickness" value={baseThickness} onChange={handleInputChange} min={2} max={edgeHeight}
                                    className="input" />
                                <label style={{ fontWeight: 500 }}>mm</label>
                            </label>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontWeight: 500 }}>Edge Height:
                                <input type="number" name="edgeHeight" value={edgeHeight} onChange={handleInputChange} min={2} max={10}
                                    className="input" />
                                <label style={{ fontWeight: 500 }}>mm</label>
                            </label>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontWeight: 500 }}>Edge Thickness:
                                <input type="number" name="edgeThickness" value={edgeThickness} onChange={handleInputChange} min={1} max={10}
                                    className="input" />
                                <label style={{ fontWeight: 500 }}>mm</label>
                            </label>
                        </div>
                        <div inert={hasSupportSlot} style={{ marginBottom: 12 }}>
                            <label style={{ fontWeight: 500 }}>Gap:
                                <input type="number" name="gap" value={gap} onChange={handleInputChange} min={0} max={20}
                                    className="input" />
                                <label style={{ fontWeight: 500 }}>mm</label>
                            </label>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontWeight: 500 }}>Hollow Bottoms:
                                <input type="checkbox" name="hollowBottom" checked={hasHollowBottom} value={hasHollowBottom} onChange={handleInputChange}
                                    style={{ marginLeft: 8 }} />
                                <label style={{ color: 'red' }}>Enable just before export if required (may cause perfomance issues)</label>
                            </label>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontWeight: 500 }}>Perimeter Debug Overlay:
                                <input type="checkbox" name="perimeterDebug" checked={hasPerimeterDebug} value={hasPerimeterDebug} onChange={() => setHasPerimeterDebug(!hasPerimeterDebug)}
                                    style={{ marginLeft: 8 }} />
                                <label style={{ color: '#666' }}>Show hull, triangle centers, and connector points for debugging</label>
                            </label>
                        </div>
                    </TabPanel>
                    <TabPanel>
                        <h3 className='tabTitle'>Add Magnet Slots</h3>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontWeight: 500 }}>Magnet Slots:
                                <input type="checkbox" name="magnetSlot" checked={hasMagnetSlot} value={hasMagnetSlot} onChange={handleInputChange}
                                    style={{ marginLeft: 8 }} />
                            </label>
                        </div>
                        <div inert={!hasMagnetSlot}>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Magnet Diameter:
                                    <input type="number" name="magnetWidth" value={magnetWidth} onChange={handleInputChange} min={1} max={maxMagnetWidth}
                                        className="input" />
                                    <label style={{ fontWeight: 500 }}>mm</label>
                                </label>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Magnet Depth:
                                    <input type="number" name="magnetDepth" value={magnetDepth} onChange={handleInputChange} min={1} max={baseThickness - 1}
                                        className="input" />
                                    <label style={{ fontWeight: 500 }}>mm</label>
                                </label>
                            </div>
                        </div>
                    </TabPanel>
                    <TabPanel>
                        <h3>Formation</h3>
                        <div inert={hasSupportSlot}>
                            <h4>Stagger</h4>
                            <div>
                                <label style={{ fontWeight: 500 }}>Stagger Formation:
                                    <input type='checkbox' name="staggerFormation" checked={staggerFormation} value={staggerFormation} onChange={handleInputChange} />
                                </label>
                            </div>
                            <div inert={!staggerFormation}>
                                <label style={{ fontWeight: 500 }}>Remove Stray Slots:
                                    <input type="checkbox" name="straySlot" checked={hasStraySlot} value={hasStraySlot} onChange={handleInputChange} />
                                </label>
                            </div>
                            <h4>Triangle</h4>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Triangle Formation:
                                    <input type="checkbox" name="triangleFormation" checked={hasTriangleFormation} value={hasTriangleFormation} onChange={handleInputChange}
                                        style={{ marginLeft: 8 }} />
                                </label>
                            </div>
                        </div>
                    </TabPanel>
                    <TabPanel>
                        <h3 className='tabTitle'>Add support slot</h3>
                        {slotShape === 'rectangle' && (
                            <p style={{ color: '#666' }}>Support slots are currently only available for circular base mode.</p>
                        )}
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontWeight: 500 }}>Support Slot:
                                <input type="checkbox" name="supportSlot" checked={hasSupportSlot} value={hasSupportSlot} onChange={handleInputChange} className="input" />
                            </label>
                        </div>
                        <div inert={!hasSupportSlot || slotShape === 'rectangle'} >
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Support Mode:
                                    <select name='supportMode' value={supportMode} onChange={handleInputChange} className="input">
                                        <option value={'circle'}>Circle</option>
                                        <option value={'oval'}>Oval</option>
                                    </select>
                                </label>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Support Slots Count:
                                    <input type="number" name="supportCount" value={supportCount} onChange={handleInputChange} min={0} max={maxSlots} className="input" />
                                </label>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Oval Width:
                                    <input type="number" name="ovalWidth" value={ovalWidth} onChange={handleInputChange} min={10} max={200} className="input" />
                                    <label style={{ fontWeight: 500 }}>mm</label>
                                </label>
                            </div>
                            <div inert={supportMode === 'circle'}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontWeight: 500 }}>Oval Length: <input type="number" name="ovalLength" value={ovalLength} onChange={handleInputChange} min={10} max={200} className="input" />
                                        <label style={{ fontWeight: 500 }}>mm</label>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </TabPanel>
                    <TabPanel>
                        <h3>Presets</h3>
                        <div>
                            <div className='reset-controls' >
                                <button className='button' style={{ width: 'min-content' }} type='button' onClick={() => presetResetDefault()}><RotateCcw style={{ width: '100%' }} /> Reset Defaults</button>
                            </div>
                            <h4>Movement Tray Presets</h4>
                            <h5>Circle</h5>
                            <button className='button' onClick={() => handleMovementPreset(25.5)}>25mm</button>
                            <button className='button' onClick={() => handleMovementPreset(28.5)}>28mm</button>
                            <button className='button' onClick={() => handleMovementPreset(32.5)}>32mm</button>
                            <button className='button' onClick={() => handleMovementPreset(40.5)}>40mm</button>
                            <button className='button' onClick={() => handleMovementPreset(50.5)}>50mm</button>
                            <button className='button' onClick={() => handleMovementPreset(60.5)}>60mm</button>
                            <h5>Special</h5>
                            <h6>Games Workshop Compatible</h6>
                            <button className='button' onClick={() => handleSpecialPreset(25.5, 'oval', 9, 60.5, 36)}>Skitarii</button>
                            <button className='button' onClick={() => handleSpecialPreset(28.5, 'circle', 9, 32.5)}>Novitiate/Repentia Squad</button>
                            <button className='button' onClick={() => handleSpecialPreset(29, 'circle', 9, 40.5)}>Guardian Squad</button>
                            <h4>Paint Storage Presets</h4>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontWeight: 500 }}>Paint Brand:
                                    <select name='paintSize' onChange={(e) => {
                                        const paintBrands = {
                                            'vallejo': 25,
                                            'citadel': 33,
                                            'ak-interactive': 10,
                                            'army-painter': 25,
                                            'scale75': 10
                                        };
                                        handlePresetSelect(paintBrands[e.target.value]);
                                    }} className="input">
                                        <option value={'vallejo'}>Vallejo Dropper</option>
                                        <option value={'citadel'}>Citadel Pot</option>
                                        <option value={'army-painter'}>Army Painter Dropper</option>
                                        <option value={'ak-interactive'}>AK Interactive Dropper</option>
                                        <option value={'scale75'}>Scale 75 Dropper</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    </TabPanel>
                </Tabs>

                {/* Download STL button fixed at the bottom */}
                <button
                    type='button'
                    onClick={handleDownloadSTL}
                    className='download-btn'
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                >

                    <div className='icon-text' style={{ justifyContent: 'center' }}>
                        <Download />
                        Download STL
                    </div>
                </button>

                <div className="warning-box">
                    <h3>Warning</h3>
                    <p>This application is in early development and it is highly recommended that you use the automatic repair option in your 3D printer slicer or 3D model viewer first before printing as there may be some artifacts which will result in less than optimal printing results </p>
                </div>
            </div>



            <div className='trayFrame'>
                <div className='camera-controls'>
                    <Eye style={{ width: '100%' }} />
                    <button title='Default' className='button' type='button' onClick={() => recenterCamera()}><Home /></button>
                    <button className='button' type='button' onClick={() => setCameraView('top')}>Top</button>
                    <button className='button' type='button' onClick={() => setCameraView('bottom')}>Bottom</button>
                </div>

                {generateVisualization()}
            </div>
        </div>
    );
}

export default MovementTrayGenerator;
