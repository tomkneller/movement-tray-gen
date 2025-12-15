// BaseBuilder.js
import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import concaveman from 'concaveman';

export function buildBase({
    circles,
    supportSlot,
    baseThickness,
    borderWidth,
    depth = 2,
    straySlot,
    rows,
    cols
}) {
    const circleOuterRadius = circles[0]?.insetRadius + borderWidth;

    const outerPath = buildPerimeter(circles, rows, cols, straySlot, supportSlot.enabled, supportSlot.mode);

    let baseMesh;
    if (outerPath.length > 2) {
        const shape = new THREE.Shape();
        shape.moveTo(outerPath[0].x, outerPath[0].y);
        for (let i = 1; i < outerPath.length; i++) {
            shape.lineTo(outerPath[i].x, outerPath[i].y);
        }
        shape.lineTo(outerPath[0].x, outerPath[0].y); // Close the loop

        const baseShapeGeometry = new THREE.ExtrudeGeometry(shape, {
            depth,
            bevelEnabled: false,
        });
        baseShapeGeometry.translate(0, 0, 0);
        baseMesh = new THREE.Mesh(baseShapeGeometry);
    } else {
        const bounds = new THREE.Box3().setFromPoints(circles.map(c => new THREE.Vector3(c.position.x, c.position.y, 0)));
        const size = new THREE.Vector3();
        bounds.getSize(size);
        const baseGeom = new THREE.BoxGeometry(size.x, size.y, depth);
        baseGeom.translate(bounds.min.x + size.x / 2, bounds.min.y + size.y / 2, depth / 2);
        baseMesh = new THREE.Mesh(baseGeom);
    }

    let csgResult = CSG.fromMesh(baseMesh);

    for (const circle of circles) {
        const holeGeom = new THREE.CylinderGeometry(circleOuterRadius, circleOuterRadius, depth * 2, 64);
        holeGeom.rotateX(Math.PI / 2);
        holeGeom.translate(circle.position.x, circle.position.y, depth / 2);
        const holeMesh = new THREE.Mesh(holeGeom);
        csgResult = csgResult.subtract(CSG.fromMesh(holeMesh));
    }

    if (supportSlot.enabled) {
        const supportSlotShape = new THREE.Shape();
        supportSlotShape.absellipse(0, 0, (supportSlot.length / 2) + borderWidth, (supportSlot.width / 2) + borderWidth, 0, Math.PI * 2);
        const supportSlotGeometry = new THREE.ExtrudeGeometry(supportSlotShape, { depth, bevelEnabled: false });
        const supportSlotMesh = new THREE.Mesh(supportSlotGeometry);
        csgResult = csgResult.subtract(CSG.fromMesh(supportSlotMesh));
    }

    const finalBaseMesh = CSG.toMesh(csgResult, baseMesh.matrix, baseMesh.material);
    return finalBaseMesh;
}

