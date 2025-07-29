// BaseBuilder.js
import * as THREE from 'three';
import { CSG } from 'three-csg-ts';

export function buildBase({
    circles,
    supportSlot,
    baseThickness,
    borderWidth,
    depth = 2,
    straySlot,
    rows,
    cols
}) {
    const circleOuterRadius = circles[0]?.insetRadius + borderWidth;

    const outerPath = buildPerimeter(circles, rows, cols, straySlot, supportSlot.enabled, supportSlot.mode);

    let baseMesh;
    if (outerPath.length > 2) {
        const shape = new THREE.Shape();
        shape.moveTo(outerPath[0].x, outerPath[0].y);
        for (let i = 1; i < outerPath.length; i++) {
            shape.lineTo(outerPath[i].x, outerPath[i].y);
        }
        shape.lineTo(outerPath[0].x, outerPath[0].y); // Close the loop

        const baseShapeGeometry = new THREE.ExtrudeGeometry(shape, {
            depth,
            bevelEnabled: false,
        });
        baseShapeGeometry.translate(0, 0, 0);
        baseMesh = new THREE.Mesh(baseShapeGeometry);
    } else {
        const bounds = new THREE.Box3().setFromPoints(circles.map(c => new THREE.Vector3(c.position.x, c.position.y, 0)));
        const size = new THREE.Vector3();
        bounds.getSize(size);
        const baseGeom = new THREE.BoxGeometry(size.x, size.y, depth);
        baseGeom.translate(bounds.min.x + size.x / 2, bounds.min.y + size.y / 2, depth / 2);
        baseMesh = new THREE.Mesh(baseGeom);
    }

    let csgResult = CSG.fromMesh(baseMesh);

    for (const circle of circles) {
        const holeGeom = new THREE.CylinderGeometry(circleOuterRadius, circleOuterRadius, depth * 2, 64);
        holeGeom.rotateX(Math.PI / 2);
        holeGeom.translate(circle.position.x, circle.position.y, depth / 2);
        const holeMesh = new THREE.Mesh(holeGeom);
        csgResult = csgResult.subtract(CSG.fromMesh(holeMesh));
    }

    if (supportSlot.enabled) {
        const supportSlotShape = new THREE.Shape();
        supportSlotShape.absellipse(0, 0, (supportSlot.length / 2) + borderWidth, (supportSlot.width / 2) + borderWidth, 0, Math.PI * 2);
        const supportSlotGeometry = new THREE.ExtrudeGeometry(supportSlotShape, { depth, bevelEnabled: false });
        const supportSlotMesh = new THREE.Mesh(supportSlotGeometry);
        csgResult = csgResult.subtract(CSG.fromMesh(supportSlotMesh));
    }

    const finalBaseMesh = CSG.toMesh(csgResult, baseMesh.matrix, baseMesh.material);
    return finalBaseMesh;
}

function buildPerimeter(circles, rows, cols, straySlot, supportEnabled, supportSlotMode) {
    const getIndex = (r, c) => circles.find(circ => circ.row === r && circ.col === c);
    const perimeter = [];

    if (supportEnabled) {
        if (supportSlotMode === 'circle') {
            //Oval position (may need changing if support slot can be moved in future)
            perimeter.push(new THREE.Vector2(0, 0));
        }
        for (const circle of circles) {
            perimeter.push(new THREE.Vector2(circle.position.x, circle.position.y));
        }
        // perimeter.push(new THREE.Vector2(0, 0));
    } else {
        for (let c = 0; c < cols; c++) {
            const circ = getIndex(0, c);
            if (circ) perimeter.push(circ.position);
        }
        for (let r = 1; r < rows; r++) {
            const isStagger = straySlot && r % 2 === 1;
            const circ = getIndex(r, cols - (isStagger ? 2 : 1));
            if (circ) perimeter.push(circ.position);
        }
        for (let c = cols - 2; c >= 0; c--) {
            const circ = getIndex(rows - 1, c);
            if (circ) perimeter.push(circ.position);
        }
        for (let r = rows - 2; r > 0; r--) {
            const circ = getIndex(r, 0);
            if (circ) perimeter.push(circ.position);
        }
    }

    return perimeter;
}
