import React, { useState, useEffect } from 'react';
import GridGen from './GridGen';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

function MovementTrayGenerator() {
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
            <Canvas style={{ width: '100%', height: '100vh' }}>
                {/* <CameraControls bounds={bounds} /> */}
                <PerspectiveCamera makeDefault position={[0, -45, 45]} fov={90} />
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
                <OrbitControls />
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
        <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src='logo192.png' width={'50'} height={'50'} display={'block'} alt='logo png' ></img>
                <h2 style={{ paddingLeft: 10 }}> Movement Tray Forge</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                <div style={{ display: 'flex', flex: 'grow', flexDirection: 'column', backgroundColor: '#7b4b1e' }} >
                    <Tabs>
                        <TabList>
                            <Tab>Tray Options</Tab>
                            <Tab>Support Slots</Tab>
                            <Tab>Magnet Slots</Tab>
                            <Tab>Formations</Tab>
                        </TabList>
                        <TabPanel>
                            <h3>Base Size</h3>
                            <div>
                                <label>Circular Diameter:</label>
                                <input type="number" name="circularDiameter" value={circularDiameter} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label>Columns:</label>
                                <input type="number" name="formationCols" value={formationCols} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label>Rows:</label>
                                <input type="number" name="formationRows" value={formationRows} onChange={handleInputChange} />
                            </div>
                            <div>
                                <label>Base Thickness:</label>
                                <input type="number" name="baseThickness" value={baseThickness} onChange={handleInputChange} min={2} max={edgeHeight} />
                            </div>
                            <div>
                                <label>Edge Height:</label>
                                <input type="number" name="edgeHeight" value={edgeHeight} onChange={handleInputChange} min={2} max={10} />
                            </div>
                            <div>
                                <label>Edge Thickness:</label>
                                <input type="number" name="edgeThickness" value={edgeThickness} onChange={handleInputChange} min={1} />
                            </div>
                        </TabPanel>
                        <TabPanel>
                            <h3>Add support slot</h3>
                            <div>
                                <label>Support Slot:</label>
                                <input type="checkbox" name="supportSlot" checked={hasSupportSlot} value={hasSupportSlot} onChange={handleInputChange} />
                            </div>
                            <div inert={!hasSupportSlot}>
                                <div>
                                    <label>Support Mode:</label>
                                    <select name='supportMode' value={supportMode} onChange={handleInputChange}>
                                        <option value={'wrap'}>Wrap</option>
                                        <option value={'ranked'}>Ranked</option>
                                    </select>
                                    Not Yet Implemented
                                </div>
                                <div>
                                    <label>Support Slots Count:</label>
                                    <input type="number" name="supportCount" value={supportCount} onChange={handleInputChange} max={maxSlots} />
                                </div>
                                <div>
                                    <label>Oval Length:</label>
                                    <input type="number" name="ovalLength" value={ovalLength} onChange={handleInputChange} />
                                </div>
                                <div>
                                    <label>Oval Width:</label>
                                    <input type="number" name="ovalWidth" value={ovalWidth} onChange={handleInputChange} />
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel>
                            <h3>Add Magnet slots</h3>
                            <div>
                                <label>Magnet Slots:</label>
                                <input type="checkbox" name="magnetSlot" checked={hasMagnetSlot} value={hasMagnetSlot} onChange={handleInputChange} />
                            </div>
                            <div inert={!hasMagnetSlot}>
                                <div>
                                    <label>Magnet Width:</label>
                                    <input type="number" name="magnetWidth" value={magnetWidth} onChange={handleInputChange} min={1} max={circularDiameter - 2} />
                                </div>
                                <div>
                                    <label>Magnet Depth:</label>
                                    <input type="number" name="magnetDepth" value={magnetDepth} onChange={handleInputChange} min={1} max={baseThickness - 1} />
                                </div>
                            </div>
                            <div inert={hasSupportSlot}>
                                <div>
                                    <label>Gap:</label>
                                    <input type="number" name="gap" value={gap} onChange={handleInputChange} />
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel>
                            <h3>Formation</h3>
                            <div inert={hasSupportSlot}>
                                <div>
                                    <label>Stagger Formation:</label>
                                    <input type='checkbox' name="staggerFormation" value={staggerFormation} onChange={handleInputChange} />
                                </div>
                                <div inert={!staggerFormation}>
                                    <label>Remove Stray Slots:</label>
                                    <input type="checkbox" name="straySlot" checked={hasStraySlot} value={hasStraySlot} onChange={handleInputChange} />
                                </div>
                            </div>
                        </TabPanel>
                    </Tabs>
                    <div>
                        <button onClick={generateVisualization}>Visualize</button>
                        <button onClick={handleDownloadSTL}>Download STL</button>
                    </div>
                </div>
                <div style={{ background: 'gray', display: 'flex', flex: 1 }}>
                    {generateVisualization()}
                </div>
            </div >
        </div >
    );
}



export default MovementTrayGenerator;
