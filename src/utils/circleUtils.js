import { Shape, Path, ExtrudeGeometry, Mesh, MeshStandardMaterial, Group, CylinderGeometry } from 'three';
import { CSG } from 'three-csg-ts';

export function createCircleGroup(insetRadius, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor, center, nearbyCircles = [], hollowBottom, includeBorder = true) {
    const group = new Group();

    if (center) {
        const outerRadius = insetRadius + borderWidth;
        const baseMaterial = new MeshStandardMaterial({ color: '#e0e3eb', roughness: 0.5, metalness: 0.1 });

        let finalBaseMesh;
        if (!magnetSlot.enabled && !hollowBottom) {
            const baseGeom = new CylinderGeometry(insetRadius, insetRadius, baseThickness, 48);
            baseGeom.rotateX(Math.PI / 2);
            finalBaseMesh = new Mesh(baseGeom, baseMaterial);
        } else {
            const baseGeom = new CylinderGeometry(insetRadius, insetRadius, baseThickness, 48);
            baseGeom.rotateX(Math.PI / 2);
            const baseMesh = new Mesh(baseGeom, baseMaterial);

            let csgBase = CSG.fromMesh(baseMesh);

            if (magnetSlot.enabled) {
                const magnetGeom = new CylinderGeometry(magnetSlot.width / 2, magnetSlot.width / 2, magnetSlot.depth, 48);
                magnetGeom.rotateX(Math.PI / 2);
                const magnetMesh = new Mesh(magnetGeom);
                magnetMesh.position.z = (baseThickness / 2) - (magnetSlot.depth / 2);
                magnetMesh.updateMatrixWorld();
                csgBase = csgBase.subtract(CSG.fromMesh(magnetMesh));
            }

            if (hollowBottom) {
                const hollowBottomGeom = new CylinderGeometry(insetRadius - 3, insetRadius - 3, baseThickness, 48);
                hollowBottomGeom.rotateX(Math.PI / 2);
                const hollowBottomMesh = new Mesh(hollowBottomGeom);
                hollowBottomMesh.position.z = 0;
                hollowBottomMesh.updateMatrixWorld();
                csgBase = csgBase.subtract(CSG.fromMesh(hollowBottomMesh));
            }

            finalBaseMesh = CSG.toMesh(csgBase, baseMesh.matrix, baseMaterial);
        }

        finalBaseMesh.position.set(center.x, center.y, baseThickness / 2);
        finalBaseMesh.updateMatrixWorld();
        group.add(finalBaseMesh);

        // Create border segments
        if (includeBorder) {
            const arcs = createNonIntersectingBorderSegments(center, insetRadius, outerRadius, borderHeight, nearbyCircles);
            arcs.forEach(mesh => {
                mesh.position.set(center.x, center.y, 0);
                group.add(mesh);
            });
        }
    }

    group.updateMatrixWorld(true);

    return group;
}


function createNonIntersectingBorderSegments(center, insetRadius, outerRadius, borderHeight, nearbyCircles) {
    const segments = [];
    const baseOuterMaterial = new MeshStandardMaterial({ color: '#333a40' });
    const sampleCount = 180;
    const visibleArcs = [];
    const states = [];

    for (let i = 0; i < sampleCount; i++) {
        const angle = (i / sampleCount) * Math.PI * 2;
        const sampleX = center.x + Math.cos(angle) * (outerRadius - 0.01);
        const sampleY = center.y + Math.sin(angle) * (outerRadius - 0.01);

        const occluded = nearbyCircles.some(other => {
            const dx = sampleX - other.x;
            const dy = sampleY - other.y;
            return (dx * dx + dy * dy) < ((outerRadius - 0.05) * (outerRadius - 0.05));
        });

        states.push({ angle, visible: !occluded });
    }

    let arcStart = null;
    for (let i = 0; i <= sampleCount; i++) {
        const state = states[i % sampleCount];
        if (state.visible && arcStart === null) {
            arcStart = state.angle;
        }

        if ((!state.visible || i === sampleCount) && arcStart !== null) {
            const previousAngle = states[(i - 1 + sampleCount) % sampleCount].angle + ((i === sampleCount) ? ((Math.PI * 2) / sampleCount) : 0);
            const arcLength = previousAngle - arcStart;
            if (arcLength > 0.03) {
                visibleArcs.push({ start: arcStart, end: previousAngle });
            }
            arcStart = null;
        }
    }

    if (visibleArcs.length === 0 && nearbyCircles.length === 0) {
        visibleArcs.push({ start: 0, end: Math.PI * 2 });
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

