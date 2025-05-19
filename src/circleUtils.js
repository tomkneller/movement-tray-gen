import { Shape, Path, ExtrudeGeometry, CylinderGeometry, Mesh, MeshStandardMaterial, Group } from 'three';

export function createCircleGroup(insetRadius, borderWidth, magnetSlot, mainColor, borderColor) {
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
        hole.absarc(0, 0, magnetSlot.width, 0, Math.PI * 2, true);
        shapeInner.holes.push(hole);
    }

    const extrudeInner = new ExtrudeGeometry(shapeInner, {
        depth: 2,
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
        depth: 4,
        bevelEnabled: true,
        curveSegments: 128,
    });

    const borderMesh = new Mesh(extrudeBorder, borderMaterial);
    borderMesh.position.z = 0;  // raise border mesh on Z axis to sit on top of inner mesh
    group.add(borderMesh);

    // Magnet slot geometry (cylinder)
    if (magnetSlot.enabled) {
        const magnetDepth = magnetSlot.depth / 2;
        const magnetSlotGeom = new CylinderGeometry(magnetSlot.width, magnetSlot.width, magnetDepth, 32);
        magnetSlotGeom.translate(0, magnetDepth / 2 - 0.2, magnetDepth / 2);

        const magnetMesh = new Mesh(magnetSlotGeom, magnetMaterial);
        magnetMesh.rotation.x = Math.PI / 2;
        magnetMesh.position.z = 0;  // position magnet slot above border ring

        group.add(magnetMesh);
    }

    return group;
}
