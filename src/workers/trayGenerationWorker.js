/* eslint-disable no-restricted-globals */
import { buildBase, buildBorder, computePerimeterDebug } from '../BaseBuilder';
import { generateCirclePlacements } from '../CirclePlacement';

function serializeGeometry(geometry) {
    if (!geometry) return null;

    const attributes = {};
    const transferables = [];

    Object.entries(geometry.attributes).forEach(([name, attribute]) => {
        attributes[name] = {
            array: attribute.array,
            itemSize: attribute.itemSize,
            normalized: attribute.normalized
        };
        transferables.push(attribute.array.buffer);
    });

    const serialized = {
        attributes,
        groups: geometry.groups
    };

    if (geometry.index) {
        serialized.index = {
            array: geometry.index.array,
            itemSize: geometry.index.itemSize,
            normalized: geometry.index.normalized
        };
        transferables.push(geometry.index.array.buffer);
    }

    return { serialized, transferables };
}

function buildBounds(points) {
    if (!points || points.length === 0) {
        return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let minZ = 0;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = 0;

    for (const point of points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }

    return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ }
    };
}

self.onmessage = event => {
    const { requestId, params } = event.data;
    const {
        slotShape,
        insetRadius,
        insetWidth,
        insetHeight,
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
    } = params;

    const { circles, points, bounds: placementBounds } = generateCirclePlacements({
        slotShape,
        insetRadius,
        insetWidth,
        insetHeight,
        borderWidth,
        rows,
        cols,
        gap,
        stagger,
        triangleFormation,
        straySlot,
        supportSlot
    });

    const baseMesh = buildBase({
        circles,
        supportSlot,
        baseThickness,
        borderWidth,
        rows,
        cols,
        straySlot
    });

    const borderMesh = buildBorder({
        circles,
        supportSlot,
        borderWidth,
        edgeHeight: borderHeight
    });

    const baseGeometry = serializeGeometry(baseMesh.geometry);
    const borderGeometry = serializeGeometry(borderMesh.geometry);
    const debugData = perimeterDebug ? computePerimeterDebug(circles, supportSlot, borderWidth) : null;
    const bounds = placementBounds
        ? {
            min: { x: placementBounds.min.x, y: placementBounds.min.y, z: 0 },
            max: { x: placementBounds.max.x, y: placementBounds.max.y, z: borderHeight }
        }
        : buildBounds(points);

    const transferables = [];
    if (baseGeometry) transferables.push(...baseGeometry.transferables);
    if (borderGeometry) transferables.push(...borderGeometry.transferables);

    self.postMessage({
        requestId,
        result: {
            baseGeometry: baseGeometry?.serialized || null,
            borderGeometry: borderGeometry?.serialized || null,
            bounds,
            circles,
            debugData
        }
    }, transferables);
};
