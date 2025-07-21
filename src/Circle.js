import React, { useMemo } from 'react';
import { createCircleGroup } from './circleUtils';

const Circle = ({ position, insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor = 'lightgreen', borderColor = 'green' }) => {
    const group = useMemo(() => {
        const insetRadius = insetDiameter / 2;
        return createCircleGroup(insetRadius, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor);
    }, [insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor]);

    return (
        <primitive object={group} position={[position.x, position.y, 0]} />
    );
}

export default Circle;