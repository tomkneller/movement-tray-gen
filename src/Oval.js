import React, { useMemo } from 'react';
import { createOvalMesh } from './ovalUtils';

function Oval({ position, length, width, baseThickness, borderWidth, borderHeight, magnetSlot }) {
    const ovalGroup = useMemo(() => {
        return createOvalMesh(position, length, width, baseThickness, borderWidth, borderHeight, magnetSlot);
    }, [position, length, width, baseThickness, borderWidth, borderHeight, magnetSlot]);

    return <primitive object={ovalGroup} />;
}

export default Oval;