import React from 'react';
import { Shape, ShapeGeometry, MeshBasicMaterial, DoubleSide } from 'three';

function Oval({ position, length, width, outerThickness = 1, mainColor, outerColor }) {
    const innerLengthRadius = length / 2;
    const innerWidthRadius = width / 2;
    const outerLengthRadius = innerLengthRadius + outerThickness;
    const outerWidthRadius = innerWidthRadius + outerThickness;

    // Shape for the outer oval
    const outerShape = new Shape();
    outerShape.ellipse(0, 0, outerLengthRadius, outerWidthRadius, 0, 2 * Math.PI, false, 0);
    const outerGeometry = new ShapeGeometry(outerShape);
    const outerMaterial = new MeshBasicMaterial({ color: outerColor, side: DoubleSide });

    // Shape for the inner oval (hole)
    const innerShape = new Shape();
    innerShape.ellipse(0, 0, innerLengthRadius, innerWidthRadius, 0, 2 * Math.PI, false, 0);
    const innerGeometry = new ShapeGeometry(innerShape);
    const innerMaterial = new MeshBasicMaterial({ color: mainColor, side: DoubleSide });

    return (
        <group position={[position.x, position.y, 0]}>
            <mesh geometry={outerGeometry} material={outerMaterial} />
            <mesh geometry={innerGeometry} material={innerMaterial} position={[0, 0, -0.01]} />
        </group>
    );
}

export default Oval;