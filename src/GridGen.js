import React, { useState, useEffect } from 'react';
import { MeshBasicMaterial, DoubleSide, Vector2 } from 'three';
import * as THREE from 'three';
import Circle from './Circle';
import Oval from './Oval';
import concaveman from 'concaveman';

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



        const circleOuterRadius = insetRadius + borderWidth;
        const xOffset = circleOuterRadius + insetRadius + gap;
        const yOffset = circleOuterRadius + insetRadius + gap;

        let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;

        const addCircle = (x, y, row = 0, col = 0) => {
            const position = { x, y };

            console.log(canAddCircle(x, y, row, col, circles));


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

            console.log("number");

            console.log(numCircles);
            console.log("number");

            console.log(numCircles);

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