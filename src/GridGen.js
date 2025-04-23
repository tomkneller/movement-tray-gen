import React, { useState, useEffect, useRef } from 'react';
import { Shape, ShapeGeometry, MeshBasicMaterial, DoubleSide, Vector2 } from 'three';
import * as THREE from 'three';
import Circle from './Circle';
import Oval from './Oval';
import concaveman from 'concaveman';

function GridGen({ setBounds, baseWidth, stagger, rows, cols, gap, supportSlot }) {
    const [circlesData, setCirclesData] = useState([]);
    const [ovalData, setOvalData] = useState(null);
    const insetDiameter = baseWidth;
    const insetRadius = insetDiameter / 2;
    const borderWidth = 2;
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


        if (stagger) {
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    let xShift = col * xOffset;
                    if (row % 2 === 1) {
                        xShift += xOffset / 2;
                    }
                    const yShift = row * yOffset;
                    const position = { x: xShift, y: yShift };
                    circles.push({ position, insetRadius: insetRadius, borderWidth: borderWidth, row, col });
                    points.push(new Vector2(position.x, position.y));

                    minx = Math.min(minx, position.x - circleOuterRadius);
                    miny = Math.min(miny, position.y - circleOuterRadius);
                    maxx = Math.max(maxx, position.x + circleOuterRadius);
                    maxy = Math.max(maxy, position.y + circleOuterRadius);
                }
            }
        }
        else {
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    let xShift = col * xOffset;

                    const yShift = row * yOffset;
                    const position = { x: xShift, y: yShift };
                    circles.push({ position, insetRadius: insetRadius, borderWidth: borderWidth, row, col });
                    points.push(new Vector2(position.x, position.y));

                    minx = Math.min(minx, position.x - circleOuterRadius);
                    miny = Math.min(miny, position.y - circleOuterRadius);
                    maxx = Math.max(maxx, position.x + circleOuterRadius);
                    maxy = Math.max(maxy, position.y + circleOuterRadius);
                }
            }
        }



        setCirclesData(circles);

        const ovalCenterX = (minx + maxx) / 2;
        const ovalCenterY = maxy + gap + ovalWidth / 2;
        setOvalData({ position: { x: ovalCenterX, y: ovalCenterY }, length: supportSlot.length, width: supportSlot.width });
        points.push(new Vector2(ovalCenterX, ovalCenterY));

        const bounds = new THREE.Box3().setFromPoints(points.map(v => new THREE.Vector3(v.x, v.y, 0)));
        setBounds(bounds);
    }, [insetRadius, borderWidth, ovalLength, ovalWidth, gap, rows, cols, xOffset, yOffset, setBounds, circleOuterRadius, stagger, supportSlot.length, supportSlot.width]);

    useEffect(() => {
        if (circlesData.length > 0) {
            const numSegments = 16;
            const edgeCircles = new Set();

            // Find edge circles based on row/col
            const groupedByRow = {};
            const groupedByCol = {};

            for (const c of circlesData) {
                const rowKey = c.row;
                const colKey = c.col;
                if (!groupedByRow[rowKey]) groupedByRow[rowKey] = [];
                if (!groupedByCol[colKey]) groupedByCol[colKey] = [];
                groupedByRow[rowKey].push(c);
                groupedByCol[colKey].push(c);
            }

            // Get left/right edge in each row
            Object.values(groupedByRow).forEach(row => {
                const sorted = [...row].sort((a, b) => a.position.x - b.position.x);
                edgeCircles.add(sorted[0]);
                edgeCircles.add(sorted[sorted.length - 1]);
            });

            // Get top/bottom edge in each column
            Object.values(groupedByCol).forEach(col => {
                const sorted = [...col].sort((a, b) => a.position.y - b.position.y);
                edgeCircles.add(sorted[0]);
                edgeCircles.add(sorted[sorted.length - 1]);
            });

            // Sample only edge circles
            const perimeterPoints = [];
            for (const circle of edgeCircles) {
                for (let i = 0; i < numSegments; i++) {
                    const angle = (i / numSegments) * 2 * Math.PI;
                    const x = circle.position.x + Math.cos(angle) * circleOuterRadius;
                    const y = circle.position.y + Math.sin(angle) * circleOuterRadius;
                    perimeterPoints.push([x, y]);
                }
            }

            // Optional: include oval
            if (supportSlot.enabled && ovalData) {
                const { x, y } = ovalData.position;
                perimeterPoints.push([x, y]);
            }

            // Concave hull
            const hullPoints = concaveman(perimeterPoints, 1);
            const shape = new Shape(hullPoints.map(([x, y]) => new Vector2(x, y)));
            const geometry = new ShapeGeometry(shape);
            baseFillGeometry.current = geometry;
        }
    }, [circlesData, circleOuterRadius, supportSlot.enabled, ovalData]);


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