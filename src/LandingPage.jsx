import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './landing-page.css';

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="eyebrow">{t('landing.eyebrow')}</p>
          <h1>{t('landing.title')}</h1>
          <p className="landing-lead">{t('landing.description')}</p>
          <div className="landing-actions">
            <button className="primary-button" type="button" onClick={() => navigate('/student')}>
              {t('landing.quizCta')}
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate('/student/typing')}>
              {t('landing.typingCta')}
            </button>
          </div>
        </div>
        <div className="landing-hero-art" aria-hidden="true">
          <div className="landing-orbit landing-orbit-one" />
          <div className="landing-orbit landing-orbit-two" />
          <div className="landing-hero-card landing-hero-card-main"><span>✦</span><b>quizzz</b><small>{t('landing.cardCaption')}</small></div>
          <div className="landing-float landing-float-quiz">⚡ <span>{t('landing.quizBadge')}</span></div>
          <div className="landing-float landing-float-typing">⌨ <span>{t('landing.typingBadge')}</span></div>
        </div>
      </section>

      <section className="landing-feature-grid">
        <article className="landing-feature-card landing-feature-quiz">
          <div className="landing-feature-icon">◉</div>
          <p className="eyebrow">{t('landing.quizEyebrow')}</p>
          <h2>{t('landing.quizTitle')}</h2>
          <p>{t('landing.quizDescription')}</p>
          <button className="text-button" type="button" onClick={() => navigate('/student/room')}>
            {t('landing.quizLink')} →
          </button>
        </article>
        <article className="landing-feature-card landing-feature-typing">
          <div className="landing-feature-icon">⌨</div>
          <p className="eyebrow">{t('landing.typingEyebrow')}</p>
          <h2>{t('landing.typingTitle')}</h2>
          <p>{t('landing.typingDescription')}</p>
          <button className="text-button" type="button" onClick={() => navigate('/student/typing')}>
            {t('landing.typingLink')} →
          </button>
        </article>
      </section>

      <section className="landing-trust-row">
        <span>{t('landing.trustOne')}</span>
        <span>{t('landing.trustTwo')}</span>
        <span>{t('landing.trustThree')}</span>
      </section>
    </main>
  );
}
