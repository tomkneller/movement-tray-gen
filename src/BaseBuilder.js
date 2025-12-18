import * as THREE from 'three';
import { CSG } from 'three-csg-ts';

function getDistance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function unionMeshes(meshes) {
    if (meshes.length === 0) return null;
    let result = CSG.fromMesh(meshes[0]);
    for (let i = 1; i < meshes.length; i++) {
        result = result.union(CSG.fromMesh(meshes[i]));
    }
    return result;
}

export function buildBase({
    circles,
    supportSlot,
    borderWidth,
    depth = 2
}) {
    if (!circles || circles.length === 0) return new THREE.Mesh();

    const circleOuterRadius = (circles[0].insetRadius || 10) + borderWidth;
    // connectionThreshold: how close centers must be to fill the gap between them.
    const connectionThreshold = (circleOuterRadius * 2) * 1.6;

    let solidParts = [];
    let connectionPoints = []; // We will use these to calculate the webbing

    circles.forEach(circle => {
        const geom = new THREE.CylinderGeometry(circleOuterRadius, circleOuterRadius, depth, 40);
        geom.rotateX(Math.PI / 2);
        geom.translate(circle.position.x, circle.position.y, depth / 2);
        const mesh = new THREE.Mesh(geom);
        mesh.updateMatrix();
        solidParts.push(mesh);

        // Save the center point for webbing calculation
        connectionPoints.push({ x: circle.position.x, y: circle.position.y });
    });

    if (supportSlot && supportSlot.enabled) {
        const sOuterL = supportSlot.length + (borderWidth * 2);
        const sOuterW = supportSlot.width + (borderWidth * 2);
        const shape = new THREE.Shape();
        shape.absellipse(0, 0, sOuterL / 2, sOuterW / 2, 0, Math.PI * 2);
        const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
        const mesh = new THREE.Mesh(geom);
        mesh.updateMatrix();
        solidParts.push(mesh);

        // Add center point for webbing (0,0)
        connectionPoints.push({ x: 0, y: 0 });
    }

    // Triangle fill handles staggered layouts (3 neighbors)
    for (let i = 0; i < connectionPoints.length; i++) {
        for (let j = i + 1; j < connectionPoints.length; j++) {
            for (let k = j + 1; k < connectionPoints.length; k++) {
                const p1 = connectionPoints[i];
                const p2 = connectionPoints[j];
                const p3 = connectionPoints[k];

                if (getDistance(p1, p2) < connectionThreshold &&
                    getDistance(p2, p3) < connectionThreshold &&
                    getDistance(p3, p1) < connectionThreshold) {

                    const shape = new THREE.Shape();
                    shape.moveTo(p1.x, p1.y);
                    shape.lineTo(p2.x, p2.y);
                    shape.lineTo(p3.x, p3.y);
                    shape.closePath();

                    const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
                    const mesh = new THREE.Mesh(geom);
                    mesh.updateMatrix();
                    solidParts.push(mesh);
                }

                // Quad fill for Standard Grid (4 neighbors)
                for (let l = k + 1; l < connectionPoints.length; l++) {
                    const p4 = connectionPoints[l];

                    const dists = [
                        getDistance(p1, p2), getDistance(p1, p3), getDistance(p1, p4),
                        getDistance(p2, p3), getDistance(p2, p4), getDistance(p3, p4)
                    ].filter(d => d < connectionThreshold);

                    if (dists.length >= 5) {
                        const points = [p1, p2, p3, p4];
                        const center = {
                            x: (p1.x + p2.x + p3.x + p4.x) / 4,
                            y: (p1.y + p2.y + p3.y + p4.y) / 4
                        };
                        points.sort((a, b) => Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x));

                        const shape = new THREE.Shape();
                        shape.moveTo(points[0].x, points[0].y);
                        shape.lineTo(points[1].x, points[1].y);
                        shape.lineTo(points[2].x, points[2].y);
                        shape.lineTo(points[3].x, points[3].y);
                        shape.closePath();

                        const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
                        const mesh = new THREE.Mesh(geom);
                        mesh.updateMatrix();
                        solidParts.push(mesh);
                    }
                }
            }
        }
    }

    let baseCSG = unionMeshes(solidParts);

    for (const circle of circles) {
        const holeGeom = new THREE.CylinderGeometry(circle.insetRadius, circle.insetRadius, depth * 3, 32);
        holeGeom.rotateX(Math.PI / 2);
        holeGeom.translate(circle.position.x, circle.position.y, depth / 2);
        const holeMesh = new THREE.Mesh(holeGeom);
        holeMesh.updateMatrix();
        baseCSG = baseCSG.subtract(CSG.fromMesh(holeMesh));
    }

    // Subtract support slot hole
    if (supportSlot && supportSlot.enabled) {
        const holeShape = new THREE.Shape();
        holeShape.absellipse(0, 0, supportSlot.length / 2, supportSlot.width / 2, 0, Math.PI * 2);
        const holeGeom = new THREE.ExtrudeGeometry(holeShape, { depth: depth * 3, bevelEnabled: false });
        holeGeom.translate(0, 0, -depth);
        const holeMesh = new THREE.Mesh(holeGeom);
        holeMesh.updateMatrix();
        baseCSG = baseCSG.subtract(CSG.fromMesh(holeMesh));
    }

    const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
    return CSG.toMesh(baseCSG, new THREE.Matrix4(), material);
}

// Ensure computePerimeterDebug is still exported to prevent the build error
export function computePerimeterDebug(circles) {
    return { perimeter: [], hullCenters: [], hullIndices: [], rimSamples: [], triangles: [], connectors: [] };
}