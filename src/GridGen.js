import React, { useState, useEffect } from 'react';
import { MeshStandardMaterial, DoubleSide, Vector2 } from 'three';
import * as THREE from 'three';
import Circle from './Circle';
import Oval from './Oval';
import { CSG } from 'three-csg-ts';
import { createCircleGroup } from './circleUtils';
import { createOvalMesh } from './ovalUtils';

function GridGen({ setBounds, baseThickness, baseWidth, edgeHeight, edgeThickness, stagger, rows, cols, gap, supportSlot, magnetSlot, straySlot, onMaxReached, onBaseMeshReady }) {
    const [circlesData, setCirclesData] = useState([]);
    const insetDiameter = baseWidth;
    const insetRadius = insetDiameter / 2;
    const borderWidth = edgeThickness;
    const borderHeight = edgeHeight;

    const circleOuterRadius = insetRadius + borderWidth;
    const [baseFillGeometry, setBaseFillGeometry] = useState(null);

    const [debugHullLine, setDebugHullLine] = useState(null);

    function areInsetAreasOverlapping(pos1, pos2, purpleRadius1, purpleRadius2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const distanceSq = dx * dx + dy * dy;
        const minAllowed = purpleRadius1 + purpleRadius2;
        return distanceSq < minAllowed * minAllowed;
    }

    function doesInsetAreaIntersectOval(circlePos, ovalPos, purpleRadius, ovalLength, ovalWidth) {
        const dx = circlePos.x - ovalPos.x;
        const dy = circlePos.y - ovalPos.y;
        const rx = ovalLength / 2 + purpleRadius;
        const ry = ovalWidth / 2 + purpleRadius;
        return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) < 1;
    }

    function canAddCircle(x, y, row, col, circles) {
        const position = { x, y };

        // 1. Check purple-to-purple (inset) overlap with other circles
        for (const existing of circles) {
            if (areInsetAreasOverlapping(position, existing.position, insetRadius, insetRadius)) {
                return false;
            }
        }

        if (supportSlot.enabled) {
            const insetIntersectsOval = doesInsetAreaIntersectOval(position, { x: 0, y: 0 }, insetRadius + borderWidth, supportSlot.length, supportSlot.width);
            if (insetIntersectsOval) return false;

            const outerIntersectsOval = doesInsetAreaIntersectOval(position, { x: 0, y: 0 }, insetRadius + borderWidth, supportSlot.length, supportSlot.width);
            if (outerIntersectsOval) return false;
        }

        return true;
    }

    function buildPerimeter(circles, rows, cols, straySlot, supportMode) {
        const getIndex = (r, c) => circles.find(circ => circ.row === r && circ.col === c);

        const perimeter = [];
        if (supportMode) {
            //Oval position (may need changing if support slot can be moved in future)
            perimeter.push(new Vector2(0, 0));

            for (const circle of circles) {
                perimeter.push(new Vector2(circle.position.x, circle.position.y))
            }
        }
        else {
            // Top row
            for (let c = 0; c < cols; c++) {
                const circ = getIndex(0, c);
                if (circ) perimeter.push(circ.position);
            }

            // Right edge
            for (let r = 1; r < rows; r++) {
                const isStagger = straySlot && r % 2 === 1;
                const circ = getIndex(r, cols - (isStagger ? 2 : 1));
                if (circ) perimeter.push(circ.position);
            }

            // Bottom row
            for (let c = cols - 2; c >= 0; c--) {
                const circ = getIndex(rows - 1, c);
                if (circ) perimeter.push(circ.position);
            }

            // Left edge
            for (let r = rows - 2; r > 0; r--) {
                const circ = getIndex(r, 0);
                if (circ) perimeter.push(circ.position);
            }
        }

        return perimeter;
    }


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

            if (!canAddCircle(x, y, row, col, circles)) {

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

            const a = (supportSlot.length / 2) + insetRadius + 2;
            const b = (supportSlot.width / 2) + insetRadius + 2;

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

        setCirclesData(circles);

        const bounds = new THREE.Box3().setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, 0)));
        setBounds(bounds);

        // Base height and rectangle size
        const depth = 2;

        // Compute rectangular base dimensions
        const minX = bounds.min.x;
        const maxX = bounds.max.x;
        const minY = bounds.min.y;
        const maxY = bounds.max.y;
        const width = maxX - minX;
        const height = maxY - minY;


        // Create base box geometry
        const baseGeom = new THREE.BoxGeometry(width, height, depth);
        baseGeom.translate((minX + maxX) / 2, (minY + maxY) / 2, 1);
        let baseMesh = new THREE.Mesh(baseGeom);



        const outerPath = buildPerimeter(circles, rows, cols, straySlot, supportSlot.enabled);
        if (outerPath.length > 2) {
            const shape = new THREE.Shape();
            shape.moveTo(outerPath[0].x, outerPath[0].y);
            for (let i = 1; i < outerPath.length; i++) {
                shape.lineTo(outerPath[i].x, outerPath[i].y);
            }
            shape.lineTo(outerPath[0].x, outerPath[0].y); // close the loop

            const extrudeSettings = {
                depth: 2,
                bevelEnabled: true,
            };
            const baseShapeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            baseShapeGeometry.translate(0, 0, 0);

            baseMesh = new THREE.Mesh(baseShapeGeometry);
        }


        // Prepare hole meshes
        let holeMeshes = circles.map(circle => {
            const holeGeom = new THREE.CylinderGeometry(insetRadius + borderWidth, insetRadius + borderWidth, depth * 2, 64);
            holeGeom.rotateX(Math.PI / 2);
            holeGeom.translate(circle.position.x, circle.position.y, 1);
            return new THREE.Mesh(holeGeom);
        });

        // Subtract holes from base
        let csgResult = CSG.fromMesh(baseMesh);

        holeMeshes.forEach(hole => {
            const holeCSG = CSG.fromMesh(hole);
            csgResult = csgResult.subtract(holeCSG);
        });


        //Subtract Support Slot hole
        if (supportSlot.enabled) {
            const supportSlotShape = new THREE.Shape();
            supportSlotShape.absellipse(0, 0, (supportSlot.length / 2) + borderWidth, (supportSlot.width / 2) + borderWidth, 0, Math.PI * 2, false, 0);
            const extrudeSettings = {
                depth: 2,
                bevelEnabled: true,
            };
            const supportSlotGeometry = new THREE.ExtrudeGeometry(supportSlotShape, extrudeSettings);
            supportSlotGeometry.translate(0, 0, 0); // base lies flat on Z=0

            const supportSlotMesh = new THREE.Mesh(supportSlotGeometry);
            const supportSlotHoleCSG = CSG.fromMesh(supportSlotMesh);
            csgResult = csgResult.subtract(supportSlotHoleCSG)
        }

        let allExportMeshes = [];

        circles.forEach(circle => {
            const group = createCircleGroup(
                insetDiameter / 2,
                baseThickness,
                borderWidth,
                borderHeight,
                magnetSlot,
                circle.mainColor || 'lightgreen',
                circle.borderColor || 'green'
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

        if (supportSlot.enabled) {
            const ovalGroup = createOvalMesh({ x: 0, y: 0 }, supportSlot.length, supportSlot.width, baseThickness, borderWidth, borderHeight, magnetSlot);
            allExportMeshes.push(ovalGroup);
        }



        const finalBaseMesh = CSG.toMesh(csgResult, baseMesh.matrix, baseMesh.material);

        setBaseFillGeometry(finalBaseMesh.geometry);

        allExportMeshes.push(finalBaseMesh);


        const group = new THREE.Group();
        allExportMeshes.forEach(mesh => group.add(mesh));

        if (onBaseMeshReady) {
            onBaseMeshReady(group);
        }


    }, [baseWidth, stagger, rows, cols, gap, supportSlot.enabled, supportSlot.length, supportSlot.width, supportSlot.count, straySlot, borderWidth, borderHeight]);

    return (
        <>
            {debugHullLine && <primitive object={debugHullLine} />}
            {baseFillGeometry && (
                <mesh geometry={baseFillGeometry} material={new MeshStandardMaterial({ color: 'brown', side: DoubleSide })} position={[0, 0, 1]} />
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

            <mesh geometry={new THREE.PlaneGeometry(1000, 1000)} material={new MeshStandardMaterial({ color: 0x999999, roughness: 1 })} receiveShadow />
        </>
    );
}

export default GridGen;