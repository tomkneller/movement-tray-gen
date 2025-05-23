import React, { useMemo } from 'react';
import { createSquareGroup } from './squareUtils';

const Square = ({ position, insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor = 'lightgreen', borderColor = 'green' }) => {
    const group = useMemo(() => {
        const insetRadius = insetDiameter / 2;
        return createSquareGroup(insetRadius, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor);
    }, [insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor]);

    return (
        <primitive object={group} position={[position.x, position.y, 1]} />
    );
}

export default Square;