import React from 'react';
import { Shape, MeshStandardMaterial, DoubleSide, ExtrudeGeometry, Path, CylinderGeometry } from 'three';

function Oval({ position, length, width, borderWidth, magnetSlot, mainColor, outerColor }) {
    const innerLengthRadius = length / 2;
    const innerWidthRadius = width / 2;
    const outerLengthRadius = innerLengthRadius + borderWidth;
    const outerWidthRadius = innerWidthRadius + borderWidth;

    const magnetSlotDiameter = magnetSlot.width;
    const magnetSlotDepth = magnetSlot.depth;


    // Shape for the outer oval
    const outerShape = new Shape();
    outerShape.ellipse(0, 0, outerLengthRadius, outerWidthRadius, 0, 2 * Math.PI, false, 0);

    const outerMaterial = new MeshStandardMaterial({ color: 'green', side: DoubleSide });

    const hole1 = new Path();
    hole1.ellipse(0, 0, outerLengthRadius - 2, outerWidthRadius - 2, 0, Math.PI * 2, true);
    outerShape.holes.push(hole1);

    const extrudeSettings = {
        depth: 4,
        bevelEnabled: true,
        curveSegments: 128,

    };

    const outerOvalGeometry = new ExtrudeGeometry(outerShape, extrudeSettings);

    //Inner inset of support base with magnet hole
    const innerShape = new Shape();
    innerShape.ellipse(0, 0, outerLengthRadius - borderWidth, outerWidthRadius - borderWidth, 0, 2 * Math.PI, false, 0);

    const innerMaterial = new MeshStandardMaterial({ color: 'purple', side: DoubleSide });

    const hole = new Path();
    hole.absarc(0, 0, magnetSlotDiameter, 0, Math.PI * 2, true);
    innerShape.holes.push(hole);

    const extrudeSettings2 = {
        depth: 2,
        bevelEnabled: true,
        curveSegments: 128,
    };

    const innerOvalGeometryWithHole = new ExtrudeGeometry(innerShape, extrudeSettings2);


    //Inner inset of support base with no magnet hole
    const innerShape2 = new Shape();
    innerShape2.ellipse(0, 0, outerLengthRadius - borderWidth, outerWidthRadius - borderWidth, 0, 2 * Math.PI, false, 0);
    const innerOvalGeometryNoHole = new ExtrudeGeometry(innerShape2, extrudeSettings2);



    const magnetDepth = magnetSlotDepth / 2;
    const magnetSlotGeom = new CylinderGeometry(magnetSlotDiameter, magnetSlotDiameter, magnetDepth, 32);
    magnetSlotGeom.translate(0, magnetDepth / 2 - 0.2, 0);

    return (
        <group position={[position.x, position.y, 0]}>
            <mesh geometry={outerOvalGeometry} material={outerMaterial} />
            {magnetSlot.enabled ? (
                <mesh geometry={innerOvalGeometryWithHole} material={innerMaterial} />
            ) :
                <mesh geometry={innerOvalGeometryNoHole} material={new MeshStandardMaterial({ color: 'white' })} />
            }
            {magnetSlot.enabled ? (
                <mesh geometry={magnetSlotGeom} material={new MeshStandardMaterial({ color: 'teal' })} rotation={[Math.PI / 2, 0, 0]} />
            ) : null}
        </group>
    );
}

export default Oval;