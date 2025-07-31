import React, { useMemo } from 'react';
import { createCircleGroup } from './utils/circleUtils';

const Circle = ({ position, insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor = 'lightgreen', borderColor = 'green' }) => {
    const group = useMemo(() => {
        const insetRadius = insetDiameter / 2;
        return createCircleGroup(insetRadius, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor, position);
    }, [insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor, position]);

    return (
        <primitive object={group} />
    );
}

export default Circle;