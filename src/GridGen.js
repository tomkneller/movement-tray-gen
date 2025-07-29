import { useState, useEffect } from 'react';
import { MeshStandardMaterial, DoubleSide } from 'three';
import * as THREE from 'three';
import Circle from './Circle';
import Oval from './Oval';
import Square from './Square';
import { createCircleGroup } from './circleUtils';
import { createSquareGroup } from './squareUtils';
import { createOvalMesh } from './ovalUtils';
import { buildBase } from './BaseBuilder';
import { areInsetAreasOverlapping } from './SlotPlacementUtils';
import { generateSlotPlacements } from './SlotPlacement';

function GridGen({ setBounds, slotType, baseThickness, baseWidth, edgeHeight, edgeThickness, stagger, rows, cols, gap, supportSlot, magnetSlot, straySlot, onBaseMeshReady, darkMode }) {
    const [slotsData, setSlotsData] = useState([]);
    const insetDiameter = baseWidth + 0.5; // Adding 0.5 to allow model base to fit inside the circle
    const insetRadius = insetDiameter / 2;
    const borderWidth = edgeThickness;
    const borderHeight = edgeHeight;

    const [baseFillGeometry, setBaseFillGeometry] = useState(null);

    function generateCircleGroups(slots, insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot) {
        if (!slots || slots.length === 0) return [];

        return slots.flatMap(slot => {
            const overlappingNeighbors = slots
                .filter(s => s !== slot && areInsetAreasOverlapping(slot.position, s.position, borderWidth, borderWidth))
                .map(s => s.position);

            const group = createCircleGroup(
                insetDiameter / 2,
                baseThickness,
                borderWidth,
                borderHeight,
                magnetSlot,
                slot.mainColor || 'lightgreen',
                slot.borderColor || 'green',
                slot.position,
                overlappingNeighbors
            );

            group.position.set(slot.position.x, slot.position.y, 0);
            group.updateMatrixWorld(true);

            return group.children.filter(child => child.isMesh);
        });
    }



    function generateSquareGroups(slots, insetDiameter, baseThickness, borderWidth, borderHeight, magnetSlot) {
        if (!slots || slots.length === 0) return [];

        return slots.flatMap(slot => {
            const overlappingNeighbors = slots
                .filter(s => s !== slot && areInsetAreasOverlapping(slot.position, s.position, borderWidth, borderWidth))
                .map(s => s.position);

            const group = createSquareGroup(
                insetDiameter / 2,
                baseThickness,
                borderWidth,
                borderHeight,
                magnetSlot,
                slot.mainColor || 'lightgreen',
                slot.borderColor || 'green',
                slot.position,
                overlappingNeighbors
            );

            group.position.set(slot.position.x, slot.position.y, 0);
            group.updateMatrixWorld(true);

            return group.children.filter(child => child.isMesh);
        });
    }

    useEffect(() => {
        const { slots, points } = generateSlotPlacements({
            insetRadius,
            borderWidth,
            rows,
            cols,
            gap,
            stagger,
            straySlot,
            supportSlot
        });

        const bounds = new THREE.Box3().setFromPoints(points.map(p => new THREE.Vector3(p.x, p.y, 0)));
        setBounds(bounds);

        let allExportMeshes = [];

        if (supportSlot.enabled) {
            const ovalGroup = createOvalMesh({ x: 0, y: 0 }, supportSlot.length, supportSlot.width, baseThickness, borderWidth, borderHeight, magnetSlot);

            allExportMeshes.push(ovalGroup);
        }


        let slotMeshes;

        if (slotType === 'circle') {
            slotMeshes = generateCircleGroups(
                slots,
                insetDiameter,
                baseThickness,
                borderWidth,
                borderHeight,
                magnetSlot
            );
        } else {
            slotMeshes = generateSquareGroups(
                slots,
                insetDiameter,
                baseThickness,
                borderWidth,
                borderHeight,
                magnetSlot
            );
        }


        allExportMeshes.push(...slotMeshes);

        setSlotsData(slots);


        if (slotType !== 'square') {
            const finalBaseMesh = buildBase({
                slots,
                supportSlot,
                baseThickness,
                borderWidth,
                rows,
                cols,
                straySlot,
            });

            setBaseFillGeometry(finalBaseMesh.geometry);

            allExportMeshes.push(finalBaseMesh);
        }

        const group = new THREE.Group();
        allExportMeshes.forEach(mesh => group.add(mesh));

        if (onBaseMeshReady) {
            onBaseMeshReady(group);
        }

    }, [supportSlot, baseWidth, stagger, rows, cols, gap, straySlot, borderWidth, borderHeight, magnetSlot, insetRadius, setBounds, insetDiameter, baseThickness, onBaseMeshReady, slotType]);

    const planeColor = darkMode ? 0x2a3550 : '#7A7474';

    return (
        <>
            {slotType === "circle" && baseFillGeometry && (
                <mesh geometry={baseFillGeometry} material={new MeshStandardMaterial({ color: '#d6cfc7', side: DoubleSide })} position={[0, 0, 0]} />
            )}
            {slotType === "circle" && slotsData.map((slot, index) => (
                <Circle
                    key={index}
                    {...slot}
                    insetDiameter={insetDiameter}
                    baseThickness={baseThickness}
                    borderWidth={borderWidth}
                    borderHeight={borderHeight}
                    magnetSlot={magnetSlot}
                    mainColor="lightgreen"
                    borderColor="green"
                />
            ))}
            {slotType === "circle" && supportSlot.enabled && (
                <Oval
                    length={supportSlot.length}
                    width={supportSlot.width}
                    baseThickness={baseThickness}
                    borderWidth={borderWidth}
                    borderHeight={borderHeight}
                    magnetSlot={magnetSlot}
                    mainColor="lightgreen"
                    outerColor="green"
                />
            )}
            {slotType === "square" && slotsData.map((slot, index) => (
                <Square
                    key={index}
                    {...slot}
                    insetDiameter={insetDiameter}
                    baseThickness={baseThickness}
                    borderWidth={borderWidth}
                    borderHeight={borderHeight}
                    magnetSlot={magnetSlot}
                    mainColor="lightgreen"
                    borderColor="green"
                />
            ))}
            <mesh geometry={new THREE.PlaneGeometry(1000, 1000)} material={new MeshStandardMaterial({
                color: planeColor, roughness: 1, metalness: 0.5,
                transparent: true,
                opacity: 0.95
            })} receiveShadow position={[0, 0, 0]} />
        </>
    );
}

export default GridGen;