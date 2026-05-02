import { Shape, Path, ExtrudeGeometry, MeshStandardMaterial, Mesh, Group, BoxGeometry, CylinderGeometry } from 'three';
import { CSG } from 'three-csg-ts';

export function createRectangleGroup(insetWidth, insetHeight, baseThickness, borderWidth, borderHeight, magnetSlot, center, hollowBottom, includeBorder = true) {
    const group = new Group();
    const baseMaterial = new MeshStandardMaterial({ color: '#e0e3eb', roughness: 0.5, metalness: 0.1 });

    let finalBaseMesh;
    if (!magnetSlot.enabled && !hollowBottom) {
        const baseGeometry = new BoxGeometry(insetWidth, insetHeight, baseThickness);
        finalBaseMesh = new Mesh(baseGeometry, baseMaterial);
    } else {
        const baseGeometry = new BoxGeometry(insetWidth, insetHeight, baseThickness);
        const baseMesh = new Mesh(baseGeometry, baseMaterial);
        let csgBase = CSG.fromMesh(baseMesh);

        if (magnetSlot.enabled) {
            const magnetGeometry = new CylinderGeometry(magnetSlot.width / 2, magnetSlot.width / 2, magnetSlot.depth, 48);
            magnetGeometry.rotateX(Math.PI / 2);
            const magnetMesh = new Mesh(magnetGeometry);
            magnetMesh.position.z = (baseThickness / 2) - (magnetSlot.depth / 2);
            magnetMesh.updateMatrixWorld();
            csgBase = csgBase.subtract(CSG.fromMesh(magnetMesh));
        }

        if (hollowBottom) {
            const hollowGeometry = new BoxGeometry(
                Math.max(1, insetWidth - 6),
                Math.max(1, insetHeight - 6),
                baseThickness
            );
            const hollowMesh = new Mesh(hollowGeometry);
            hollowMesh.position.z = 0;
            hollowMesh.updateMatrixWorld();
            csgBase = csgBase.subtract(CSG.fromMesh(hollowMesh));
        }

        finalBaseMesh = CSG.toMesh(csgBase, baseMesh.matrix, baseMaterial);
    }

    finalBaseMesh.position.set(center.x, center.y, baseThickness / 2);
    finalBaseMesh.updateMatrixWorld();
    group.add(finalBaseMesh);

    if (includeBorder) {
        const outerWidth = insetWidth + (borderWidth * 2);
        const outerHeight = insetHeight + (borderWidth * 2);
        const outerShape = new Shape();
        outerShape.moveTo(-outerWidth / 2, -outerHeight / 2);
        outerShape.lineTo(outerWidth / 2, -outerHeight / 2);
        outerShape.lineTo(outerWidth / 2, outerHeight / 2);
        outerShape.lineTo(-outerWidth / 2, outerHeight / 2);
        outerShape.closePath();

        const hole = new Path();
        hole.moveTo(-insetWidth / 2, -insetHeight / 2);
        hole.lineTo(-insetWidth / 2, insetHeight / 2);
        hole.lineTo(insetWidth / 2, insetHeight / 2);
        hole.lineTo(insetWidth / 2, -insetHeight / 2);
        hole.closePath();
        outerShape.holes.push(hole);

        const borderGeometry = new ExtrudeGeometry(outerShape, {
            depth: borderHeight,
            bevelEnabled: false
        });
        const borderMaterial = new MeshStandardMaterial({ color: '#333a40' });
        const borderMesh = new Mesh(borderGeometry, borderMaterial);
        borderMesh.position.set(center.x, center.y, 0);
        group.add(borderMesh);
    }

    group.updateMatrixWorld(true);
    return group;
}
