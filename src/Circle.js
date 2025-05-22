import React, { useMemo } from 'react';
import { createCircleGroup } from './circleUtils';

const Circle = ({ position, insetDiameter, baseThickness, borderWidth, magnetSlot, mainColor = 'lightgreen', borderColor = 'green' }) => {
    const group = useMemo(() => {
        const insetRadius = insetDiameter / 2;
        return createCircleGroup(insetRadius, baseThickness, borderWidth, magnetSlot, mainColor, borderColor);
    }, [insetDiameter, baseThickness, borderWidth, magnetSlot, mainColor, borderColor]);

    return (
        <primitive object={group} position={[position.x, position.y, 1]} />
    );
}

export default Circle;