import React, { useState, useEffect, useRef } from 'react';
import { MeshBasicMaterial, DoubleSide, Vector2 } from 'three';
import * as THREE from 'three';
import Circle from './Circle';
import Oval from './Oval';
import concaveman from 'concaveman';

// import { CSG } from 'three-csg-ts';

function GridGen({ setBounds, baseWidth, edgeThickness, stagger, rows, cols, gap, supportSlot, magnetSlot, straySlot }) {
    const [circlesData, setCirclesData] = useState([]);
    const insetDiameter = baseWidth;
    const insetRadius = insetDiameter / 2;
    const borderWidth = edgeThickness;

    const circleOuterRadius = insetRadius + borderWidth;
    const xOffset = circleOuterRadius + insetRadius + gap;
    const yOffset = circleOuterRadius + insetRadius + gap;
    const [baseFillGeometry, setBaseFillGeometry] = useState(null);


    // Check if the purple areas (inner circles) of two circles overlap
    function areInsetAreasOverlapping(pos1, pos2, purpleRadius1, purpleRadius2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const distanceSq = dx * dx + dy * dy;
        const minAllowed = purpleRadius1 + purpleRadius2;  // Sum of purple radii
        return distanceSq < minAllowed * minAllowed;
    }

    // Check if the purple area (inner circle) intersects with the oval
    function doesInsetAreaIntersectOval(circlePos, ovalPos, purpleRadius, ovalLength, ovalWidth) {
        const dx = circlePos.x - ovalPos.x;
        const dy = circlePos.y - ovalPos.y;
        const rx = ovalLength / 2 + purpleRadius; // Use the purple radius for this check
        const ry = ovalWidth / 2 + purpleRadius; // Use the purple radius for this check
        return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) < 1;
    }

    useEffect(() => {
        const circles = [];
        const points = [];

        const circleOuterRadius = insetRadius + borderWidth;
        const xOffset = circleOuterRadius + insetRadius + gap;
        const yOffset = circleOuterRadius + insetRadius + gap;

        let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;

        const addCircle = (x, y, row = 0, col = 0) => {
            const position = { x, y };

            // Check intersection with oval
            if (supportSlot.enabled) {
                const intersectsOval = doesInsetAreaIntersectOval(position, { x: 0, y: 0 }, insetRadius, supportSlot.length, supportSlot.width);
                if (intersectsOval) {
                    // Move the circle further away until no intersection
                    const angle = Math.atan2(y, x); // Get the angle of the current position relative to the center
                    x += Math.cos(angle) * gap; // Move the circle along the radial direction
                    y += Math.sin(angle) * gap;
                    return addCircle(x, y, row, col); // Try again with the new position
                }
            }

            // Check intersection with existing circles
            for (const existing of circles) {
                if (areInsetAreasOverlapping(position, existing.position, insetRadius, insetRadius)) {
                    // Move the circle further away from the other circle (since green areas can intersect)
                    const angle = Math.atan2(y - existing.position.y, x - existing.position.x); // Get angle to existing circle
                    x += Math.cos(angle) * gap; // Move the circle along the radial direction
                    y += Math.sin(angle) * gap;
                    return addCircle(x, y, row, col); // Try again with the new position
                }
            }

            circles.push({ position, insetRadius, borderWidth, row, col });
            points.push(new Vector2(x, y));

            minx = Math.min(minx, x - circleOuterRadius);
            miny = Math.min(miny, y - circleOuterRadius);
            maxx = Math.max(maxx, x + circleOuterRadius);
            maxy = Math.max(maxy, y + circleOuterRadius);
        };

        if (supportSlot.enabled) {
            // Circular layout around oval
            const numCircles = supportSlot.count;
            const centerX = 0;
            const centerY = 0;

            const a = (supportSlot.length / 2) + insetRadius + gap + 2;
            const b = (supportSlot.width / 2) + insetRadius + gap + 2;

            for (let i = 0; i < numCircles; i++) {
                const angle = (i / numCircles) * 2 * Math.PI;
                const x = centerX + a * Math.cos(angle);
                const y = centerY + b * Math.sin(angle);
                addCircle(x, y, 0, i);
            }

            points.push(new Vector2(centerX, centerY));
        } else {
            // Standard grid layout
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

        // Set bounds
        const bounds = new THREE.Box3().setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, 0)));
        setBounds(bounds);

        // Build concave hull from edge circle perimeter samples
        const numSegments = 16;
        const edgeCircles = new Set();

        const groupedByRow = {};
        const groupedByCol = {};

        for (const c of circles) {
            if (!groupedByRow[c.row]) groupedByRow[c.row] = [];
            if (!groupedByCol[c.col]) groupedByCol[c.col] = [];
            groupedByRow[c.row].push(c);
            groupedByCol[c.col].push(c);
        }

        Object.values(groupedByRow).forEach(row => {
            const sorted = [...row].sort((a, b) => a.position.x - b.position.x);
            edgeCircles.add(sorted[0]);
            edgeCircles.add(sorted[sorted.length - 1]);
        });

        Object.values(groupedByCol).forEach(col => {
            const sorted = [...col].sort((a, b) => a.position.y - b.position.y);
            edgeCircles.add(sorted[0]);
            edgeCircles.add(sorted[sorted.length - 1]);
        });

        const perimeterPoints = [];
        for (const circle of edgeCircles) {
            for (let i = 0; i < numSegments; i++) {
                const angle = (i / numSegments) * 2 * Math.PI;
                const x = circle.position.x + Math.cos(angle) * circleOuterRadius;
                const y = circle.position.y + Math.sin(angle) * circleOuterRadius;
                perimeterPoints.push([x, y]);
            }
        }

        if (supportSlot.enabled) {
            const { x, y } = { x: 0, y: 0 };
            const a = supportSlot.width / 2;
            const b = supportSlot.length / 2;
            const segments = 128;

            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                perimeterPoints.push([x + b * Math.cos(angle), y + a * Math.sin(angle)]);
            }
        }

        const hullPoints = concaveman(perimeterPoints, 1);
        const shape = new THREE.Shape(hullPoints.map(([x, y]) => new Vector2(x, y)));

        // Holes: Circle insets
        for (const circle of circles) {
            const path = new THREE.Path();
            const segments = 128;
            const r = circle.insetRadius;
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * 2 * Math.PI;
                const x = circle.position.x + Math.cos(angle) * r;
                const y = circle.position.y + Math.sin(angle) * r;
                if (i === 0) path.moveTo(x, y);
                else path.lineTo(x, y);
            }
            shape.holes.push(path);
        }

        // Hole: Oval inset
        if (supportSlot.enabled) {


            const { x, y } = { x: 0, y: 0 };
            const a = supportSlot.width / 2;
            const b = supportSlot.length / 2;
            const path = new THREE.Path();
            const segments = 128;
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * 2 * Math.PI;
                const px = x + b * Math.cos(angle);
                const py = y + a * Math.sin(angle);
                if (i === 0) path.moveTo(px, py);
                else path.lineTo(px, py);
            }
            shape.holes.push(path);
        }

        // Extrude base
        const extrudeSettings = {
            depth: 2,
            bevelEnabled: true,
            bevelSegments: 1,
            steps: 1,
            bevelSize: 0.5,
            bevelThickness: 0.5,
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        setBaseFillGeometry(geometry);

    }, [baseWidth, stagger, rows, cols, gap, supportSlot.enabled, supportSlot.length, supportSlot.width, supportSlot.count, straySlot, borderWidth]);

    return (
        <>
            {baseFillGeometry && (
                <mesh geometry={baseFillGeometry} material={new MeshBasicMaterial({ color: 'brown', side: DoubleSide })} position={[0, 0, -0.01]} />
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