function buildPerimeter(circles, rows, cols, straySlot, supportEnabled, supportSlotMode) {
    if (!circles || circles.length === 0) return [];

    // First compute a concave hull over the circle centers to determine the
    // ordered outer boundary circles.
    const centerPts = circles.map(c => [c.position.x, c.position.y]);
    const hullCenters = concaveman(centerPts, 2, 0);
    if (!hullCenters || hullCenters.length < 3) {
        // fallback: use a simple concave hull over sampled rims (previous approach)
        const samplesPerCircle = 18;
        const pts = [];
        for (const c of circles) {
            const r = (c.insetRadius || 0) + (c.borderWidth || 0);
            for (let i = 0; i < samplesPerCircle; i++) {
                const a = (i / samplesPerCircle) * Math.PI * 2;
                pts.push([c.position.x + Math.cos(a) * r, c.position.y + Math.sin(a) * r]);
            }
        }
        const fallbackHull = concaveman(pts, 2, 0);
        if (!fallbackHull || fallbackHull.length < 3) return circles.map(c => new THREE.Vector2(c.position.x, c.position.y));
        return fallbackHull.map(p => new THREE.Vector2(p[0], p[1]));
    }

    // Map hull center points back to circle indices (unique, in order)
    const hullIndices = [];
    for (const p of hullCenters) {
        let bestIdx = -1;
        let bestD = Infinity;
        for (let i = 0; i < circles.length; i++) {
            const c = circles[i];
            const dx = c.position.x - p[0];
            const dy = c.position.y - p[1];
            const d = dx * dx + dy * dy;
            if (d < bestD) {
                bestD = d;
                bestIdx = i;
            }
        }
        if (bestIdx !== -1) {
            if (hullIndices.length === 0 || hullIndices[hullIndices.length - 1] !== bestIdx) {
                hullIndices.push(bestIdx);
            }
        }
    }

    // Build perimeter points by joining closest rim points between adjacent hull circles.
    // If the gap between two adjacent hull circles is large, instead connect each outer
    // circle to its nearest neighbor (often an inner circle) to minimize overhang.
    const perimeter = [];
    const len = hullIndices.length;
    for (let k = 0; k < len; k++) {
        const i1 = hullIndices[k];
        const i2 = hullIndices[(k + 1) % len];
        const A = circles[i1];
        const B = circles[i2];

        const outerA = (A.insetRadius || 0) + (A.borderWidth || 0);
        const outerB = (B.insetRadius || 0) + (B.borderWidth || 0);

        const dx = B.position.x - A.position.x;
        const dy = B.position.y - A.position.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1e-6) continue;
        const ux = dx / d;
        const uy = dy / d;

        const gapThreshold = (outerA + outerB) * 1.6;
        if (d <= gapThreshold) {
            const pA = new THREE.Vector2(A.position.x + ux * outerA, A.position.y + uy * outerA);
            const pB = new THREE.Vector2(B.position.x - ux * outerB, B.position.y - uy * outerB);
            perimeter.push(pA);
            perimeter.push(pB);
            continue;
        }

        // Large gap: find nearest neighbor for each hull circle (prefer interior circles)
        const findNearest = (idx) => {
            let best = -1;
            let bestD = Infinity;
            for (let t = 0; t < circles.length; t++) {
                if (t === idx) continue;
                const cc = circles[t];
                const ddx = cc.position.x - circles[idx].position.x;
                const ddy = cc.position.y - circles[idx].position.y;
                const dd = Math.sqrt(ddx * ddx + ddy * ddy);
                if (dd < bestD) { bestD = dd; best = t; }
            }
            return best;
        };

        const na = findNearest(i1);
        const nb = findNearest(i2);

        const pA_alt = na !== -1 ? (() => {
            const T = circles[na];
            const dx2 = T.position.x - A.position.x;
            const dy2 = T.position.y - A.position.y;
            const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1e-6;
            const ux2 = dx2 / d2;
            const uy2 = dy2 / d2;
            return new THREE.Vector2(A.position.x + ux2 * outerA, A.position.y + uy2 * outerA);
        })() : new THREE.Vector2(A.position.x + ux * outerA, A.position.y + uy * outerA);

        const pB_alt = nb !== -1 ? (() => {
            const T = circles[nb];
            const dx2 = T.position.x - B.position.x;
            const dy2 = T.position.y - B.position.y;
            const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1e-6;
            const ux2 = dx2 / d2;
            const uy2 = dy2 / d2;
            return new THREE.Vector2(B.position.x + ux2 * outerB, B.position.y + uy2 * outerB);
        })() : new THREE.Vector2(B.position.x - ux * outerB, B.position.y - uy * outerB);

        perimeter.push(pA_alt);
        perimeter.push(pB_alt);
    }

    // Remove near-duplicate consecutive points
    const cleaned = [];
    for (let i = 0; i < perimeter.length; i++) {
        const p = perimeter[i];
        const prev = cleaned[cleaned.length - 1];
        if (!prev || prev.distanceToSquared(p) > 1e-6) cleaned.push(p);
    }

    // Final check: ensure polygon has at least 3 points
    if (cleaned.length < 3) return circles.map(c => new THREE.Vector2(c.position.x, c.position.y));
    return cleaned;
}

