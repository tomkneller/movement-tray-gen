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
        const circles = [];
        const points = [];

        const xOffset = circleOuterRadius + insetRadius + gap;
        const yOffset = stagger
            ? Math.sqrt((2 * circleOuterRadius) ** 2 - (xOffset / 2) ** 2) * 0.98
            : circleOuterRadius + insetRadius + gap;

        let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;

        const addCircle = (x, y, row = 0, col = 0) => {
            const position = { x, y };

            if (!canAddCircle(x, y, row, col, circles, insetRadius, borderWidth, supportSlot)) {
                console.log("cant add any more slots, max reached");

                return;
            }

            circles.push({ position, insetRadius, borderWidth, borderHeight, row, col });
            points.push(new Vector2(x, y));

            minx = Math.min(minx, x - circleOuterRadius);
            miny = Math.min(miny, y - circleOuterRadius);
            maxx = Math.max(maxx, x + circleOuterRadius);
            maxy = Math.max(maxy, y + circleOuterRadius);
        };

        if (supportSlot.enabled) {
            const numCircles = supportSlot.count;
            const centerX = 0;
            const centerY = 0;

            //Support slot is a circle
            if (supportSlot.mode === 'circle') {

                const a = ((supportSlot.length / 2) + insetRadius) + borderWidth + 1;
                const b = ((supportSlot.width / 2) + insetRadius) + borderWidth + 1;

                let added = 0;
                let angle = 0;
                const maxAngle = Math.PI * 2;
                const minSpacing = (2 * insetRadius) * 0.99;

                while (added < numCircles && angle < maxAngle + 0.2) {
                    const x = centerX + a * Math.cos(angle);
                    const y = centerY + b * Math.sin(angle);
                    const position = { x, y };

                    let overlaps = false;
                    for (const existing of circles) {
                        if (areInsetAreasOverlapping(position, existing.position, insetRadius, insetRadius + borderWidth)) {
                            overlaps = true;

                            break;
                        }
                    }

                    const insetIntersects = doesInsetAreaIntersectOval(position, { x: centerX, y: centerY }, insetRadius, supportSlot.length, supportSlot.width);
                    const outerIntersects = doesInsetAreaIntersectOval(position, { x: centerX, y: centerY }, insetRadius + borderWidth, supportSlot.length, supportSlot.width);

                    if (!overlaps && !insetIntersects && !outerIntersects) {
                        addCircle(x, y, 0, added);
                        added++;

                        const dx = -a * Math.sin(angle);
                        const dy = b * Math.cos(angle);
                        const speed = Math.sqrt(dx * dx + dy * dy);
                        const dTheta = minSpacing / speed;
                        angle += dTheta;
                    } else {
                        angle += 0.01;
                    }
                }

                if (added < numCircles) {
                    onMaxReached(added);
                }

                points.push(new Vector2(centerX, centerY));
            } else {
                //Support slot is an oval
                console.log("Support slot is not a circle, generate slots around oval");

                placeEvenCirclesAlongOval(
                    { x: 0, y: 0 }, // center of oval
                    supportSlot.length,             // a: horizontal radius (width / 2)
                    supportSlot.width,             // b: vertical radius (height / 2)
                    numCircles,             // number of slots
                    2,              // padding from oval edge
                    (x, y, i) => {
                        addCircle(x, y, i);
                    }
                );

            }
        }
        else {
            for (let row = 0; row < rows; row++) {
                const isStaggeredRow = stagger && row % 2 === 1;
                let effectiveCols = cols;

                if (straySlot) {
                    effectiveCols = isStaggeredRow ? cols - 1 : cols;
                }

                for (let col = 0; col < effectiveCols; col++) {
                    let x = col * xOffset;
                    if (isStaggeredRow) {
                        x += xOffset / 2;
                    }
                    const y = row * yOffset;
                    addCircle(x, y, row, col);
                }
            }
        }

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