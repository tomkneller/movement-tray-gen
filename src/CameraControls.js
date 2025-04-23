import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function CameraControls({ bounds }) {
    const camera = useRef();
    const { get } = useThree();
    const target = useRef(new THREE.Vector3()); // Use a ref for the lookAt target

    useEffect(() => {
        const cam = get().camera;
        if (bounds) {
            const center = bounds.getCenter(new THREE.Vector3());
            const size = bounds.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const cameraDistance = maxDim * 2; // Adjust multiplier as needed

            cam.position.set(center.x, center.y, cameraDistance);
            target.current.copy(center);
        } else {
            // Fallback initial position and target
            cam.position.set(0, 0, 50);
            target.current.set(5, 20, 0);
        }
    }, [get, bounds]);

    useFrame(() => {
        get().camera.lookAt(target.current); // Smoothly look at the target every frame
    });

    return <perspectiveCamera ref={camera} fov={75} near={0.1} far={1000} />;
}

export default CameraControls;