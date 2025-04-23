import React, { useState, useEffect } from 'react';
import StaggeredGrid from './GridGen';
import { Canvas } from '@react-three/fiber';
import CameraControls from './CameraControls';

function MovementTrayGenerator() {
    const [circularDiameter, setCircularDiameter] = useState(25);
    const [ovalLength, setOvalLength] = useState(35.5);
    const [ovalWidth, setOvalWidth] = useState(60);
    const [gap, setGap] = useState(0);
    const [baseThickness, setBaseThickness] = useState(2);
    const [edgeHeight, setEdgeHeight] = useState(3);
    const [edgeThickness, setEdgeThickness] = useState(2);
    const [staggerFormation, setStaggerFomation] = useState(false);
    const [hasSupportSlot, setHasSupportSlot] = useState(false);

    const [formationCols, setFormationCols] = useState(3);
    const [formationRows, setFormationRows] = useState(4);

    const [bounds, setBounds] = useState(null);


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
            case 'formationCols':
                setFormationCols(parseFloat(value));
                break;
            case 'formationRows':
                setFormationRows(parseFloat(value));
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
                <CameraControls bounds={bounds} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <StaggeredGrid setBounds={setBounds} baseWidth={circularDiameter} stagger={staggerFormation} rows={formationRows} cols={formationCols} gap={gap} supportSlot={{ enabled: hasSupportSlot, length: ovalLength, width: ovalWidth }} />
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
            <div>
                <label>Circular Diameter:</label>
                <input type="number" name="circularDiameter" value={circularDiameter} onChange={handleInputChange} />
            </div>
            <p>--------------------------</p>
            <h3>Add support slot</h3>
            <div>
                <label>Support Slot:</label>
                <input type="checkbox" name="supportSlot" value={hasSupportSlot} onChange={handleInputChange} />
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
                <label>Stagger Formation:</label>
                <input type='checkbox' name="staggerFormation" value={staggerFormation} onChange={handleInputChange} />
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
                <button onClick={generateVisualization}>Visualize</button>
                <button onClick={handleDownloadSTL}>Download STL</button>
            </div>

            {generateVisualization()} {/* Placeholder for the 3D visualization */}
        </div>
    );
}

export default MovementTrayGenerator;