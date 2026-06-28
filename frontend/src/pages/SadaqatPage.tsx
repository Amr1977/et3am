import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function SadaqatPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ type: 'money', amount: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState<'phone' | 'crypto' | null>(null);

  const handleCopy = async (text: string, type: 'phone' | 'crypto') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ type: 'money', amount: '', message: '' });
    setTimeout(() => setSubmitted(false), 4000);
  };

  const types = [
    { value: 'money', label: t('sadaqat.type_money') || 'Money' },
    { value: 'food', label: t('sadaqat.type_food') || 'Food' },
    { value: 'clothes', label: t('sadaqat.type_clothes') || 'Clothes' },
    { value: 'other', label: t('sadaqat.type_other') || 'Other' },
  ];

  return (
    <div className="sadaqat-page">
      <Link to="/" className="support-back-link">← {t('common.back')}</Link>

      <section className="sadaqat-hero">
        <div className="sadaqat-hero-icon">🤲</div>
        <h1 className="sadaqat-hero-title">{t('sadaqat.title')}</h1>
        <p className="sadaqat-hero-ayah">
          ﴿مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ فِي كُلِّ سُنْبُلَةٍ مِّائَةُ حَبَّةٍ ۗ وَاللَّهُ يُضَاعِفُ لِمَن يَشَاءُ ۗ وَاللَّهُ وَاسِعٌ عَلِيمٌ﴾
        </p>
        <p className="sadaqat-hear-ref">— سورة البقرة ٢:٢٦١</p>
        <p className="sadaqat-hero-desc">{t('sadaqat.hero_desc')}</p>
      </section>

      <section className="sadaqat-benefits">
        <h2 className="section-title">{t('sadaqat.benefits_title')}</h2>
        <div className="sadaqat-grid">
          <div className="sadaqat-benefit-card">
            <span className="benefit-icon">📿</span>
            <h3>{t('sadaqat.benefit_1_title')}</h3>
            <p>{t('sadaqat.benefit_1_desc')}</p>
          </div>
          <div className="sadaqat-benefit-card">
            <span className="benefit-icon">🌱</span>
            <h3>{t('sadaqat.benefit_2_title')}</h3>
            <p>{t('sadaqat.benefit_2_desc')}</p>
          </div>
          <div className="sadaqat-benefit-card">
            <span className="benefit-icon">💎</span>
            <h3>{t('sadaqat.benefit_3_title')}</h3>
            <p>{t('sadaqat.benefit_3_desc')}</p>
          </div>
          <div className="sadaqat-benefit-card">
            <span className="benefit-icon">🕊️</span>
            <h3>{t('sadaqat.benefit_4_title')}</h3>
            <p>{t('sadaqat.benefit_4_desc')}</p>
          </div>
        </div>
      </section>

      <section className="sadaqat-payment">
        <div className="support-dev-container">
          <div className="support-dev-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <h2 className="support-dev-title">{t('home.support_dev_title')}</h2>
          <p className="support-dev-desc">{t('home.support_dev_desc')}</p>

          <div className="support-phone-group">
            <div className="support-phone-section">
              <span className="support-phone-label">{t('home.support_phone')}</span>
              <div className="support-phone-display">
                <span className="support-phone-number">01094450141</span>
                <button className="copy-btn" onClick={() => handleCopy('01094450141', 'phone')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  <span>{copied === 'phone' ? (t('common.copied') || 'Copied!') : t('home.support_copy')}</span>
                </button>
              </div>
            </div>

            <div className="support-methods-list">
              <div className="support-method-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="5" width="18" height="14" rx="2"/>
                  <path d="M3 10h18"/>
                </svg>
                <span>Instapay</span>
              </div>
              <div className="support-method-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
                <span>Vodafone Cash</span>
              </div>
            </div>
          </div>

          <div className="support-crypto-section">
            <span className="support-crypto-label">{t('home.support_crypto')}</span>
            <div className="support-crypto-display">
              <span className="support-crypto-number">TACcgwLC4GeKzKGLWz14tiVahnpftHre1H</span>
              <button className="copy-btn" onClick={() => handleCopy('TACcgwLC4GeKzKGLWz14tiVahnpftHre1H', 'crypto')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                <span>{copied === 'crypto' ? (t('common.copied') || 'Copied!') : t('home.support_copy')}</span>
              </button>
            </div>
            <span className="support-crypto-network">{t('home.support_crypto_network')}</span>
          </div>

          <p className="support-dev-thanks">{t('home.support_thanks')}</p>
        </div>
      </section>

      <section className="sadaqat-form-section">
        <h2 className="section-title">{t('sadaqat.form_title')}</h2>
        <p className="section-desc">{t('sadaqat.form_desc')}</p>

        {submitted ? (
          <div className="sadaqat-success">
            <span className="sadaqat-success-icon">✅</span>
            <h3>{t('sadaqat.success_title')}</h3>
            <p>{t('sadaqat.success_desc')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="sadaqat-form">
            <div className="form-group">
              <label>{t('sadaqat.type_label')}</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="form-input"
              >
                {types.map(tp => (
                  <option key={tp.value} value={tp.value}>{tp.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{t('sadaqat.amount_label')}</label>
              <input
                type="text"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="form-input"
                placeholder={t('sadaqat.amount_placeholder')}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('sadaqat.message_label')}</label>
              <textarea
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                className="form-input"
                rows={3}
                placeholder={t('sadaqat.message_placeholder')}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              {t('sadaqat.submit_btn')}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
