import {
    Shape,
    Path,
    ExtrudeGeometry,
    CylinderGeometry,
    MeshStandardMaterial,
    Mesh,
    Group,
} from 'three';

export function createOvalMesh(position, length, width, borderWidth, magnetSlot) {
    const group = new Group();

    const innerLengthRadius = length / 2;
    const innerWidthRadius = width / 2;
    const outerLengthRadius = innerLengthRadius + borderWidth;
    const outerWidthRadius = innerWidthRadius + borderWidth;
    const magnetSlotDiameter = magnetSlot.width;

    // Outer shape
    const outerShape = new Shape();
    outerShape.ellipse(0, 0, outerLengthRadius, outerWidthRadius, 0, 2 * Math.PI, false);
    const hole1 = new Path();
    hole1.ellipse(0, 0, outerLengthRadius - 2, outerWidthRadius - 2, 0, 2 * Math.PI, true);
    outerShape.holes.push(hole1);

    const outerGeom = new ExtrudeGeometry(outerShape, {
        depth: 4,
        bevelEnabled: true,
        curveSegments: 128,
    });
    const outerMesh = new Mesh(outerGeom, new MeshStandardMaterial({ color: 'green' }));


    group.add(outerMesh);

    // Inner oval
    const innerShape = new Shape();
    innerShape.ellipse(0, 0, outerLengthRadius - borderWidth, outerWidthRadius - borderWidth, 0, 2 * Math.PI, false);

    if (magnetSlot.enabled) {
        const magnetHole = new Path();
        magnetHole.absarc(0, 0, magnetSlotDiameter, 0, Math.PI * 2, true);
        innerShape.holes.push(magnetHole);
    }

    const innerGeom = new ExtrudeGeometry(innerShape, {
        depth: 2,
        bevelEnabled: true,
        curveSegments: 128,
    });

    const innerMesh = new Mesh(
        innerGeom,
        new MeshStandardMaterial({ color: magnetSlot.enabled ? 'lightgreen' : 'white' })
    );

    group.add(innerMesh);

    // Optional magnet slot
    if (magnetSlot.enabled) {
        const magnetDepth = magnetSlot.depth / 2;
        const magnetSlotGeom = new CylinderGeometry(magnetSlot.width, magnetSlot.width, magnetDepth, 32);
        magnetSlotGeom.rotateX(Math.PI / 2);
        magnetSlotGeom.translate(0, magnetDepth / 2 - 0.2, magnetDepth / 2);

        const magnetMesh = new Mesh(magnetSlotGeom, new MeshStandardMaterial({ color: 0x555555 }));
        group.add(magnetMesh);
    }

    group.position.z = 1;

    return group;
}
