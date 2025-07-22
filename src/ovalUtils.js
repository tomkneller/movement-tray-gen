import {
    Shape,
    Path,
    ExtrudeGeometry,
    MeshStandardMaterial,
    Mesh,
    Group,
} from 'three';

export function createOvalMesh(position, length, width, baseThickness, borderWidth, borderHeight, magnetSlot) {
    const group = new Group();
    const magnetMaterial = new MeshStandardMaterial({ color: 0x555555 });

    const innerLengthRadius = length / 2;
    const innerWidthRadius = width / 2;
    const outerLengthRadius = innerLengthRadius + borderWidth;
    const outerWidthRadius = innerWidthRadius + borderWidth;

    // Outer shape
    const outerShape = new Shape();
    outerShape.ellipse(0, 0, outerLengthRadius, outerWidthRadius, 0, 2 * Math.PI, false);
    const hole1 = new Path();
    hole1.ellipse(0, 0, outerLengthRadius - 2, outerWidthRadius - 2, 0, 2 * Math.PI, true);
    outerShape.holes.push(hole1);

    const outerGeom = new ExtrudeGeometry(outerShape, {
        depth: borderHeight,
        bevelEnabled: false,
        curveSegments: 128,
    });
    const outerMesh = new Mesh(outerGeom, new MeshStandardMaterial({ color: 'green' }));


    group.add(outerMesh);

    // Inner oval
    const innerShape = new Shape();
    innerShape.ellipse(0, 0, outerLengthRadius - borderWidth, outerWidthRadius - borderWidth, 0, 2 * Math.PI, false);

    if (magnetSlot.enabled) {
        const magnetHole = new Path();
        magnetHole.absarc(0, 0, magnetSlot.width / 2, 0, Math.PI * 2, true);
        innerShape.holes.push(magnetHole);
    }

    const innerGeom = new ExtrudeGeometry(innerShape, {
        depth: baseThickness,
        bevelEnabled: false,
        curveSegments: 128,
    });

    const innerMesh = new Mesh(
        innerGeom,
        new MeshStandardMaterial({ color: magnetSlot.enabled ? 'lightgreen' : 'white' })
    );

    group.add(innerMesh);

    // Optional magnet slot
    if (magnetSlot.enabled) {
        const magnetDepth = baseThickness - magnetSlot.depth;
        const magnetRadius = magnetSlot.width / 2;

        const shapeMagnet = new Shape();
        shapeMagnet.absarc(0, 0, magnetRadius, 0, Math.PI * 2, false);

        const extrudeMagnet = new ExtrudeGeometry(shapeMagnet, {
            depth: magnetDepth,
            curveSegments: 128,
        });

        const magnetMesh = new Mesh(extrudeMagnet, magnetMaterial);
        magnetMesh.position.z = 0;  // center extrusion on Z axis if needed

        group.add(magnetMesh);
    }

    group.position.z = 0;

    return group;
}
