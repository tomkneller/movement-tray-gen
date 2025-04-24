import React, { useState, useEffect } from 'react';
import GridGen from './GridGen';
import { Canvas } from '@react-three/fiber';
import CameraControls from './CameraControls';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

function MovementTrayGenerator() {
    const [circularDiameter, setCircularDiameter] = useState(25);
    const [ovalLength, setOvalLength] = useState(60);
    const [ovalWidth, setOvalWidth] = useState(35.5);

    const [magnetWidth, setMagnetWidth] = useState(2);
    const [magnetDepth, setMagnetDepth] = useState(2);

    const [gap, setGap] = useState(0);
    const [baseThickness, setBaseThickness] = useState(2);
    const [edgeHeight, setEdgeHeight] = useState(3);
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


    useEffect(() => {
        console.log("Bounds updated:", bounds);
    }, [bounds]);


    const handleInputChange = (event) => {
        const { name, value } = event.target;
        switch (name) {
            case 'circularDiameter':
                setCircularDiameter(parseFloat(value));
                break;
            case 'ovalLength':
                setOvalLength(parseFloat(value));
                break;
            case 'ovalWidth':
                setOvalWidth(parseFloat(value));
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
            <Canvas style={{ width: '100vw', height: '100vh' }}>
                {/* <CameraControls bounds={bounds} /> */}
                <PerspectiveCamera makeDefault position={[0, -100, 100]} fov={50} />
                <ambientLight intensity={0.2} />
                <directionalLight position={[0, 0, 100]} intensity={0.5} />
                <OrbitControls />

                <pointLight position={[10, 10, 10]} />
                <GridGen setBounds={setBounds} baseWidth={circularDiameter} edgeThickness={edgeThickness} stagger={staggerFormation} rows={formationRows} cols={formationCols} gap={gap} supportSlot={{ enabled: hasSupportSlot, length: ovalLength, width: ovalWidth, mode: supportMode, count: supportCount }} magnetSlot={{ enabled: hasMagnetSlot, depth: magnetDepth, width: magnetWidth }} straySlot={hasStraySlot} />
            </Canvas>
        </div>);
    };

    /**
     * TODO: Implementation of backend for downloading stl
     */
    const handleDownloadSTL = () => {
        console.log('Requesting STL download with current parameters...');
        // fetch('/api/generate_stl', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     circularDiameter,
        //     ovalLength,
        //     ovalWidth,
        //     gap,
        //     baseThickness,
        //     edgeHeight,
        //     edgeThickness,
        //   }),
        // })
        // .then(response => response.blob())
        // .then(blob => {
        //   const url = window.URL.createObjectURL(blob);
        //   const a = document.createElement('a');
        //   a.href = url;
        //   a.download = 'movement_tray.stl';
        //   document.body.appendChild(a);
        //   a.click();
        //   window.URL.revokeObjectURL(url);
        // });
    };

    return (
        <div>
            <h2>Movement Tray Generator</h2>
            <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                <div style={{ flex: '0 0 500px', display: 'flex', flexDirection: 'column' }} >
                    <div>
                        <label>Circular Diameter:</label>
                        <input type="number" name="circularDiameter" value={circularDiameter} onChange={handleInputChange} />
                    </div>
                    <p>--------------------------</p>
                    <h3>Add support slot</h3>
                    <div>
                        <label>Support Slot:</label>
                        <input type="checkbox" name="supportSlot" checked={hasSupportSlot} value={hasSupportSlot} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Support Mode:</label>
                        {/* <input type="number" name="supportMode" value={supportMode} onChange={handleInputChange} /> */}
                        <select name='supportMode' value={supportMode} onChange={handleInputChange}>
                            <option value={'wrap'}>Wrap</option>
                            <option value={'ranked'}>Ranked</option>
                        </select>
                        Not Yet Implemented
                    </div>
                    <div>
                        <label>Support Slots Count:</label>
                        <input type="number" name="supportCount" value={supportCount} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Oval Length:</label>
                        <input type="number" name="ovalLength" value={ovalLength} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Oval Width:</label>
                        <input type="number" name="ovalWidth" value={ovalWidth} onChange={handleInputChange} />
                    </div>
                    <p>--------------------------</p>
                    <h3>Add Magnet slots</h3>
                    <div>
                        <label>Magnet Slots:</label>
                        <input type="checkbox" name="magnetSlot" checked={hasMagnetSlot} value={hasMagnetSlot} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Magnet Width:</label>
                        <input type="number" name="magnetWidth" value={magnetWidth} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Magnet Depth:</label>
                        <input type="number" name="magnetDepth" value={magnetDepth} onChange={handleInputChange} />
                        Not yet Implemented
                    </div>
                    <p>--------------------------</p>
                    <div>
                        <label>Gap:</label>
                        <input type="number" name="gap" value={gap} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Base Thickness:</label>
                        <input type="number" name="baseThickness" value={baseThickness} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Edge Height:</label>
                        <input type="number" name="edgeHeight" value={edgeHeight} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Edge Thickness:</label>
                        <input type="number" name="edgeThickness" value={edgeThickness} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Columns:</label>
                        <input type="number" name="formationCols" value={formationCols} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Rows:</label>
                        <input type="number" name="formationRows" value={formationRows} onChange={handleInputChange} />
                    </div>
                    <p>--------------------------</p>
                    <div>
                        <label>Stagger Formation:</label>
                        <input type='checkbox' name="staggerFormation" value={staggerFormation} onChange={handleInputChange} />
                    </div>
                    <div>
                        <label>Remove Stray Slots:</label>
                        <input type="checkbox" name="straySlot" checked={hasStraySlot} value={hasStraySlot} onChange={handleInputChange} />
                    </div>
                    <div>
                        <button onClick={generateVisualization}>Visualize</button>
                        <button onClick={handleDownloadSTL}>Download STL</button>
                    </div>
                </div>
                <div style={{ flex: '0 0 500px', background: 'gray' }}>
                    {generateVisualization()}
                </div>
            </div >
        </div>
    );
}

export default MovementTrayGenerator;