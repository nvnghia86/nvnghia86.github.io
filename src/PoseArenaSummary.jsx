import React from 'react';
import { useTranslation } from 'react-i18next';

export default function PoseArenaSummary({ correctCount = 0, questionCount = 0, score = null, players = [], onExit }) {
  const { t, i18n } = useTranslation();
  const total = Math.max(0, Number(questionCount) || 0);
  const correct = Math.max(0, Number(correctCount) || 0);
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN';

  return <main className="pose-final-summary" aria-label={t('poseArena:summaryTitle')}>
    <span className="pose-final-trophy" aria-hidden="true">🏆</span>
    <p className="eyebrow">{t('poseArena:summaryEyebrow')}</p>
    <h2>{t('poseArena:summaryTitle')}</h2>
    <p>{t('poseArena:summarySubtitle')}</p>
    <div className="pose-final-result">
      <strong>{correct.toLocaleString(locale)}</strong>
      <span>/ {total.toLocaleString(locale)}</span>
      <small>{t('poseArena:summaryCorrectUnit')}</small>
    </div>
    <div className="pose-final-stats">
      <span><b>{accuracy.toLocaleString(locale)}%</b>{t('poseArena:summaryAccuracy')}</span>
      {score !== null && <span><b>{Number(score || 0).toLocaleString(locale)}</b>{t('poseArena:summaryScore')}</span>}
    </div>
    {players.length > 0 && <section className="pose-final-players">
      <h3>{t('poseArena:summaryPlayers')}</h3>
      <div>{players.map((player, index) => <article key={player.id || `${player.nickname}-${index}`}>
        <b>#{index + 1}</b>
        <span>{player.nickname}</span>
        <strong>{t('poseArena:summaryPlayerRatio', { correct: Number(player.correctCount || 0), total })}</strong>
      </article>)}</div>
    </section>}
    {onExit && <button className="pose-primary" type="button" onClick={onExit}>{t('poseArena:summaryExit')}</button>}
  </main>;
}
