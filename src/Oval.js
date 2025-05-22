import React, { useMemo } from 'react';
import { createOvalMesh } from './ovalUtils';

function Oval({ position, length, width, baseThickness, borderWidth, magnetSlot }) {
    const ovalGroup = useMemo(() => {
        return createOvalMesh(position, length, width, baseThickness, borderWidth, magnetSlot);
    }, [position, length, width, baseThickness, borderWidth, magnetSlot]);

    return <primitive object={ovalGroup} />;
}

export default Oval;