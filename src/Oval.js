import React, { useMemo } from 'react';
import { createOvalMesh } from './ovalUtils';

function Oval({ position, length, width, borderWidth, magnetSlot }) {
    const ovalGroup = useMemo(() => {
        return createOvalMesh(position, length, width, borderWidth, magnetSlot);
    }, [position, length, width, borderWidth, magnetSlot]);

    return <primitive object={ovalGroup} />;
}

export default Oval;