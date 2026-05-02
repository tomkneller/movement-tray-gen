import { useMemo, useEffect } from 'react';
import { MeshStandardMaterial, DoubleSide } from 'three';
import * as THREE from 'three';
import { createCircleGroup } from './utils/circleUtils';
import { createOvalMesh } from './utils/ovalUtils';
import { buildBase, buildBorder, computePerimeterDebug } from './BaseBuilder';
import { areInsetAreasOverlapping } from './utils/CirclePlacementUtils';
import { generateCirclePlacements } from './CirclePlacement';

function GridGen({ setBounds, baseThickness, baseWidth, edgeHeight, edgeThickness, stagger, triangleFormation, rows, cols, gap, supportSlot, magnetSlot, straySlot, onBaseMeshReady, darkMode, hollowBottom, perimeterDebug }) {
    const insetDiameter = baseWidth + 0.5; // Adding 0.5 to allow model base to fit inside the circle
    const insetRadius = insetDiameter / 2;
    const borderWidth = edgeThickness;
    const borderHeight = edgeHeight;

    function generateCircleMeshes(circles, insetDiameterValue, baseThicknessValue, borderWidthValue, borderHeightValue, magnetSlotValue, hollowBottomValue) {
        if (!circles || circles.length === 0) return [];

        return circles.flatMap(circle => {
            const outerRadius = (circle.insetRadius || insetDiameterValue / 2) + borderWidthValue;
            const overlappingNeighbors = circles
                .filter(candidate => candidate !== circle && areInsetAreasOverlapping(
                    circle.position,
                    candidate.position,
                    outerRadius,
                    (candidate.insetRadius || insetDiameterValue / 2) + borderWidthValue
                ))
                .map(candidate => candidate.position);

            const group = createCircleGroup(
                insetDiameterValue / 2,
                baseThicknessValue,
                borderWidthValue,
                borderHeightValue,
                magnetSlotValue,
                circle.mainColor || 'lightgreen',
                circle.borderColor || 'green',
                circle.position,
                overlappingNeighbors,
                hollowBottomValue,
                false
            );

            group.updateMatrixWorld(true);
            return group.children.filter(child => child.isMesh);
        });
    }

    const generated = useMemo(() => {
        const { circles, points } = generateCirclePlacements({
            insetRadius,
            borderWidth,
            rows,
            cols,
            gap,
            stagger,
            triangleFormation,
            straySlot,
            supportSlot
        });

        const bounds = new THREE.Box3().setFromPoints(points.map(point => new THREE.Vector3(point.x, point.y, 0)));
        const circleMeshes = generateCircleMeshes(
            circles,
            insetDiameter,
            baseThickness,
            borderWidth,
            borderHeight,
            magnetSlot,
            hollowBottom
        );

        const supportMeshes = supportSlot.enabled
            ? createOvalMesh({ x: 0, y: 0 }, supportSlot.length, supportSlot.width, baseThickness, borderWidth, borderHeight, magnetSlot, false)
                .children
                .filter(child => child.isMesh)
            : [];

        let debugData = null;
        if (perimeterDebug) {
            try {
                debugData = computePerimeterDebug(circles, supportSlot, borderWidth);
            } catch (err) {
                console.warn('Perimeter debug computation failed', err);
            }
        }

        const baseMesh = buildBase({
            circles,
            supportSlot,
            baseThickness,
            borderWidth,
            rows,
            cols,
            straySlot,
        });

        const borderMesh = buildBorder({
            circles,
            supportSlot,
            borderWidth,
            edgeHeight: borderHeight
        });

        const exportGroup = new THREE.Group();
        [...circleMeshes, ...supportMeshes, baseMesh, borderMesh].forEach(mesh => {
            exportGroup.add(mesh.clone());
        });

        return {
            baseMesh,
            borderMesh,
            bounds,
            circleMeshes,
            debugData,
            exportGroup,
            supportMeshes
        };
    }, [baseThickness, borderHeight, borderWidth, gap, hollowBottom, insetDiameter, insetRadius, magnetSlot, perimeterDebug, rows, cols, stagger, straySlot, supportSlot, triangleFormation]);

    useEffect(() => {
        setBounds(generated.bounds);

        if (onBaseMeshReady) {
            onBaseMeshReady(generated.exportGroup);
        }
    }, [generated, onBaseMeshReady, setBounds]);

    const planeColor = darkMode ? 0x2a3550 : '#7A7474';

    return (
        <>
            {generated.baseMesh?.geometry && (
                <mesh geometry={generated.baseMesh.geometry} material={new MeshStandardMaterial({ color: '#d6cfc7', side: DoubleSide })} position={[0, 0, 0]} />
            )}
            {generated.borderMesh?.geometry && (
                <mesh geometry={generated.borderMesh.geometry} material={new MeshStandardMaterial({ color: '#333a40', side: DoubleSide })} position={[0, 0, 0]} />
            )}
            {generated.circleMeshes.map((mesh, index) => (
                <primitive key={`circle-${index}`} object={mesh} />
            ))}
            {generated.supportMeshes.map((mesh, index) => (
                <primitive key={`support-${index}`} object={mesh} />
            ))}

            {/* Debug visualizations for perimeter generation */}
            {generated.debugData && (
                <group>
                    {generated.debugData.hullCenters && generated.debugData.hullCenters.map((p, idx) => (
                        <mesh key={'hc' + idx} position={[p[0], p[1], 0.5]}>
                            <sphereGeometry args={[0.6, 8, 8]} />
                            <meshBasicMaterial color={'#ff0000'} />
                        </mesh>
                    ))}
                    {generated.debugData.triangles && generated.debugData.triangles.map((t, idx) => (
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
                    {generated.debugData.connectors && generated.debugData.connectors.map((c, idx) => (
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

            <mesh geometry={new THREE.PlaneGeometry(1000, 1000)} material={new MeshStandardMaterial({
                color: planeColor, roughness: 1, metalness: 0.5,
                transparent: true,
                opacity: 0.95
            })} receiveShadow position={[0, 0, 0]} />
        </>
    );
}

export default GridGen;