// Compute perimeter and return debug information useful for visualization/inspection.
export function computePerimeterDebug(circles) {
    if (!circles || circles.length === 0) return { perimeter: [], hullCenters: [], hullIndices: [], rimSamples: [], triangles: [], connectors: [] };

    // reuse existing logic: compute centers hull, rim samples, connectors and triangles
    const centerPts = circles.map(c => [c.position.x, c.position.y]);
    const hullCenters = concaveman(centerPts, 2, 0);

    // Map centers back to indices
    const hullIndices = [];
    for (const p of hullCenters) {
        let bestIdx = -1;
        let bestD = Infinity;
        for (let i = 0; i < circles.length; i++) {
            const c = circles[i];
            const dx = c.position.x - p[0];
            const dy = c.position.y - p[1];
            const d = dx * dx + dy * dy;
            if (d < bestD) { bestD = d; bestIdx = i; }
        }
        if (bestIdx !== -1) {
            if (hullIndices.length === 0 || hullIndices[hullIndices.length - 1] !== bestIdx) hullIndices.push(bestIdx);
        }
    }

    const samplesPerCircle = 12;
    const rimSamples = circles.map(c => {
        const r = (c.insetRadius || 0) + (c.borderWidth || 0);
        const arr = [];
        for (let i = 0; i < samplesPerCircle; i++) {
            const a = (i / samplesPerCircle) * Math.PI * 2;
            arr.push([c.position.x + Math.cos(a) * r, c.position.y + Math.sin(a) * r]);
        }
        return arr;
    });

    // Triangles (reuse circumcenter logic)
    function circumcenter(ax, ay, bx, by, cx, cy) {
        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 1e-9) return null;
        const ax2 = ax * ax + ay * ay;
        const bx2 = bx * bx + by * by;
        const cx2 = cx * cx + cy * cy;
        const ux = (ax2 * (by - cy) + bx2 * (cy - ay) + cx2 * (ay - by)) / d;
        const uy = (ax2 * (cx - bx) + bx2 * (ax - cx) + cx2 * (bx - ax)) / d;
        return [ux, uy];
    }

    const triangles = [];
    const n = circles.length;
    for (let i = 0; i < n - 2; i++) {
        for (let j = i + 1; j < n - 1; j++) {
            for (let k = j + 1; k < n; k++) {
                const A = circles[i].position;
                const B = circles[j].position;
                const C = circles[k].position;
                const cc = circumcenter(A.x, A.y, B.x, B.y, C.x, C.y);
                if (!cc) continue;
                const cx = cc[0], cy = cc[1];

                const rA = Math.hypot(cx - A.x, cy - A.y);
                const rB = Math.hypot(cx - B.x, cy - B.y);
                const rC = Math.hypot(cx - C.x, cy - C.y);
                const avgR = (rA + rB + rC) / 3;

                const outerA = (circles[i].insetRadius || 0) + (circles[i].borderWidth || 0);
                const outerB = (circles[j].insetRadius || 0) + (circles[j].borderWidth || 0);
                const outerC = (circles[k].insetRadius || 0) + (circles[k].borderWidth || 0);

                if (!(rA > outerA + 1e-6 && rB > outerB + 1e-6 && rC > outerC + 1e-6)) continue;

                let blocked = false;
                for (let m = 0; m < n; m++) {
                    const om = (circles[m].insetRadius || 0) + (circles[m].borderWidth || 0);
                    if (Math.hypot(cx - circles[m].position.x, cy - circles[m].position.y) < om - 1e-6) { blocked = true; break; }
                }
                if (blocked) continue;

                const maxOuter = Math.max(outerA, outerB, outerC);
                if (avgR < maxOuter * 0.6) continue;

                const pA = new THREE.Vector2(circles[i].position.x + (cx - circles[i].position.x) / rA * outerA, circles[i].position.y + (cy - circles[i].position.y) / rA * outerA);
                const pB = new THREE.Vector2(circles[j].position.x + (cx - circles[j].position.x) / rB * outerB, circles[j].position.y + (cy - circles[j].position.y) / rB * outerB);
                const pC = new THREE.Vector2(circles[k].position.x + (cx - circles[k].position.x) / rC * outerC, circles[k].position.y + (cy - circles[k].position.y) / rC * outerC);

                triangles.push({ i, j, k, pA, pB, pC, center: new THREE.Vector2(cx, cy) });
            }
        }
    }

    // Compute perimeter using existing function
    const perimeter = buildPerimeter(circles);

    // Compute connectors (as in buildPerimeter logic)
    const hullPoly = concaveman(perimeter.map(p => [p.x, p.y]), 2, 0) || hullCenters;
    const disconnected = [];
    for (let i = 0; i < circles.length; i++) {
        const rim = rimSamples[i];
        const covered = rim.some(pt => {
            let inside = false;
            for (let a = 0, b = hullPoly.length - 1; a < hullPoly.length; b = a++) {
                const xi = hullPoly[a][0], yi = hullPoly[a][1];
                const xj = hullPoly[b][0], yj = hullPoly[b][1];
                const intersect = ((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi + 1e-12) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        });
        if (!covered) disconnected.push(i);
    }

    const connectors = [];
    for (const di of disconnected) {
        if (hullIndices.includes(di)) continue;
        let best = -1; let bestD = Infinity;
        for (const hi of hullIndices) {
            const dx = circles[hi].position.x - circles[di].position.x;
            const dy = circles[hi].position.y - circles[di].position.y;
            const d = Math.hypot(dx, dy);
            if (d < bestD) { bestD = d; best = hi; }
        }
        if (best === -1) continue;
        const A = circles[di];
        const B = circles[best];
        const outerA = (A.insetRadius || 0) + (A.borderWidth || 0);
        const outerB = (B.insetRadius || 0) + (B.borderWidth || 0);
        const dx = B.position.x - A.position.x;
        const dy = B.position.y - A.position.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
        const ux = dx / d;
        const uy = dy / d;
        const pA = new THREE.Vector2(A.position.x + ux * outerA, A.position.y + uy * outerA);
        const pB = new THREE.Vector2(B.position.x - ux * outerB, B.position.y - uy * outerB);
        connectors.push({ di, best, pA, pB });
    }

    return { perimeter, hullCenters, hullIndices, rimSamples, triangles, connectors };
}
