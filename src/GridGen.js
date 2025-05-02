import React, { useState, useEffect } from 'react';
import { MeshStandardMaterial, DoubleSide, Vector2 } from 'three';
import * as THREE from 'three';
import Circle from './Circle';
import Oval from './Oval';
import concaveman from 'concaveman';
import { CSG } from 'three-csg-ts';

function GridGen({ setBounds, baseWidth, edgeThickness, stagger, rows, cols, gap, supportSlot, magnetSlot, straySlot, onMaxReached }) {
    const [circlesData, setCirclesData] = useState([]);
    const insetDiameter = baseWidth;
    const insetRadius = insetDiameter / 2;
    const borderWidth = edgeThickness;

    const circleOuterRadius = insetRadius + borderWidth;
    const xOffset = circleOuterRadius + insetRadius + gap;
    const yOffset = circleOuterRadius + insetRadius + gap;
    const [baseFillGeometry, setBaseFillGeometry] = useState(null);

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

    useEffect(() => {
        const circles = [];
        const points = [];



        const xOffset = circleOuterRadius + insetRadius + gap;
        const yOffset = circleOuterRadius + insetRadius + gap;

        let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;

        const addCircle = (x, y, row = 0, col = 0) => {
            const position = { x, y };

            if (!canAddCircle(x, y, row, col, circles)) {

                return;
            }

            circles.push({ position, insetRadius, borderWidth, row, col });
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
            const minSpacing = (2 * insetRadius) * 0.99; // slight fudge for packing



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
                    angle += 0.01; // step slowly until we can place
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
        const baseMesh = new THREE.Mesh(baseGeom);

        // Prepare hole meshes
        const holeMeshes = circles.map(circle => {
            const holeGeom = new THREE.CylinderGeometry(insetRadius, insetRadius, depth * 2, 64);
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

        // Convert back to geometry
        const finalMesh = CSG.toMesh(csgResult, baseMesh.matrix, baseMesh.material);
        setBaseFillGeometry(finalMesh.geometry);

    }, [baseWidth, stagger, rows, cols, gap, supportSlot.enabled, supportSlot.length, supportSlot.width, supportSlot.count, straySlot, borderWidth]);

    return (
        <>
            {baseFillGeometry && (
                <mesh geometry={baseFillGeometry} material={new MeshStandardMaterial({ color: 'brown', side: DoubleSide })} position={[0, 0, -0.01]} />
            )}
            {circlesData.map((circle, index) => (
                <Circle
                    key={index}
                    {...circle}
                    insetDiameter={insetDiameter}
                    borderWidth={borderWidth}
                    magnetSlot={magnetSlot}
                    mainColor="lightgreen"
                    borderColor="green"

                />
            ))}
            {supportSlot.enabled && (
                <Oval
                    position={{ x: 0, y: 0 }}
                    length={supportSlot.length}
                    width={supportSlot.width}
                    outerThickness={1}
                    mainColor="lightgreen"
                    outerColor="green"
                />
            )}
        </>
    );
}

export default GridGen;