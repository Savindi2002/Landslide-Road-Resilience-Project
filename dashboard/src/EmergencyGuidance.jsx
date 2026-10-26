
import { useState } from 'react';

const guidance = {
  en: {
    title: 'Landslide Emergency Guidance',
    subtitle: 'Your safety comes first',
    danger: 'Warning signs',
    signs: [
      'New cracks in the ground, roads, or walls',
      'Trees, poles, or fences beginning to tilt',
      'Unusual water flow, muddy water, or falling rocks',
      'Rumbling sounds or sudden ground movement',
    ],
    actions: 'What should you do?',
    steps: [
      'Move away from slopes and areas showing warning signs.',
      'Follow official evacuation instructions immediately.',
      'Do not cross landslide debris or blocked roads.',
      'Warn others only if you can do so safely.',
      'Contact emergency services when needed.',
    ],
    emergency: 'Emergency contacts',
    disclaimer:
      'This guidance does not predict landslides. Follow official alerts and instructions from authorities.',
    dmc: 'Disaster Management Centre',
    ambulance: 'Suwa Seriya Ambulance',
  },
  si: {
    title: 'නායයෑම් හදිසි ආරක්ෂක උපදෙස්',
    subtitle: 'ඔබගේ ආරක්ෂාව පළමුව',
    danger: 'අවදානම් ලක්ෂණ',
    signs: [
      'පොළොවේ, මාර්ගවල හෝ බිත්තිවල අලුත් ඉරිතැලීම්',
      'ගස්, විදුලි කණු හෝ වැට ඇලවීමට පටන් ගැනීම',
      'අසාමාන්‍ය ජල ගැලීම්, මඩ සහිත ජලය හෝ ගල් වැටීම',
      'ගර්ජනා වැනි ශබ්ද හෝ හදිසි පොළොව චලනය',
    ],
    actions: 'ඔබ කළ යුත්තේ කුමක්ද?',
    steps: [
      'බෑවුම් සහ අවදානම් ලක්ෂණ පෙනෙන ප්‍රදේශවලින් ඉවත් වන්න.',
      'නිල වශයෙන් ඉවත් වන ලෙස දැනුම් දුන් විට වහාම එය පිළිපදින්න.',
      'නායයෑම් සුන්බුන් හෝ අවහිර වූ මාර්ග හරහා ගමන් නොකරන්න.',
      'ඔබගේ ආරක්ෂාවට අවදානමක් නොමැති නම් අනෙක් අයට දැනුම් දෙන්න.',
      'අවශ්‍ය විට හදිසි සේවා අමතන්න.',
    ],
    emergency: 'හදිසි දුරකථන අංක',
    disclaimer:
      'මෙම උපදෙස් මඟින් නායයෑම් පුරෝකථනය නොකරයි. නිල අනතුරු ඇඟවීම් සහ බලධාරීන්ගේ උපදෙස් පිළිපදින්න.',
    dmc: 'ආපදා කළමනාකරණ මධ්‍යස්ථානය',
    ambulance: 'සුවසැරිය ගිලන් රථ සේවය',
  },
};

export default function EmergencyGuidance() {
  const [language, setLanguage] = useState('en');
  const t = guidance[language];

  return (
    <section className="emergency-guidance" aria-labelledby="emergency-title">
      <div className="emergency-header">
        <div>
          <span className="emergency-eyebrow">
            LANDSAFE • SAFETY
          </span>
          <h2 id="emergency-title">{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>

        <div className="language-switch" aria-label="Choose language">
          <button
            type="button"
            className={language === 'en' ? 'active' : ''}
            onClick={() => setLanguage('en')}
            aria-pressed={language === 'en'}
          >
            English
          </button>
          <button
            type="button"
            className={language === 'si' ? 'active' : ''}
            onClick={() => setLanguage('si')}
            aria-pressed={language === 'si'}
          >
            සිංහල
          </button>
        </div>
      </div>

      <div className="emergency-section">
        <h3>⚠️ {t.danger}</h3>
        <ul>
          {t.signs.map((sign, index) => (
            <li key={index}>{sign}</li>
          ))}
        </ul>
      </div>

      <div className="emergency-section">
        <h3>✓ {t.actions}</h3>
        <ol>
          {t.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="emergency-contacts">
        <h3>{t.emergency}</h3>

        <a href="tel:117">
          <span>{t.dmc}</span>
          <strong>117</strong>
        </a>

        <a href="tel:1990">
          <span>{t.ambulance}</span>
          <strong>1990</strong>
        </a>
      </div>

      <p className="emergency-disclaimer">{t.disclaimer}</p>
    </section>
  );
}
