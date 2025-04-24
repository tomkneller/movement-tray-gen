import React, { } from 'react';

import { MeshBasicMaterial } from 'three';
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
    };



    return (
        <group position={[position.x, position.y, 0]}>
            {magnetSlot.enabled ? (
                <mesh geometry={new ExtrudeGeometry(shape, extrudeSettings)} material={new MeshBasicMaterial({ color: 'purple' })} />) :
                <mesh geometry={new ExtrudeGeometry(shape3, extrudeSettings3)} material={new MeshBasicMaterial({ color: 'white' })} />
            }
            <mesh geometry={new ExtrudeGeometry(shape2, extrudeSettings2)} material={new MeshBasicMaterial({ color: 'green' })} />
            {magnetSlot.enabled ? (
                <mesh geometry={new CylinderGeometry(magnetSlotDiameter, magnetSlotDiameter, 0, 32)} material={new MeshBasicMaterial({ color: 'teal' })} rotation={[Math.PI / 2, 0, 0]} />
            ) : null}


        </group>
    );
};

export default Circle;