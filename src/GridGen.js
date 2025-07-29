import { useState, useEffect } from 'react';
import { MeshStandardMaterial, DoubleSide } from 'three';
import * as THREE from 'three';
import Circle from './Circle';
import Oval from './Oval';
import Square from './Square';
import { createCircleGroup } from './circleUtils';
import { createSquareGroup } from './squareUtils';
import { createOvalMesh } from './ovalUtils';
import { buildBase } from './BaseBuilder';
import { areInsetAreasOverlapping } from './CirclePlacementUtils';
import { generateCirclePlacements } from './CirclePlacement';

function GridGen({ setBounds, slotType, baseThickness, baseWidth, edgeHeight, edgeThickness, stagger, rows, cols, gap, supportSlot, magnetSlot, straySlot, onBaseMeshReady, darkMode }) {
    const [circlesData, setCirclesData] = useState([]);
    const insetDiameter = baseWidth + 0.5; // Adding 0.5 to allow model base to fit inside the circle
    const insetRadius = insetDiameter / 2;
    const borderWidth = edgeThickness;
    const borderHeight = edgeHeight;

    const [baseFillGeometry, setBaseFillGeometry] = useState(null);

    function generateCircleGroups(circles, insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot) {
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
                overlappingNeighbors
            );

            group.position.set(circle.position.x, circle.position.y, 0);
            group.updateMatrixWorld(true);

            return group.children.filter(child => child.isMesh);
        });
    }



    function generateSquareGroups(circles, insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot) {
        if (!circles || circles.length === 0) return [];

        return circles.flatMap(circle => {
            const overlappingNeighbors = circles
                .filter(c => c !== circle && areInsetAreasOverlapping(circle.position, c.position, borderWidth, borderWidth))
                .map(c => c.position);

            const group = createSquareGroup(
                insetDiameter / 2,
                baseThickness,
                borderWidth,
                borderHeight,
                magnetSlot,
                circle.mainColor || 'lightgreen',
                circle.borderColor || 'green',
                circle.position,
                overlappingNeighbors
            );

            group.position.set(circle.position.x, circle.position.y, 0);
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


        let circleMeshes;

        if (slotType === 'circle') {
            circleMeshes = generateCircleGroups(
                circles,
                insetDiameter,
                baseThickness,
                borderWidth,
                borderHeight,
                magnetSlot
            );
        } else {
            circleMeshes = generateSquareGroups(
                circles,
                insetDiameter,
                baseThickness,
                borderWidth,
                borderHeight,
                magnetSlot
            );
        }


        allExportMeshes.push(...circleMeshes);

        setCirclesData(circles);


        if (slotType !== 'square') {
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
        }

        const group = new THREE.Group();
        allExportMeshes.forEach(mesh => group.add(mesh));

        if (onBaseMeshReady) {
            onBaseMeshReady(group);
        }

    }, [supportSlot, baseWidth, stagger, rows, cols, gap, straySlot, borderWidth, borderHeight, magnetSlot, insetRadius, setBounds, insetDiameter, baseThickness, onBaseMeshReady, slotType]);

    const planeColor = darkMode ? 0x2a3550 : '#7A7474';

    return (
        <>
            {slotType === "circle" && baseFillGeometry && (
                <mesh geometry={baseFillGeometry} material={new MeshStandardMaterial({ color: '#d6cfc7', side: DoubleSide })} position={[0, 0, 0]} />
            )}
            {slotType === "circle" && circlesData.map((circle, index) => (
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
                />
            ))}
            {slotType === "circle" && supportSlot.enabled && (
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
            {slotType === "square" && circlesData.map((circle, index) => (
                <Square
                    key={index}
                    {...circle}
                    insetDiameter={insetDiameter}
                    baseThickness={baseThickness}
                    borderWidth={borderWidth}
                    borderHeight={borderHeight}
                    magnetSlot={magnetSlot}
                    mainColor="lightgreen"
                    borderColor="green"
                />
            ))}
            <mesh geometry={new THREE.PlaneGeometry(1000, 1000)} material={new MeshStandardMaterial({
                color: planeColor, roughness: 1, metalness: 0.5,
                transparent: true,
                opacity: 0.95
            })} receiveShadow position={[0, 0, 0]} />
        </>
    );
}

export default GridGen;