import React, { } from 'react';

import { MeshStandardMaterial } from 'three';
import { CylinderGeometry, ExtrudeGeometry, Shape, Path } from 'three';

const Circle = ({ position, insetRadius, borderWidth, magnetSlot, mainColor, borderColor }) => {
    const outerRadius = insetRadius + borderWidth;

    const magnetSlotDiameter = magnetSlot.width;
    const magnetSlotDepth = magnetSlot.depth;


    const shape3 = new Shape();
    shape3.absarc(0, 0, outerRadius - borderWidth, 0, Math.PI * 2, false);

    const extrudeSettings3 = {
        depth: 2,
        bevelEnabled: true,
        curveSegments: 128,
    };


    //Base circle cutout with magnet slot
    const shape = new Shape();
    shape.absarc(0, 0, outerRadius - borderWidth, 0, Math.PI * 2, false);

    const hole = new Path();
    hole.absarc(0, 0, magnetSlotDiameter, 0, Math.PI * 2, true);
    shape.holes.push(hole);


    const extrudeSettings = {
        depth: 2,
        bevelEnabled: true,
        curveSegments: 128,
    };


    //Edge circle cutout 
    const shape2 = new Shape();
    shape2.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

    const hole2 = new Path();
    hole2.absarc(0, 0, insetRadius, 0, Math.PI * 2, true);
    shape2.holes.push(hole2);


    const extrudeSettings2 = {
        depth: 4,
        bevelEnabled: true,
        curveSegments: 128,
    };


    const bordersGeom = new ExtrudeGeometry(shape2, extrudeSettings2);


    const magnetDepth = magnetSlotDepth / 2;

    const magnetSlotGeom = new CylinderGeometry(magnetSlotDiameter, magnetSlotDiameter, magnetDepth, 32);
    magnetSlotGeom.translate(0, magnetDepth / 2 - 0.2, 0);

    return (
        <group position={[position.x, position.y, 0]}>
            {magnetSlot.enabled ? (
                <mesh geometry={new ExtrudeGeometry(shape, extrudeSettings)} material={new MeshStandardMaterial({ color: 'purple' })} />
            ) :
                <mesh geometry={new ExtrudeGeometry(shape3, extrudeSettings3)} material={new MeshStandardMaterial({ color: 'white' })} />
            }
            <mesh geometry={bordersGeom} material={new MeshStandardMaterial({ color: 'green', roughness: 0.7, metalness: 0.1, })} />
            {magnetSlot.enabled ? (
                <mesh geometry={magnetSlotGeom} material={new MeshStandardMaterial({ color: 'teal' })} rotation={[Math.PI / 2, 0, 0]} />
            ) : null}


        </group>
    );
};

export default Circle;