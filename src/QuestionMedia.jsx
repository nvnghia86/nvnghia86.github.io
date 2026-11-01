import React from 'react';
import { useTranslation } from 'react-i18next';
import GeometryDiagram from './GeometryDiagram';
import './question-media.css';

export default function QuestionMedia({ question }) {
  const { t } = useTranslation();
  if (!question) return null;
  const source = question.imageUrl || question.geometry?.imageUrl;
  const image = typeof source === 'string' && /^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,|\/[^/])/i.test(source) ? source : null;
  if (!image && !question.geometry?.elements?.length) return null;
  return <div className="question-media">{image && <img src={image} alt={t('ai.geometryAlt')} />}
    <GeometryDiagram geometry={question.geometry} ariaLabel={t('ai.geometryAlt')} />
  </div>;
}
