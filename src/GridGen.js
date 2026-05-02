import { useMemo, useEffect, useRef, useState } from 'react';
import { MeshStandardMaterial, DoubleSide, BufferGeometry, BufferAttribute, Box3, Vector3, PlaneGeometry } from 'three';
import * as THREE from 'three';
import { createCircleGroup } from './utils/circleUtils';
import { createOvalMesh } from './utils/ovalUtils';

function deserializeGeometry(serializedGeometry) {
    if (!serializedGeometry) return null;

    const geometry = new BufferGeometry();

    Object.entries(serializedGeometry.attributes).forEach(([name, attribute]) => {
        geometry.setAttribute(
            name,
            new BufferAttribute(attribute.array, attribute.itemSize, attribute.normalized)
        );
    });

    if (serializedGeometry.index) {
        geometry.setIndex(
            new BufferAttribute(
                serializedGeometry.index.array,
                serializedGeometry.index.itemSize,
                serializedGeometry.index.normalized
            )
        );
    }

    if (serializedGeometry.groups) {
        serializedGeometry.groups.forEach(group => geometry.addGroup(group.start, group.count, group.materialIndex));
    }

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
}

function GridGen({ setBounds, baseThickness, baseWidth, edgeHeight, edgeThickness, stagger, triangleFormation, rows, cols, gap, supportSlot, magnetSlot, straySlot, onBaseMeshReady, darkMode, hollowBottom, perimeterDebug }) {
    const workerRef = useRef(null);
    const requestIdRef = useRef(0);

    const insetDiameter = baseWidth + 0.5; // Adding 0.5 to allow model base to fit inside the circle
    const insetRadius = insetDiameter / 2;
    const borderWidth = edgeThickness;
    const borderHeight = edgeHeight;

    const [workerResult, setWorkerResult] = useState({
        baseGeometry: null,
        borderGeometry: null,
        bounds: null,
        circles: [],
        debugData: null
    });

    function generateCircleMeshes(circles, insetDiameterValue, baseThicknessValue, borderWidthValue, borderHeightValue, magnetSlotValue, hollowBottomValue) {
        if (!circles || circles.length === 0) return [];

        return circles.flatMap(circle => {
            const group = createCircleGroup(
                insetDiameterValue / 2,
                baseThicknessValue,
                borderWidthValue,
                borderHeightValue,
                magnetSlotValue,
                circle.mainColor || 'lightgreen',
                circle.borderColor || 'green',
                circle.position,
                [],
                hollowBottomValue,
                false
            );

            group.updateMatrixWorld(true);
            return group.children.filter(child => child.isMesh);
        });
    }

    useEffect(() => {
        const worker = new Worker(new URL('./workers/trayGenerationWorker.js', import.meta.url));
        workerRef.current = worker;

        worker.onmessage = event => {
            const { requestId, result } = event.data;
            if (requestId !== requestIdRef.current) return;

            setWorkerResult({
                baseGeometry: deserializeGeometry(result.baseGeometry),
                borderGeometry: deserializeGeometry(result.borderGeometry),
                bounds: result.bounds,
                circles: result.circles,
                debugData: result.debugData
            });
        };

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!workerRef.current) return;

        const requestId = ++requestIdRef.current;
        workerRef.current.postMessage({
            requestId,
            params: {
                insetRadius,
                borderWidth,
                rows,
                cols,
                gap,
                stagger,
                triangleFormation,
                straySlot,
                supportSlot,
                perimeterDebug,
                baseThickness,
                borderHeight
            }
        });
    }, [baseThickness, borderHeight, borderWidth, gap, insetRadius, perimeterDebug, rows, cols, stagger, straySlot, supportSlot, triangleFormation]);

    const circleMeshes = useMemo(() => generateCircleMeshes(
        workerResult.circles,
        insetDiameter,
        baseThickness,
        borderWidth,
        borderHeight,
        magnetSlot,
        hollowBottom
    ), [workerResult.circles, insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot, hollowBottom]);

    const supportMeshes = useMemo(() => (
        supportSlot.enabled
            ? createOvalMesh({ x: 0, y: 0 }, supportSlot.length, supportSlot.width, baseThickness, borderWidth, borderHeight, magnetSlot, false)
                .children
                .filter(child => child.isMesh)
            : []
    ), [supportSlot, baseThickness, borderWidth, borderHeight, magnetSlot]);

    const exportGroup = useMemo(() => {
        const group = new THREE.Group();

        circleMeshes.forEach(mesh => group.add(mesh.clone()));
        supportMeshes.forEach(mesh => group.add(mesh.clone()));

        if (workerResult.baseGeometry) {
            group.add(new THREE.Mesh(workerResult.baseGeometry.clone(), new MeshStandardMaterial({ color: '#d6cfc7', side: DoubleSide })));
        }

        if (workerResult.borderGeometry) {
            group.add(new THREE.Mesh(workerResult.borderGeometry.clone(), new MeshStandardMaterial({ color: '#333a40', side: DoubleSide })));
        }

        return group;
    }, [circleMeshes, supportMeshes, workerResult.baseGeometry, workerResult.borderGeometry]);

    useEffect(() => {
        if (workerResult.bounds) {
            const bounds = new Box3(
                new Vector3(workerResult.bounds.min.x, workerResult.bounds.min.y, workerResult.bounds.min.z),
                new Vector3(workerResult.bounds.max.x, workerResult.bounds.max.y, workerResult.bounds.max.z)
            );
            setBounds(bounds);
        }

        if (onBaseMeshReady) {
            onBaseMeshReady(exportGroup);
        }
    }, [workerResult.bounds, exportGroup, onBaseMeshReady, setBounds]);

    const planeColor = darkMode ? 0x2a3550 : '#7A7474';

    return (
        <>
            {workerResult.baseGeometry && (
                <mesh geometry={workerResult.baseGeometry} material={new MeshStandardMaterial({ color: '#d6cfc7', side: DoubleSide })} position={[0, 0, 0]} />
            )}
            {workerResult.borderGeometry && (
                <mesh geometry={workerResult.borderGeometry} material={new MeshStandardMaterial({ color: '#333a40', side: DoubleSide })} position={[0, 0, 0]} />
            )}
            {circleMeshes.map((mesh, index) => (
                <primitive key={`circle-${index}`} object={mesh} />
            ))}
            {supportMeshes.map((mesh, index) => (
                <primitive key={`support-${index}`} object={mesh} />
            ))}

            {workerResult.debugData && (
                <group>
                    {workerResult.debugData.hullCenters && workerResult.debugData.hullCenters.map((p, idx) => (
                        <mesh key={'hc' + idx} position={[p[0], p[1], 0.5]}>
                            <sphereGeometry args={[0.6, 8, 8]} />
                            <meshBasicMaterial color={'#ff0000'} />
                        </mesh>
                    ))}
                    {workerResult.debugData.triangles && workerResult.debugData.triangles.map((t, idx) => (
                        <group key={'tri' + idx}>
                            <mesh position={[t.center.x, t.center.y, 0.6]}>
                                <sphereGeometry args={[0.5, 8, 8]} />
                                <meshBasicMaterial color={'#0000ff'} />
                            </mesh>
                            <mesh position={[t.pA.x, t.pA.y, 0.5]}>
                                <sphereGeometry args={[0.35, 8, 8]} />
                                <meshBasicMaterial color={'#ffff00'} />
                            </mesh>
                            <mesh position={[t.pB.x, t.pB.y, 0.5]}>
                                <sphereGeometry args={[0.35, 8, 8]} />
                                <meshBasicMaterial color={'#ffff00'} />
                            </mesh>
                            <mesh position={[t.pC.x, t.pC.y, 0.5]}>
                                <sphereGeometry args={[0.35, 8, 8]} />
                                <meshBasicMaterial color={'#ffff00'} />
                            </mesh>
                        </group>
                    ))}
                    {workerResult.debugData.connectors && workerResult.debugData.connectors.map((c, idx) => (
                        <group key={'con' + idx}>
                            <mesh position={[c.pA.x, c.pA.y, 0.5]}>
                                <sphereGeometry args={[0.35, 8, 8]} />
                                <meshBasicMaterial color={'#ffa500'} />
                            </mesh>
                            <mesh position={[c.pB.x, c.pB.y, 0.5]}>
                                <sphereGeometry args={[0.35, 8, 8]} />
                                <meshBasicMaterial color={'#ffa500'} />
                            </mesh>
                        </group>
                    ))}
                </group>
            )}

            <mesh geometry={new PlaneGeometry(1000, 1000)} material={new MeshStandardMaterial({
                color: planeColor, roughness: 1, metalness: 0.5,
                transparent: true,
                opacity: 0.95
            })} receiveShadow position={[0, 0, 0]} />
        </>
    );
}

export default GridGen;
