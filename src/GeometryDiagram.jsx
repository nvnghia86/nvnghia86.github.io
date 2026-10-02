import React, { useEffect, useRef } from 'react';
import JXG from 'jsxgraph';
import './geometry-diagram.css';
import i18n from './i18n';

const DEFAULT_BOX = [-6, 6, 6, -6];
const colors = { strokeColor: '#16aee5', fillColor: '#dff6ff', fillOpacity: 0.35 };

function attrs(element) {
  return {
    ...colors,
    strokeWidth: 2,
    fixed: true,
    withLabel: Boolean(element.label),
    name: element.label || '',
    strokeColor: element.strokeColor || colors.strokeColor,
    fillColor: element.fillColor || colors.fillColor,
    fillOpacity: element.fillOpacity ?? colors.fillOpacity,
  };
}

function createElement(board, element, points) {
  const options = attrs(element);
  const refs = (element.points || []).map(id => points.get(id)).filter(Boolean);
  if (element.type === 'point' && Array.isArray(element.coords)) {
    const point = board.create('point', element.coords, { ...options, name: element.label || element.id, withLabel: Boolean(element.label), size: 3 });
    points.set(element.id, point);
    return point;
  }
  if (element.type === 'segment' && refs.length >= 2) return board.create('segment', refs.slice(0, 2), options);
  if (element.type === 'line' && refs.length >= 2) return board.create('line', refs.slice(0, 2), options);
  if (element.type === 'polygon' && refs.length >= 3) return board.create('polygon', refs, options);
  if (element.type === 'angle' && refs.length >= 3) return board.create('angle', refs.slice(0, 3), options);
  if (element.type === 'circle') {
    const center = points.get(element.center) || refs[0];
    if (center) return board.create('circle', [center, Number(element.radius) || 1], options);
  }
  if (element.type === 'text' && Array.isArray(element.coords)) return board.create('text', element.coords, String(element.text || ''), { ...options, fixed: true });
  return null;
}

export default function GeometryDiagram({ geometry, className = '', ariaLabel }) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !geometry?.elements?.length) return undefined;
    const board = JXG.JSXGraph.initBoard(containerRef.current, {
      boundingbox: Array.isArray(geometry.boundingBox) && geometry.boundingBox.length === 4 ? geometry.boundingBox : DEFAULT_BOX,
      axis: Boolean(geometry.axis),
      grid: Boolean(geometry.grid),
      keepaspectratio: true,
      showNavigation: false,
      showCopyright: false,
      pan: { enabled: false },
      zoom: { enabled: false },
    });
    const points = new Map();
    geometry.elements.filter(element => element?.type === 'point').forEach(element => createElement(board, element, points));
    geometry.elements.filter(element => element?.type !== 'point').forEach(element => createElement(board, element, points));
    board.fullUpdate();
    return () => JXG.JSXGraph.freeBoard(board);
  }, [geometry]);
  if (!geometry?.elements?.length) return null;
  return <div className={`geometry-diagram ${className}`} ref={containerRef} role="img" aria-label={ariaLabel || i18n.t('ai.geometryAlt')} />;
}
