import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function getDistance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function unionMeshes(meshes) {
    if (!meshes || meshes.length === 0) return null;

    let result = CSG.fromMesh(meshes[0]);
    for (let i = 1; i < meshes.length; i++) {
        result = result.union(CSG.fromMesh(meshes[i]));
    }

    return result;
}

function mergeMeshesToGeometry(meshes) {
    if (!meshes || meshes.length === 0) return null;

    const geometries = meshes.map(mesh => {
        mesh.updateMatrix();
        return mesh.geometry.clone().applyMatrix4(mesh.matrix);
    });

    return mergeGeometries(geometries, false);
}

function createOuterCircleMesh(circle, outerRadius, depth) {
    const geometry = new THREE.CylinderGeometry(outerRadius, outerRadius, depth, 40);
    geometry.rotateX(Math.PI / 2);
    geometry.translate(circle.position.x, circle.position.y, depth / 2);
    const mesh = new THREE.Mesh(geometry);
    mesh.updateMatrix();
    return mesh;
}

function createOuterRectangleMesh(slot, borderWidth, depth) {
    const outerWidth = (slot.insetWidth || 0) + (borderWidth * 2);
    const outerHeight = (slot.insetHeight || 0) + (borderWidth * 2);
    const geometry = new THREE.BoxGeometry(outerWidth, outerHeight, depth);
    const mesh = new THREE.Mesh(geometry);
    mesh.position.set(slot.position.x, slot.position.y, depth / 2);
    mesh.updateMatrix();
    return mesh;
}

function createOuterSupportMesh(supportSlot, borderWidth, depth) {
    const outerShape = new THREE.Shape();
    outerShape.absellipse(
        0,
        0,
        (supportSlot.length / 2) + borderWidth,
        (supportSlot.width / 2) + borderWidth,
        0,
        Math.PI * 2
    );

    const geometry = new THREE.ExtrudeGeometry(outerShape, { depth, bevelEnabled: false });
    const mesh = new THREE.Mesh(geometry);
    mesh.updateMatrix();
    return mesh;
}

function buildOuterShellCSG(circles, supportSlot, borderWidth, depth) {
    if (!circles || circles.length === 0) return null;

    const outerRadius = (circles[0].insetRadius || 10) + borderWidth;
    const outerMeshes = circles.map(circle =>
        circle.shape === 'rectangle'
            ? createOuterRectangleMesh(circle, borderWidth, depth)
            : createOuterCircleMesh(circle, outerRadius, depth)
    );

    if (supportSlot?.enabled) {
        outerMeshes.push(createOuterSupportMesh(supportSlot, borderWidth, depth));
    }

    return unionMeshes(outerMeshes);
}

function subtractInsetHoles(baseCSG, circles, supportSlot, depth, mergeHoles = true) {
    if (!baseCSG) return null;

    if (!mergeHoles) {
        let result = baseCSG;

        for (const circle of circles) {
            const holeGeometry = circle.shape === 'rectangle'
                ? new THREE.BoxGeometry(circle.insetWidth, circle.insetHeight, depth * 3)
                : new THREE.CylinderGeometry(circle.insetRadius, circle.insetRadius, depth * 3, 32);
            if (circle.shape !== 'rectangle') {
                holeGeometry.rotateX(Math.PI / 2);
            }
            holeGeometry.translate(circle.position.x, circle.position.y, depth / 2);
            const holeMesh = new THREE.Mesh(holeGeometry);
            holeMesh.updateMatrix();
            result = result.subtract(CSG.fromMesh(holeMesh));
        }

        if (supportSlot?.enabled) {
            const holeShape = new THREE.Shape();
            holeShape.absellipse(0, 0, supportSlot.length / 2, supportSlot.width / 2, 0, Math.PI * 2);
            const holeGeometry = new THREE.ExtrudeGeometry(holeShape, { depth: depth * 3, bevelEnabled: false });
            holeGeometry.translate(0, 0, -depth);
            const holeMesh = new THREE.Mesh(holeGeometry);
            holeMesh.updateMatrix();
            result = result.subtract(CSG.fromMesh(holeMesh));
        }

        return result;
    }

    const holeParts = [];

    for (const circle of circles) {
        const holeGeometry = circle.shape === 'rectangle'
            ? new THREE.BoxGeometry(circle.insetWidth, circle.insetHeight, depth * 3)
            : new THREE.CylinderGeometry(circle.insetRadius, circle.insetRadius, depth * 3, 32);
        if (circle.shape !== 'rectangle') {
            holeGeometry.rotateX(Math.PI / 2);
        }
        holeGeometry.translate(circle.position.x, circle.position.y, depth / 2);
        const holeMesh = new THREE.Mesh(holeGeometry);
        holeMesh.updateMatrix();
        holeParts.push(holeMesh);
    }

    if (supportSlot?.enabled) {
        const holeShape = new THREE.Shape();
        holeShape.absellipse(0, 0, supportSlot.length / 2, supportSlot.width / 2, 0, Math.PI * 2);
        const holeGeometry = new THREE.ExtrudeGeometry(holeShape, { depth: depth * 3, bevelEnabled: false });
        holeGeometry.translate(0, 0, -depth);
        const holeMesh = new THREE.Mesh(holeGeometry);
        holeMesh.updateMatrix();
        holeParts.push(holeMesh);
    }

    const holeGeometry = mergeMeshesToGeometry(holeParts);
    if (!holeGeometry) return baseCSG;

    const mergedHoleMesh = new THREE.Mesh(holeGeometry);
    mergedHoleMesh.updateMatrix();
    return baseCSG.subtract(CSG.fromMesh(mergedHoleMesh));
}

