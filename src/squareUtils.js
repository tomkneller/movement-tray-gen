import { Shape, Path, ExtrudeGeometry, Mesh, MeshStandardMaterial, Group } from 'three';

export function createSquareGroup(insetRadius, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor) {
    const group = new Group();

    const outerRadius = insetRadius + borderWidth;

    // Create materials — adjust as needed or pass as parameter
    const baseMaterial = new MeshStandardMaterial({ color: mainColor });
    const borderMaterial = new MeshStandardMaterial({ color: borderColor });
    const magnetMaterial = new MeshStandardMaterial({ color: 0x555555 });


    // Inner square shape
    const shapeInner = new Shape();
    shapeInner.moveTo(-insetRadius, -insetRadius); // bottom-left
    shapeInner.lineTo(insetRadius, -insetRadius);  // bottom-right
    shapeInner.lineTo(insetRadius, insetRadius);   // top-right
    shapeInner.lineTo(-insetRadius, insetRadius);  // top-left
    shapeInner.lineTo(-insetRadius, -insetRadius); // close the path


    if (magnetSlot.enabled) {
        const hole = new Path();
        hole.absarc(0, 0, magnetSlot.width / 2, 0, Math.PI * 2, true);
        shapeInner.holes.push(hole);
    }

    const extrudeInner = new ExtrudeGeometry(shapeInner, {
        depth: baseThickness,
        bevelEnabled: false,
    });

    const innerMesh = new Mesh(extrudeInner, baseMaterial);
    innerMesh.position.z = 0;  // center extrusion on Z axis if needed
    group.add(innerMesh);

    // Border ring shape
    const shapeBorder = new Shape();
    shapeBorder.moveTo(-outerRadius, -outerRadius); // bottom-left
    shapeBorder.lineTo(outerRadius, -outerRadius);  // bottom-right
    shapeBorder.lineTo(outerRadius, outerRadius);   // top-right
    shapeBorder.lineTo(-outerRadius, outerRadius);  // top-left
    shapeBorder.lineTo(-outerRadius, -outerRadius); // close the path


    const holeBorder = new Path();
    holeBorder.moveTo(-insetRadius, -insetRadius); // bottom-left
    holeBorder.lineTo(insetRadius, -insetRadius);  // bottom-right
    holeBorder.lineTo(insetRadius, insetRadius);   // top-right
    holeBorder.lineTo(-insetRadius, insetRadius);  // top-left
    holeBorder.lineTo(-insetRadius, -insetRadius); // close the path

    shapeBorder.holes.push(holeBorder);

    const extrudeBorder = new ExtrudeGeometry(shapeBorder, {
        depth: borderHeight,
        bevelEnabled: false,
    });

    const borderMesh = new Mesh(extrudeBorder, borderMaterial);
    borderMesh.position.z = 0;  // raise border mesh on Z axis to sit on top of inner mesh
    group.add(borderMesh);

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
