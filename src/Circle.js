import React, { } from 'react';

import { MeshBasicMaterial } from 'three';
import { CircleGeometry } from 'three';

const Circle = ({ position, insetRadius, borderWidth, mainColor, borderColor }) => {
    const outerRadius = insetRadius + borderWidth;
    return (
        <group position={[position.x, position.y, 0]}>
            <mesh geometry={new CircleGeometry(outerRadius, 32)} material={new MeshBasicMaterial({ color: borderColor })} />
            <mesh geometry={new CircleGeometry(insetRadius, 32)} material={new MeshBasicMaterial({ color: mainColor })} />
        </group>
    );
};

export default Circle;