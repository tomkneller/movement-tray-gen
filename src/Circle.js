import React, { useMemo } from 'react';
import { createCircleGroup } from './utils/circleUtils';

const Circle = ({ position, insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor = 'lightgreen', borderColor = 'green', hollowBottom }) => {
    const group = useMemo(() => {
        const insetRadius = insetDiameter / 2;
        return createCircleGroup(insetRadius, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor, position, [], hollowBottom);
    }, [insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot, mainColor, borderColor, position, hollowBottom]);

    return (
        <primitive object={group} />
    );
}

export default Circle;