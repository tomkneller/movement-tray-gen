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

export function createOvalMesh(position, length, width, baseThickness, borderWidth, borderHeight, magnetSlot) {
    const group = new Group();

    const baseMaterial = new MeshStandardMaterial({ color: '#e0e3eb', roughness: 0.5, metalness: 0.1 });
    const magnetMaterial = new MeshStandardMaterial({ color: '#555555' });
    const baseOuterMaterial = new MeshStandardMaterial({ color: '#333a40' });

    const innerLengthRadius = length / 2;
    const innerWidthRadius = width / 2;
    const outerLengthRadius = innerLengthRadius + borderWidth;
    const outerWidthRadius = innerWidthRadius + borderWidth;

    // Inner oval
    const innerShape = new Shape();
    innerShape.ellipse(0, 0, outerLengthRadius - borderWidth, outerWidthRadius - borderWidth, 0, 2 * Math.PI, false);

    const innerGeom = new ExtrudeGeometry(innerShape, {
        depth: baseThickness,
        bevelEnabled: false,
        curveSegments: 128,
    });

    const innerMesh = new Mesh(
        innerGeom,
        baseMaterial
    );

    innerMesh.updateMatrix();

    let csgBase = CSG.fromMesh(innerMesh);

    // Optional magnet slot
    if (magnetSlot.enabled) {
        const magnetGeom = new CylinderGeometry(magnetSlot.width / 2, magnetSlot.width / 2, magnetSlot.depth, 64);
        magnetGeom.rotateX(Math.PI / 2);
        const magnetMesh = new Mesh(magnetGeom);
        magnetMesh.position.z = baseThickness - (magnetSlot.depth / 2);
        magnetMesh.updateMatrixWorld();

        csgBase = csgBase.subtract(CSG.fromMesh(magnetMesh));
    }

    // Create mesh from CSG result
    const finalBaseMesh = CSG.toMesh(csgBase, innerMesh.matrix, baseMaterial);
    finalBaseMesh.position.set(0, 0, 0);
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
        curveSegments: 128,
    });

    const borderMesh = new Mesh(borderGeom, baseOuterMaterial);
    borderMesh.position.z = 0;
    group.add(borderMesh);

    group.updateMatrixWorld(true);

    return group;
}