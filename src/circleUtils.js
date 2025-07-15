import { Shape, Path, ExtrudeGeometry, Mesh, MeshStandardMaterial, Group } from 'three';

export function createCircleGroup(insetRadius, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor, center, nearbyCircles = []) {
    const group = new Group();

    const outerRadius = insetRadius + borderWidth;

    const baseMaterial = new MeshStandardMaterial({ color: '#e0e3eb', roughness: 0.5, metalness: 0.1 });
    const magnetMaterial = new MeshStandardMaterial({ color: '#555555' });

    // Inner base
    const shapeInner = new Shape();
    shapeInner.absarc(0, 0, insetRadius, 0, Math.PI * 2, false);

    if (magnetSlot.enabled) {
        const hole = new Path();
        hole.absarc(0, 0, magnetSlot.width / 2, 0, Math.PI * 2, true);
        shapeInner.holes.push(hole);
    }

    const extrudeInner = new ExtrudeGeometry(shapeInner, {
        depth: baseThickness,
        bevelEnabled: false,
        curveSegments: 64,
    });

    const innerMesh = new Mesh(extrudeInner, baseMaterial);
    group.add(innerMesh);

    // Border arcs
    const arcs = createNonIntersectingBorderSegments(center, insetRadius, outerRadius, borderHeight, nearbyCircles);
    arcs.forEach(mesh => group.add(mesh));

    // Magnet
    if (magnetSlot.enabled) {
        const magnetRadius = magnetSlot.width / 2;
        const magnetDepth = baseThickness - magnetSlot.depth;

        const shapeMagnet = new Shape();
        shapeMagnet.absarc(0, 0, magnetRadius, 0, Math.PI * 2, false);

        const extrudeMagnet = new ExtrudeGeometry(shapeMagnet, {
            depth: magnetDepth,
            bevelEnabled: false,
            curveSegments: 64,
        });

        const magnetMesh = new Mesh(extrudeMagnet, magnetMaterial);
        group.add(magnetMesh);
    }

    return group;
}


function createNonIntersectingBorderSegments(center, insetRadius, outerRadius, borderHeight, nearbyCircles) {
    const segments = [];

    const overlapAngles = [];

    const baseOuterMaterial = new MeshStandardMaterial({ color: '#333a40' });


    for (const other of nearbyCircles) {
        const dx = other.x - center.x;
        const dy = other.y - center.y;
        const dSq = dx * dx + dy * dy;
        const dist = Math.sqrt(dSq);

        if (dist < outerRadius * 2 && dist > 0) {
            const angle = Math.atan2(dy, dx);
            const overlapArc = Math.acos((dist * dist + 2 * insetRadius * insetRadius - 4 * outerRadius * outerRadius) / (2 * dist * insetRadius));
            if (!isNaN(overlapArc)) {
                overlapAngles.push({ start: angle - overlapArc, end: angle + overlapArc });
            }
        }
    }

    // Merge overlapping ranges
    overlapAngles.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const range of overlapAngles) {
        if (merged.length === 0) {
            merged.push(range);
        } else {
            const last = merged[merged.length - 1];
            if (range.start <= last.end) {
                last.end = Math.max(last.end, range.end);
            } else {
                merged.push(range);
            }
        }
    }

    // Invert to get visible arc segments
    const visibleArcs = [];
    let lastEnd = 0;
    for (const { start, end } of merged) {
        if (start > lastEnd) {
            visibleArcs.push({ start: lastEnd, end: start });
        }
        lastEnd = Math.max(lastEnd, end);
    }
    if (lastEnd < Math.PI * 2) {
        visibleArcs.push({ start: lastEnd, end: Math.PI * 2 });
    }

    for (const arc of visibleArcs) {
        const shape = new Shape();
        shape.absarc(0, 0, outerRadius, arc.start, arc.end, false);
        const hole = new Path();
        hole.absarc(0, 0, insetRadius, arc.end, arc.start, true);
        shape.holes.push(hole);

        const geom = new ExtrudeGeometry(shape, {
            depth: borderHeight,
            bevelEnabled: false,
            curveSegments: 64,
        });

        segments.push(new Mesh(geom, baseOuterMaterial));
    }

    return segments;
}

