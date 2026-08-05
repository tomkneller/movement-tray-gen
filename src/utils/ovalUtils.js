import {
    Shape,
    Path,
    ExtrudeGeometry,
    MeshStandardMaterial,
    Mesh,
    Group,
    CylinderGeometry
} from 'three';
import { CSG } from 'three-csg-ts';

export function createOvalMesh(position, length, width, baseThickness, borderWidth, borderHeight, magnetSlot, includeBorder = true, hollowBottom = false) {
    const group = new Group();

    const baseMaterial = new MeshStandardMaterial({ color: '#e0e3eb', roughness: 0.5, metalness: 0.1 });
    const baseOuterMaterial = new MeshStandardMaterial({ color: '#333a40' });

    const innerLengthRadius = Math.max(length / 2, 0.5);
    const innerWidthRadius = Math.max(width / 2, 0.5);
    const outerLengthRadius = innerLengthRadius + borderWidth;
    const outerWidthRadius = innerWidthRadius + borderWidth;

    // Inner oval
    const innerShape = new Shape();
    innerShape.ellipse(0, 0, outerLengthRadius - borderWidth, outerWidthRadius - borderWidth, 0, 2 * Math.PI, false);

    const innerGeom = new ExtrudeGeometry(innerShape, {
        depth: baseThickness,
        bevelEnabled: false,
        curveSegments: 64,
    });

    let finalBaseMesh;
    if (!magnetSlot.enabled && !hollowBottom) {
        finalBaseMesh = new Mesh(innerGeom, baseMaterial);
    } else {
        const innerMesh = new Mesh(
            innerGeom,
            baseMaterial
        );

        innerMesh.updateMatrix();

        let csgBase = CSG.fromMesh(innerMesh);

        if (magnetSlot.enabled) {
            const magnetGeom = new CylinderGeometry(magnetSlot.width / 2, magnetSlot.width / 2, magnetSlot.depth, 48);
            magnetGeom.rotateX(Math.PI / 2);
            const magnetMesh = new Mesh(magnetGeom);
            magnetMesh.position.z = baseThickness - (magnetSlot.depth / 2);
            magnetMesh.updateMatrixWorld();
            csgBase = csgBase.subtract(CSG.fromMesh(magnetMesh));
        }

        if (hollowBottom) {
            const hollowLengthRadius = Math.max(0.5, innerLengthRadius - 3);
            const hollowWidthRadius = Math.max(0.5, innerWidthRadius - 3);
            const hollowShape = new Shape();
            hollowShape.absellipse(0, 0, hollowLengthRadius, hollowWidthRadius, 0, Math.PI * 2);
            const hollowGeometry = new ExtrudeGeometry(hollowShape, {
                depth: baseThickness * 3,
                bevelEnabled: false,
                curveSegments: 64
            });
            hollowGeometry.translate(0, 0, -baseThickness);
            const hollowMesh = new Mesh(hollowGeometry);
            hollowMesh.updateMatrix();
            csgBase = csgBase.subtract(CSG.fromMesh(hollowMesh));
        }

        finalBaseMesh = CSG.toMesh(csgBase, innerMesh.matrix, baseMaterial);
    }

    finalBaseMesh.position.set(position?.x || 0, position?.y || 0, 0);
    finalBaseMesh.updateMatrixWorld();
    group.add(finalBaseMesh);


    // Border shape: outer oval minus inner oval
    const outerShape = new Shape();
    outerShape.ellipse(0, 0, outerLengthRadius, outerWidthRadius, 0, 2 * Math.PI, false);

    // Subtract inner oval from outer to form the ring
    const borderHole = new Path();
    borderHole.ellipse(0, 0, outerLengthRadius - borderWidth, outerWidthRadius - borderWidth, 0, 2 * Math.PI, true);
    outerShape.holes.push(borderHole);

    // Extrude the ring
    const borderGeom = new ExtrudeGeometry(outerShape, {
        depth: borderHeight,
        bevelEnabled: false,
        curveSegments: 64,
    });

    if (includeBorder) {
        const borderMesh = new Mesh(borderGeom, baseOuterMaterial);
        borderMesh.position.set(position?.x || 0, position?.y || 0, 0);
        group.add(borderMesh);
    }

    group.updateMatrixWorld(true);

    return group;
}
