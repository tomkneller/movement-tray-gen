import { Shape, Path, ExtrudeGeometry, Mesh, MeshStandardMaterial, Group, CylinderGeometry } from 'three';
import { CSG } from 'three-csg-ts';

export function createCircleGroup(insetRadius, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor, center, nearbyCircles = [], hollowBottom) {
    const group = new Group();

    if (center) {
        const outerRadius = insetRadius + borderWidth;
        const baseMaterial = new MeshStandardMaterial({ color: '#e0e3eb', roughness: 0.5, metalness: 0.1 });

        // Base cylinder
        const baseGeom = new CylinderGeometry(insetRadius, insetRadius, baseThickness, 64);
        baseGeom.rotateX(Math.PI / 2);
        const baseMesh = new Mesh(baseGeom, baseMaterial);

        let csgBase = CSG.fromMesh(baseMesh);

        // Magnet subtraction
        if (magnetSlot.enabled) {
            const magnetGeom = new CylinderGeometry(magnetSlot.width / 2, magnetSlot.width / 2, magnetSlot.depth, 64);
            magnetGeom.rotateX(Math.PI / 2);
            const magnetMesh = new Mesh(magnetGeom);
            magnetMesh.position.z = (baseThickness / 2) - (magnetSlot.depth / 2);
            magnetMesh.updateMatrixWorld();

            csgBase = csgBase.subtract(CSG.fromMesh(magnetMesh));
        }

        if (hollowBottom) {
            console.log("hollow bottoms");
            const hollowBottomGeom = new CylinderGeometry(insetRadius - 3, insetRadius - 3, baseThickness, 64);
            hollowBottomGeom.rotateX(Math.PI / 2);
            const hollowBottomMesh = new Mesh(hollowBottomGeom);
            hollowBottomMesh.position.z = 0;
            hollowBottomMesh.updateMatrixWorld();

            csgBase = csgBase.subtract(CSG.fromMesh(hollowBottomMesh));
        }

        // Create mesh from CSG result
        const finalBaseMesh = CSG.toMesh(csgBase, baseMesh.matrix, baseMaterial);
        finalBaseMesh.position.set(center.x, center.y, baseThickness / 2);
        finalBaseMesh.updateMatrixWorld();
        group.add(finalBaseMesh);

        // Create border segments
        const arcs = createNonIntersectingBorderSegments(center, insetRadius, outerRadius, borderHeight, nearbyCircles);
        arcs.forEach(mesh => {
            mesh.position.set(center.x, center.y, 0);
            group.add(mesh);
        });
    }

    group.updateMatrixWorld(true);

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

