import React, { useState, useEffect, useRef } from 'react';
import { MeshBasicMaterial, DoubleSide, Vector2 } from 'three';
import * as THREE from 'three';
import Circle from './Circle';
import Oval from './Oval';
import concaveman from 'concaveman';

// import { CSG } from 'three-csg-ts';

function GridGen({ setBounds, baseWidth, edgeThickness, stagger, rows, cols, gap, supportSlot, magnetSlot }) {
    const [circlesData, setCirclesData] = useState([]);
    const [ovalData, setOvalData] = useState(null);
    const insetDiameter = baseWidth;
    const insetRadius = insetDiameter / 2;
    const borderWidth = edgeThickness;
    const ovalLength = 35.5;
    const ovalWidth = 60;

    const circleOuterRadius = insetRadius + borderWidth;
    const xOffset = circleOuterRadius + insetRadius + gap;
    const yOffset = circleOuterRadius + insetRadius + gap;
    const baseFillGeometry = useRef(null);

    useEffect(() => {
        const circles = [];
        let minx = Infinity;
        let miny = Infinity;
        let maxx = -Infinity;
        let maxy = -Infinity;
        const points = [];

        const circleOuterRadius = insetRadius + borderWidth;
        const xOffset = circleOuterRadius + insetRadius + gap;
        const yOffset = circleOuterRadius + insetRadius + gap;

        // Generate circle positions
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let xShift = col * xOffset;
                if (stagger && row % 2 === 1) {
                    xShift += xOffset / 2;
                }
                const yShift = row * yOffset;
                const position = { x: xShift, y: yShift };
                circles.push({ position, insetRadius, borderWidth, row, col });
                points.push(new Vector2(position.x, position.y));

                minx = Math.min(minx, position.x - circleOuterRadius);
                miny = Math.min(miny, position.y - circleOuterRadius);
                maxx = Math.max(maxx, position.x + circleOuterRadius);
                maxy = Math.max(maxy, position.y + circleOuterRadius);
            }
        }

        setCirclesData(circles);

        // Set oval data
        const ovalCenterX = (minx + maxx) / 2;
        const ovalCenterY = maxy + gap + ovalWidth / 2;
        setOvalData({ position: { x: ovalCenterX, y: ovalCenterY }, length: supportSlot.length, width: supportSlot.width });
        points.push(new Vector2(ovalCenterX, ovalCenterY));

        // Set bounds for camera framing
        const bounds = new THREE.Box3().setFromPoints(points.map(v => new THREE.Vector3(v.x, v.y, 0)));
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

        const hullPoints = concaveman(perimeterPoints, 1);
        const shape = new THREE.Shape(hullPoints.map(([x, y]) => new Vector2(x, y)));

        // Add circular insets as holes
        circles.forEach(circle => {
            const path = new THREE.Path();
            const segments = 32;
            const radius = circle.insetRadius;

            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const x = circle.position.x + Math.cos(angle) * radius;
                const y = circle.position.y + Math.sin(angle) * radius;
                if (i === 0) {
                    path.moveTo(x, y);
                } else {
                    path.lineTo(x, y);
                }
            }

            shape.holes.push(path);
        });

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
        baseFillGeometry.current = geometry;

    }, [baseWidth, stagger, rows, cols, gap, supportSlot.length, supportSlot.width]);


    return (
        <>
            {baseFillGeometry.current && (
                <mesh geometry={baseFillGeometry.current} material={new MeshBasicMaterial({ color: 'brown', side: DoubleSide })} position={[0, 0, -0.01]} />
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
            {supportSlot.enabled && ovalData && (
                <Oval
                    {...ovalData}
                    outerThickness={1}
                    mainColor="lightgreen"
                    outerColor="green"
                />
            )}
        </>
    );
}

export default GridGen;