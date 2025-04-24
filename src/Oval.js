import React from 'react';
import { Shape, ShapeGeometry, MeshBasicMaterial, DoubleSide, ExtrudeGeometry, Path, CylinderGeometry } from 'three';

function Oval({ position, length, width, outerThickness = 2, mainColor, outerColor }) {
    const innerLengthRadius = length / 2;
    const innerWidthRadius = width / 2;
    const outerLengthRadius = innerLengthRadius + outerThickness;
    const outerWidthRadius = innerWidthRadius + outerThickness;

    const magnetSlotDiameter = 5;

    // Shape for the outer oval
    const outerShape = new Shape();
    outerShape.ellipse(0, 0, outerLengthRadius, outerWidthRadius, 0, 2 * Math.PI, false, 0);
    const outerGeometry = new ShapeGeometry(outerShape);
    const outerMaterial = new MeshBasicMaterial({ color: 'green', side: DoubleSide });

    const hole1 = new Path();
    // hole1.absarc(0, 0, 5, 0, Math.PI * 2, true);
    hole1.ellipse(0, 0, outerLengthRadius - 2, outerWidthRadius - 2, 0, Math.PI * 2, true);
    outerShape.holes.push(hole1);



    const extrudeSettings = {
        depth: 4,
        bevelEnabled: true,
    };

    const outerOvalGeometry = new ExtrudeGeometry(outerShape, extrudeSettings);



    // Shape for the inner oval (hole)
    const innerShape = new Shape();
    innerShape.ellipse(0, 0, innerLengthRadius, innerWidthRadius, 0, 2 * Math.PI, false, 0);

    const innerGeometry = new ShapeGeometry(innerShape);
    const innerMaterial = new MeshBasicMaterial({ color: 'purple', side: DoubleSide });

    const hole = new Path();
    hole.absarc(0, 0, magnetSlotDiameter, 0, Math.PI * 2, true);
    // hole.ellipse(0, 0, innerLengthRadius, innerWidthRadius, 0, Math.PI * 2, true);
    innerShape.holes.push(hole);

    const extrudeSettings2 = {
        depth: 2,
        bevelEnabled: true,
    };

    const innerOvalGeometry = new ExtrudeGeometry(innerShape, extrudeSettings2);



    const magnet = new CylinderGeometry(magnetSlotDiameter, magnetSlotDiameter, 0, 32)

    return (
        <group position={[position.x, position.y, 0]}>
            <mesh geometry={outerOvalGeometry} material={outerMaterial} />
            <mesh geometry={innerOvalGeometry} material={innerMaterial} />
            <mesh geometry={magnet} material={new MeshBasicMaterial({ color: 'teal' })} rotation={[Math.PI / 2, 0, 0]} />
        </group>
    );
}

export default Oval;