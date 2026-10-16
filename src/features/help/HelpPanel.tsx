import { text } from '@ui/components/text';
import './help.css';

export function HelpPanel() {
  return (
    <section className="help-panel">
      <ol className="help-list">
        {[
          'click',
          'shop',
          'automation',
          'events',
          'boosters',
          'cards',
          'chests',
          'daily',
          'achievements',
          'next',
          'reset',
        ].map((key) => (
          <li key={key}>{text(`help.${key}`)}</li>
        ))}
      </ol>
      <h3>{text('help.terms')}</h3>
      <dl className="glossary">
        {['coin', 'gold', 'cps', 'permanent', 'frenzy', 'duplicate', 'save'].map((key) => (
          <div key={key}>
            <dt>{text(`help.term.${key}`)}</dt>
            <dd>{text(`help.meaning.${key}`)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
