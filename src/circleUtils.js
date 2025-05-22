import { Shape, Path, ExtrudeGeometry, Mesh, MeshStandardMaterial, Group } from 'three';

export function createCircleGroup(insetRadius, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor) {
    const group = new Group();

    const outerRadius = insetRadius + borderWidth;

    // Create materials — adjust as needed or pass as parameter
    const baseMaterial = new MeshStandardMaterial({ color: mainColor });
    const borderMaterial = new MeshStandardMaterial({ color: borderColor });
    const magnetMaterial = new MeshStandardMaterial({ color: 0x555555 });

    // Inner circle shape
    const shapeInner = new Shape();
    shapeInner.absarc(0, 0, outerRadius - borderWidth, 0, Math.PI * 2, false);

    if (magnetSlot.enabled) {
        const hole = new Path();
        hole.absarc(0, 0, magnetSlot.width / 2, 0, Math.PI * 2, true);
        shapeInner.holes.push(hole);
    }

    const extrudeInner = new ExtrudeGeometry(shapeInner, {
        depth: baseThickness,
        bevelEnabled: true,
        curveSegments: 128,
    });

    const innerMesh = new Mesh(extrudeInner, baseMaterial);
    innerMesh.position.z = 0;  // center extrusion on Z axis if needed
    group.add(innerMesh);

    // Border ring shape
    const shapeBorder = new Shape();
    shapeBorder.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    const holeBorder = new Path();
    holeBorder.absarc(0, 0, insetRadius, 0, Math.PI * 2, true);
    shapeBorder.holes.push(holeBorder);

    const extrudeBorder = new ExtrudeGeometry(shapeBorder, {
        depth: borderHeight,
        bevelEnabled: true,
        curveSegments: 128,
    });

    const borderMesh = new Mesh(extrudeBorder, borderMaterial);
    borderMesh.position.z = 0;  // raise border mesh on Z axis to sit on top of inner mesh
    group.add(borderMesh);

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

    return group;
}