export function buildBase({
    circles,
    supportSlot,
    borderWidth,
    depth,
    baseThickness = 2
}) {
    if (!circles || circles.length === 0) return new THREE.Mesh();

    const resolvedDepth = depth ?? baseThickness;
    const slotShape = circles[0].shape || 'circle';
    const circleOuterRadius = (circles[0].insetRadius || 10) + borderWidth;
    const rectangleHalfDiagonal = Math.sqrt(
        ((circles[0].insetWidth || 0) / 2) ** 2 +
        ((circles[0].insetHeight || 0) / 2) ** 2
    ) + borderWidth;
    const connectionThreshold = slotShape === 'rectangle'
        ? rectangleHalfDiagonal * 2.1
        : (circleOuterRadius * 2) * 1.6;

    const solidParts = [];
    const connectionPoints = [];

    circles.forEach(circle => {
        const geometry = slotShape === 'rectangle'
            ? new THREE.BoxGeometry(circle.insetWidth + (borderWidth * 2), circle.insetHeight + (borderWidth * 2), resolvedDepth)
            : new THREE.CylinderGeometry(circleOuterRadius, circleOuterRadius, resolvedDepth, 40);
        if (slotShape !== 'rectangle') {
            geometry.rotateX(Math.PI / 2);
        }
        geometry.translate(circle.position.x, circle.position.y, resolvedDepth / 2);
        const mesh = new THREE.Mesh(geometry);
        mesh.updateMatrix();
        solidParts.push(mesh);
        connectionPoints.push({ x: circle.position.x, y: circle.position.y });
    });

    if (supportSlot?.enabled) {
        const outerLength = supportSlot.length + (borderWidth * 2);
        const outerWidth = supportSlot.width + (borderWidth * 2);
        const shape = new THREE.Shape();
        shape.absellipse(0, 0, outerLength / 2, outerWidth / 2, 0, Math.PI * 2);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: resolvedDepth, bevelEnabled: false });
        const mesh = new THREE.Mesh(geometry);
        mesh.updateMatrix();
        solidParts.push(mesh);
        connectionPoints.push({ x: 0, y: 0 });
    }

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

                    const geometry = new THREE.ExtrudeGeometry(shape, { depth: resolvedDepth, bevelEnabled: false });
                    const mesh = new THREE.Mesh(geometry);
                    mesh.updateMatrix();
                    solidParts.push(mesh);
                }

                for (let l = k + 1; l < connectionPoints.length; l++) {
                    const p4 = connectionPoints[l];

                    const distances = [
                        getDistance(p1, p2), getDistance(p1, p3), getDistance(p1, p4),
                        getDistance(p2, p3), getDistance(p2, p4), getDistance(p3, p4)
                    ].filter(value => value < connectionThreshold);

                    if (distances.length >= 5) {
                        const points = [p1, p2, p3, p4];
                        const center = {
                            x: (p1.x + p2.x + p3.x + p4.x) / 4,
                            y: (p1.y + p2.y + p3.y + p4.y) / 4
                        };

                        points.sort((left, right) =>
                            Math.atan2(left.y - center.y, left.x - center.x) -
                            Math.atan2(right.y - center.y, right.x - center.x)
                        );

                        const shape = new THREE.Shape();
                        shape.moveTo(points[0].x, points[0].y);
                        shape.lineTo(points[1].x, points[1].y);
                        shape.lineTo(points[2].x, points[2].y);
                        shape.lineTo(points[3].x, points[3].y);
                        shape.closePath();

                        const geometry = new THREE.ExtrudeGeometry(shape, { depth: resolvedDepth, bevelEnabled: false });
                        const mesh = new THREE.Mesh(geometry);
                        mesh.updateMatrix();
                        solidParts.push(mesh);
                    }
                }
            }
        }
    }

    let baseCSG = unionMeshes(solidParts);
    if (!baseCSG) return new THREE.Mesh();

    const outerShellCSG = buildOuterShellCSG(circles, supportSlot, borderWidth, resolvedDepth);
    if (outerShellCSG) {
        baseCSG = baseCSG.subtract(outerShellCSG);
    }

    const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
    return CSG.toMesh(baseCSG, new THREE.Matrix4(), material);
}

export function buildBorder({
    circles,
    supportSlot,
    borderWidth,
    edgeHeight
}) {
    if (!circles || circles.length === 0) return new THREE.Mesh();

    let borderCSG = buildOuterShellCSG(circles, supportSlot, borderWidth, edgeHeight);
    if (!borderCSG) return new THREE.Mesh();

    borderCSG = subtractInsetHoles(borderCSG, circles, supportSlot, edgeHeight, !supportSlot?.enabled);

    const material = new THREE.MeshStandardMaterial({ color: 0x333a40 });
    return CSG.toMesh(borderCSG, new THREE.Matrix4(), material);
}

export function computePerimeterDebug(circles) {
    return { perimeter: [], hullCenters: [], hullIndices: [], rimSamples: [], triangles: [], connectors: [] };
}
