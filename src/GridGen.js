import { useState, useEffect } from 'react';
import { MeshStandardMaterial, DoubleSide } from 'three';
import * as THREE from 'three';
import Circle from './Circle';
import Oval from './Oval';
import { createCircleGroup } from './utils/circleUtils';
import { createOvalMesh } from './utils/ovalUtils';
import { buildBase } from './BaseBuilder';
import { areInsetAreasOverlapping } from './utils/CirclePlacementUtils';
import { generateCirclePlacements } from './CirclePlacement';

function GridGen({ setBounds, baseThickness, baseWidth, edgeHeight, edgeThickness, stagger, rows, cols, gap, supportSlot, magnetSlot, straySlot, onBaseMeshReady, darkMode, hollowBottom }) {
    const [circlesData, setCirclesData] = useState([]);
    const insetDiameter = baseWidth + 0.5; // Adding 0.5 to allow model base to fit inside the circle
    const insetRadius = insetDiameter / 2;
    const borderWidth = edgeThickness;
    const borderHeight = edgeHeight;

    const [baseFillGeometry, setBaseFillGeometry] = useState(null);

    function generateCircleGroups(circles, insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot, hollowBottom) {
        if (!circles || circles.length === 0) return [];

        return circles.flatMap(circle => {
            const overlappingNeighbors = circles
                .filter(c => c !== circle && areInsetAreasOverlapping(circle.position, c.position, borderWidth, borderWidth))
                .map(c => c.position);

            const group = createCircleGroup(
                insetDiameter / 2,
                baseThickness,
                borderWidth,
                borderHeight,
                magnetSlot,
                circle.mainColor || 'lightgreen',
                circle.borderColor || 'green',
                circle.position,
                overlappingNeighbors,
                hollowBottom
            );

            group.updateMatrixWorld(true);

            return group.children.filter(child => child.isMesh);
        });
    }

    useEffect(() => {
        const { circles, points } = generateCirclePlacements({
            insetRadius,
            borderWidth,
            rows,
            cols,
            gap,
            stagger,
            straySlot,
            supportSlot
        });

        const bounds = new THREE.Box3().setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, 0)));
        setBounds(bounds);

        let allExportMeshes = [];

        if (supportSlot.enabled) {
            const ovalGroup = createOvalMesh({ x: 0, y: 0 }, supportSlot.length, supportSlot.width, baseThickness, borderWidth, borderHeight, magnetSlot);

            allExportMeshes.push(ovalGroup);
        }

        const circleMeshes = generateCircleGroups(
            circles,
            insetDiameter,
            baseThickness,
            borderWidth,
            borderHeight,
            magnetSlot,
            hollowBottom
        );
        allExportMeshes.push(...circleMeshes);

        setCirclesData(circles);

        const finalBaseMesh = buildBase({
            circles,
            supportSlot,
            baseThickness,
            borderWidth,
            rows,
            cols,
            straySlot,
        });

        setBaseFillGeometry(finalBaseMesh.geometry);

        allExportMeshes.push(finalBaseMesh);

        const group = new THREE.Group();
        allExportMeshes.forEach(mesh => group.add(mesh));

        if (onBaseMeshReady) {
            onBaseMeshReady(group);
        }

    }, [supportSlot, baseWidth, stagger, rows, cols, gap, straySlot, borderWidth, borderHeight, magnetSlot, insetRadius, setBounds, insetDiameter, baseThickness, onBaseMeshReady, hollowBottom]);

    const planeColor = darkMode ? 0x2a3550 : '#7A7474';

    return (
        <>
            {baseFillGeometry && (
                <mesh geometry={baseFillGeometry} material={new MeshStandardMaterial({ color: '#d6cfc7', side: DoubleSide })} position={[0, 0, 0]} />
            )}
            {circlesData.map((circle, index) => (
                <Circle
                    key={index}
                    {...circle}
                    insetDiameter={insetDiameter}
                    baseThickness={baseThickness}
                    borderWidth={borderWidth}
                    borderHeight={borderHeight}
                    magnetSlot={magnetSlot}
                    mainColor="lightgreen"
                    borderColor="green"
                    hollowBottom={hollowBottom}
                />
            ))}
            {supportSlot.enabled && (
                <Oval
                    length={supportSlot.length}
                    width={supportSlot.width}
                    baseThickness={baseThickness}
                    borderWidth={borderWidth}
                    borderHeight={borderHeight}
                    magnetSlot={magnetSlot}
                    mainColor="lightgreen"
                    outerColor="green"
                />
            )}

            <mesh geometry={new THREE.PlaneGeometry(1000, 1000)} material={new MeshStandardMaterial({
                color: planeColor, roughness: 1, metalness: 0.5,
                transparent: true,
                opacity: 0.95
            })} receiveShadow position={[0, 0, 0]} />
        </>
    );
}

export default GridGen;