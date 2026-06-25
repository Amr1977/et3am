import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function About() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = 'من نحن | إطعام Et3am';
    const meta = document.querySelector('meta[property="og:description"]');
    if (meta) {
      meta.setAttribute('content', 'إطعام — منصة إسلامية لتبادل الطعام الفائض. مفتوحة المصدر، مجانية، تعمل على قيم الصدقة والإطعام.');
    }
  }, []);

  return (
    <div className="about-page">
      {/* Section 1 — Mission */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1 className="about-hero-title">لماذا إطعام؟</h1>
          <p className="about-hero-subtitle">
            كل يوم، يُهدَر طعام كافٍ لإطعام الملايين بينما يعاني آخرون من الجوع. إطعام يربط بين الطرفين.
          </p>
          <blockquote className="about-verse">
            ﴿وَيُطْعِمُونَ الطَّعَامَ عَلَى حُبِّهِ مِسْكِينًا وَيَتِيمًا وَأَسِيرًا﴾ — سورة الإنسان
          </blockquote>
        </div>
      </section>

      {/* Section 2 — How it works */}
      <section className="about-section">
        <div className="about-section-container">
          <h2 className="about-section-title">{t('home.how_it_works')}</h2>
          <div className="steps-flow">
            <div className="step-flow-card donor">
              <div className="step-flow-icon">🍽️</div>
              <div className="step-flow-number">1</div>
              <h3>{t('home.step_1_title')}</h3>
              <p>{t('home.step_1_desc')}</p>
              <span className="step-flow-role">{t('home.donor') || 'Donor'}</span>
            </div>

            <div className="step-flow-arrow">{t('home.arrow')}</div>

            <div className="step-flow-card receiver">
              <div className="step-flow-icon">🔍</div>
              <div className="step-flow-number">2</div>
              <h3>{t('home.step_2_title')}</h3>
              <p>{t('home.step_2_desc')}</p>
              <span className="step-flow-role">{t('home.receiver') || 'Receiver'}</span>
            </div>

            <div className="step-flow-arrow">{t('home.arrow')}</div>

            <div className="step-flow-card pickup">
              <div className="step-flow-icon">🤲</div>
              <div className="step-flow-number">3</div>
              <h3>{t('home.step_3_title')}</h3>
              <p>{t('home.step_3_desc')}</p>
              <span className="step-flow-role">{t('home.pickup') || 'Pickup'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Values */}
      <section className="about-section about-section-alt">
        <div className="about-section-container">
          <h2 className="about-section-title">قيمنا</h2>
          <div className="about-values">
            <div className="about-value-card">
              <div className="about-value-icon">🔒</div>
              <h3>الخصوصية أولاً</h3>
              <p>لا يتم تبادل أي معلومات شخصية بين المتبرع والمتلقي</p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">📖</div>
              <h3>مفتوح المصدر</h3>
              <p>الكود مفتوح بالكامل على GitHub — شفافية تامة</p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">🕌</div>
              <h3>إسلامي بالجوهر</h3>
              <p>مبني على قيم الصدقة والإطعام في الإسلام</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Founder */}
      <section className="about-section">
        <div className="about-section-container about-founder">
          <h2 className="about-section-title">المؤسس</h2>
          <p className="about-founder-text">
            بناه Amr Lotfy — مطور مستقل من الإسكندرية، مصر
          </p>
          <a
            href="https://amrlotfy.et3am.com"
            target="_blank"
            rel="noopener noreferrer"
            className="about-founder-link"
          >
            amrlotfy.et3am.com
          </a>
        </div>
      </section>

      {/* Section 5 — CTA */}
      <section className="about-section about-section-cta">
        <div className="about-section-container">
          <div className="about-cta-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              ابدأ الإطعام
            </Link>
            <Link to="/donations" className="btn btn-outline btn-lg">
              تصفح التبرعات
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
