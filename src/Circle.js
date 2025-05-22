import React, { useMemo } from 'react';
import { createCircleGroup } from './circleUtils';

const Circle = ({ position, insetDiameter, borderWidth, borderHeight, magnetSlot, mainColor = 'lightgreen', borderColor = 'green' }) => {
    const group = useMemo(() => {
        const insetRadius = insetDiameter / 2;
        return createCircleGroup(insetRadius, borderWidth, borderHeight, magnetSlot, mainColor, borderColor);
    }, [insetDiameter, borderWidth, borderHeight, magnetSlot, mainColor, borderColor]);

    return (
        <primitive object={group} position={[position.x, position.y, 1]} />
    );
}

export default Circle;