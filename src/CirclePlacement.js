// CirclePlacer.js
import { Vector2 } from 'three';
import { placeEvenCirclesAlongOval, areInsetAreasOverlapping, areRectanglesOverlapping, areEllipsesOverlapping, doesInsetAreaIntersectOval, canAddCircle, nudgePositionAwayFromOval, relaxPositions, doesOuterIntrudeIntoInset } from './utils/CirclePlacementUtils';

// local helper to compute circle-circle intersection points
function circleIntersections(x0, y0, r0, x1, y1, r1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1e-9) return [];
    if (d > r0 + r1 + 1e-6) return [];
    if (d < Math.abs(r0 - r1) - 1e-6) return [];
    const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
    const h2 = r0 * r0 - a * a;
    const xm = x0 + (a * dx) / d;
    const ym = y0 + (a * dy) / d;
    if (h2 < 0) {
        return [{ x: xm, y: ym }];
    }
    const h = Math.sqrt(h2);
    const rx = -dy * (h / d);
    const ry = dx * (h / d);
    return [{ x: xm + rx, y: ym + ry }, { x: xm - rx, y: ym - ry }];
}

export function generateCirclePlacements({
    slotShape = 'circle',
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
}) {
    const circles = [];
    const points = [];

    const resolvedInsetWidth = slotShape === 'circle' ? insetRadius * 2 : insetWidth;
    const resolvedInsetHeight = slotShape === 'circle' ? insetRadius * 2 : insetHeight;
    const outerWidth = resolvedInsetWidth + (borderWidth * 2);
    const outerHeight = resolvedInsetHeight + (borderWidth * 2);
    const circleOuterRadius = insetRadius + borderWidth;
    const xOffset = outerWidth + gap;
    const yOffset = stagger && slotShape === 'circle'
        ? Math.sqrt((2 * circleOuterRadius) ** 2 - (xOffset / 2) ** 2) * 0.98
        : stagger && slotShape === 'oval'
            ? (outerHeight + gap) * (Math.sqrt(3) / 2) * 0.98
            : outerHeight + gap;

    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;

    const addCircle = (x, y, row = 0, col = 0) => {
        const position = { x, y };

        if (slotShape === 'rectangle') {
            const overlaps = circles.some(existing => areRectanglesOverlapping(
                position,
                { width: resolvedInsetWidth, height: resolvedInsetHeight },
                existing.position,
                {
                    width: existing.insetWidth || resolvedInsetWidth,
                    height: existing.insetHeight || resolvedInsetHeight
                }
            ));

            if (overlaps) {
                return false;
            }
        } else if (slotShape === 'oval') {
            const insetSize = { width: resolvedInsetWidth, height: resolvedInsetHeight };
            const outerSize = {
                width: resolvedInsetWidth + (borderWidth * 2),
                height: resolvedInsetHeight + (borderWidth * 2)
            };
            const overlaps = circles.some(existing => {
                const existingInsetSize = {
                    width: existing.insetWidth || resolvedInsetWidth,
                    height: existing.insetHeight || resolvedInsetHeight
                };
                return areEllipsesOverlapping(position, insetSize, existing.position, existingInsetSize) ||
                    areEllipsesOverlapping(position, outerSize, existing.position, existingInsetSize);
            });

            if (overlaps) return false;
        } else {
            if (!canAddCircle(x, y, row, col, circles, insetRadius, borderWidth, supportSlot)) {
                return false;
            }
        }

        circles.push({
            position,
            insetRadius,
            insetWidth: resolvedInsetWidth,
            insetHeight: resolvedInsetHeight,
            borderWidth,
            borderHeight: borderWidth,
            row,
            col,
            shape: slotShape
        });
        points.push(new Vector2(x, y));
        minx = Math.min(minx, x - (outerWidth / 2));
        miny = Math.min(miny, y - (outerHeight / 2));
        maxx = Math.max(maxx, x + (outerWidth / 2));
        maxy = Math.max(maxy, y + (outerHeight / 2));

        return true;
    };

    if (supportSlot.enabled && slotShape === 'circle') {
        const centerX = 0, centerY = 0;

        if (supportSlot.mode === 'circle') {
            const a = ((supportSlot.length / 2) + insetRadius) + borderWidth + 1;
            const b = ((supportSlot.width / 2) + insetRadius) + borderWidth + 1;

            let added = 0;
            const minSpacing = (2 * insetRadius) * 0.99;

            // Compute an estimated number of slots around the ellipse and sample
            // evenly spaced angles. Do a few placement passes with small angular
            // offsets to fill unavoidable gaps while preserving even spacing.
            const h = Math.pow((a - b), 2) / Math.pow((a + b), 2);
            const ellipseCircumference = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
            const minSpacingLocal = Math.max(minSpacing, (insetRadius + borderWidth) * 2 * 0.98);
            const estimatedSlots = Math.max(1, Math.floor(ellipseCircumference / minSpacingLocal));
            const angleStep = (2 * Math.PI) / estimatedSlots;

            const placementPasses = 3;
            for (let pass = 0; pass < placementPasses && added < supportSlot.count; pass++) {
                const startAngle = (pass / placementPasses) * (angleStep / placementPasses);
                const ringOffset = (pass % 2) * (angleStep / 2);

                for (let s = 0; s < estimatedSlots && added < supportSlot.count; s++) {
                    const angle = (startAngle + s * angleStep + ringOffset) % (Math.PI * 2);
                    const x = centerX + a * Math.cos(angle);
                    const y = centerY + b * Math.sin(angle);
                    const position = { x, y };

                    // ensure candidate inset doesn't overlap existing insets
                    const insetIntersectsExisting = circles.some(existing =>
                        areInsetAreasOverlapping(position, existing.position, insetRadius, existing.insetRadius || insetRadius)
                    );

                    // ensure candidate outer rim doesn't intrude into any existing inset
                    const outerIntrudesExisting = circles.some(existing =>
                        doesOuterIntrudeIntoInset(position, existing.position, insetRadius, borderWidth, existing.insetRadius || insetRadius)
                    );

                    const insetIntersects = doesInsetAreaIntersectOval(position, { x: centerX, y: centerY }, insetRadius, supportSlot.length, supportSlot.width);
                    const outerIntersects = doesInsetAreaIntersectOval(position, { x: centerX, y: centerY }, insetRadius + borderWidth, supportSlot.length, supportSlot.width);

                    if (!insetIntersectsExisting && !outerIntrudesExisting && !insetIntersects && !outerIntersects) {
                        addCircle(x, y, 0, added);
                        added++;
                    } else {
                        // Try a small outward nudge to see if we can preserve this sample slot
                        const nudged = nudgePositionAwayFromOval(x, y, circles, insetRadius, borderWidth, supportSlot, { maxDistance: (insetRadius + borderWidth) * 2, step: 0.4, angleSteps: 24, jitterAttempts: 30 });
                        if (nudged && !areInsetAreasOverlapping(nudged, { x: centerX, y: centerY }, insetRadius, insetRadius)) {
                            if (addCircle(nudged.x, nudged.y, 0, added)) {
                                added++;
                            }
                        }
                    }
                }
            }

            // Relax placements to even them out against each other
            if (circles.length > 0) {
                relaxPositions(circles, insetRadius, borderWidth, supportSlot, { iterations: 12, stepFactor: 0.26, maxMove: 0.9 });
            }

            points.push(new Vector2(centerX, centerY));

            // Expansion: iteratively add slots at intersections between existing outer rims
            // to produce a honeycomb/hex packing. This continues until no further valid
            // candidates can be found or a safety cap is reached. If `supportSlot.unlimited`
            // is true, we grow until caps; otherwise we stop when we reach requested count.
            const target = (supportSlot && (supportSlot.unlimited || (supportSlot.count <= 0))) ? Infinity : (supportSlot.count || 0);
            const safetyMaxSlots = (supportSlot && typeof supportSlot.maxSlots === 'number') ? supportSlot.maxSlots : 1200;
            const maxIterations = 500;

            let iter = 0;
            while ((added < target || target === Infinity) && iter < maxIterations && circles.length < safetyMaxSlots) {
                let addedThisIter = 0;
                const snapshot = circles.slice();

                for (let i = 0; i < snapshot.length && (added < target || target === Infinity) && circles.length < safetyMaxSlots; i++) {
                    for (let j = i + 1; j < snapshot.length && (added < target || target === Infinity) && circles.length < safetyMaxSlots; j++) {
                        const c1 = snapshot[i];
                        const c2 = snapshot[j];

                        const newOuter = insetRadius + borderWidth;
                        const ex1Outer = (c1.insetRadius || insetRadius) + (c1.borderWidth || borderWidth);
                        const ex2Outer = (c2.insetRadius || insetRadius) + (c2.borderWidth || borderWidth);
                        const r1 = ex1Outer + newOuter;
                        const r2 = ex2Outer + newOuter;

                        const pts = circleIntersections(c1.position.x, c1.position.y, r1, c2.position.x, c2.position.y, r2);
                        if (!pts || pts.length === 0) continue;

                        // prefer the outward-facing intersection to form rings
                        pts.sort((pA, pB) => (Math.hypot(pB.x, pB.y) - Math.hypot(pA.x, pA.y)));

                        for (const cand of pts) {
                            // avoid inset intrusion
                            if (circles.some(ex => areInsetAreasOverlapping({ x: cand.x, y: cand.y }, ex.position, insetRadius, ex.insetRadius || insetRadius))) continue;
                            if (doesInsetAreaIntersectOval({ x: cand.x, y: cand.y }, { x: centerX, y: centerY }, insetRadius, supportSlot.length, supportSlot.width)) continue;

                            // ensure candidate outer rim doesn't intrude into any existing inset
                            if (circles.some(ex => doesOuterIntrudeIntoInset({ x: cand.x, y: cand.y }, ex.position, insetRadius, borderWidth, ex.insetRadius || insetRadius))) continue;

                            // skip near-duplicates
                            if (circles.some(ex => Math.hypot(ex.position.x - cand.x, ex.position.y - cand.y) < (insetRadius * 0.45))) continue;

                            // validate against outer-overlaps
                            if (!canAddCircle(cand.x, cand.y, null, null, circles, insetRadius, borderWidth, supportSlot, true)) continue;

                            const pairRow = Math.max(typeof c1.row === 'number' ? c1.row : 0, typeof c2.row === 'number' ? c2.row : 0) + 1;
                            const ok = addCircle(cand.x, cand.y, pairRow, added);
                            if (ok) {
                                added++;
                                addedThisIter++;
                                break;
                            }
                        }
                    }
                }

                if (addedThisIter === 0) break;
                iter++;
            }
        } else {
            // Oval mode
            placeEvenCirclesAlongOval(
                { x: 0, y: 0 },
                supportSlot.length / 2,
                supportSlot.width / 2,
                supportSlot.count,
                circleOuterRadius + 1,
                (x, y, i) => {
                    addCircle(x, y, i);
                },
                circleOuterRadius + insetRadius
            );
        }
    } else if (triangleFormation) {
        for (let row = 0; row < rows; row++) {
            const cols = row + 1;
            const rowWidth = cols * xOffset;

            for (let col = 0; col < cols; col++) {
                // Center the row horizontally
                const x = col * xOffset - rowWidth / 2 + xOffset / 2;
                const y = row * yOffset;
                addCircle(x, y, row, col);
            }
        }
    } else {
        for (let row = 0; row < rows; row++) {
            const isStaggeredRow = stagger && row % 2 === 1;
            let effectiveCols = cols;
            if (straySlot && isStaggeredRow) {
                effectiveCols -= 1;
            }

            for (let col = 0; col < effectiveCols; col++) {
                let x = col * xOffset;
                if (isStaggeredRow) x += xOffset / 2;
                const y = row * yOffset;
                addCircle(x, y, row, col);
            }
        }
    }

    const bounds = Number.isFinite(minx)
        ? { min: { x: minx, y: miny }, max: { x: maxx, y: maxy } }
        : null;

    return { circles, points, bounds };
}
