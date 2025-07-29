import React, { useState, useEffect } from 'react';
import { MeshStandardMaterial, DoubleSide, Vector2 } from 'three';
import * as THREE from 'three';
import Circle from './Circle';
import Oval from './Oval';
import { CSG } from 'three-csg-ts';
import { createCircleGroup } from './circleUtils';
import { createOvalMesh } from './ovalUtils';
import { buildBase } from './BaseBuilder';
import { placeEvenCirclesAlongOval, areInsetAreasOverlapping, doesInsetAreaIntersectOval, canAddCircle } from './CirclePlacementUtils';
import { generateCirclePlacements } from './CirclePlacement';

function GridGen({ setBounds, baseThickness, baseWidth, edgeHeight, edgeThickness, stagger, rows, cols, gap, supportSlot, magnetSlot, straySlot, onMaxReached, onBaseMeshReady, darkMode }) {
    const [circlesData, setCirclesData] = useState([]);
    const insetDiameter = baseWidth + 0.5; // Adding 1 to allow model base to fit inside the circle
    const insetRadius = insetDiameter / 2;
    const borderWidth = edgeThickness;
    const borderHeight = edgeHeight;

    const circleOuterRadius = insetRadius + borderWidth;
    const [baseFillGeometry, setBaseFillGeometry] = useState(null);

    const [debugHullLine, setDebugHullLine] = useState(null);

    supportSlot.width = supportSlot.width + 1; // Adding 1 to allow model base to fit inside the oval
    supportSlot.length = supportSlot.length + 1; // Adding 1 to allow model base to fit inside the oval

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

        circles.forEach(circle => {
            const nearby = circles
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
                nearby
            );

            group.position.set(circle.position.x, circle.position.y, 0); // Ensure it's placed

            group.updateMatrixWorld(true); // Ensure world matrices are correct

            // Push all meshes in the group to allExportMeshes
            group.children.forEach(child => {
                if (child.isMesh) {
                    allExportMeshes.push(child);
                }
            });
        });

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


    }, [supportSlot.mode, baseWidth, stagger, rows, cols, gap, supportSlot.enabled, supportSlot.length, supportSlot.width, supportSlot.count, straySlot, borderWidth, borderHeight, magnetSlot.enabled]);

    const planeColor = darkMode ? 0x2a3550 : '#7A7474';

    return (
        <>
            {debugHullLine && <primitive object={debugHullLine} />}
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