import { useNumberFormat } from '@ui/components/number-format';
import { useEffect, useRef, useState } from 'react';
import { Coin3D } from '@ui/coins/Coin3D';
import { Icon } from '@ui/components/Icon';
import { text } from '@ui/components/text';
import './clicker.css';

export function CoinStage({
  coin,
  clickPower,
  cps,
  onEarn,
  disabled,
  reducedMotion,
  glow,
}: {
  coin: string;
  clickPower: string;
  cps: string;
  onEarn: () => boolean;
  disabled: boolean;
  reducedMotion: boolean;
  glow: boolean;
}) {
  const format = useNumberFormat();
  const [pressed, setPressed] = useState(false);
  const [touched, setTouched] = useState(false);
  const contacts = useRef(new Set<number>());
  const lastTouch = useRef(-Infinity);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function tryTouch() {
    if (disabled) return;
    if (!onEarn()) return;
    setPressed(true);
    setTouched(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPressed(false), 180);
  }
  return (
    <section
      className={`coin-stage ${glow ? 'has-glow' : ''} ${reducedMotion ? 'reduce-motion' : ''}`}
      aria-label={text('home.balance')}
    >
      <div className="balance">
        <span className="eyebrow">{text('home.balance')}</span>
        <div
          className={`balance-value ${format(coin).length > 6 ? 'balance-compact' : ''} ${format(coin).length > 18 ? 'balance-long' : ''}`}
          title={coin}
        >
          <output data-testid="coin-balance" aria-live="off">
            {format(coin)}
          </output>
          <span>{text('common.coin')}</span>
        </div>
        <div className="rate-row">
          <span>
            <Icon name="trend" size={14} />
            <strong>{format(cps)}</strong> {text('home.perSecond')}
          </span>
          <i />
          <span>
            <Icon name="zap" size={14} />
            <strong>{format(clickPower)}</strong> {text('home.perClick')}
          </span>
        </div>
      </div>
      <div className="coin-universe">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <span className="orbital-point point-one" />
        <span className="orbital-point point-two" />
        <span className="coin-spark spark-one">✦</span>
        <span className="coin-spark spark-two">✦</span>
        <button
          className={`coin-button ${pressed ? 'is-pressed' : ''}`}
          disabled={disabled}
          onPointerDown={(event) => {
            if (event.pointerType !== 'mouse') contacts.current.add(event.pointerId);
          }}
          onPointerCancel={(event) => {
            contacts.current.delete(event.pointerId);
          }}
          onPointerUp={(event) => {
            if (contacts.current.delete(event.pointerId)) {
              lastTouch.current = event.timeStamp;
              tryTouch();
            }
          }}
          onClick={(event) => {
            if (event.detail === 0 || event.timeStamp - lastTouch.current > 800) tryTouch();
          }}
          aria-label={text('home.coinLabel')}
        >
          <Coin3D kind="silver" size={480} hero paused={disabled} reducedMotion={reducedMotion} />
        </button>
      </div>
      <p className="coin-touch">
        <Icon name="sparkles" size={16} />
        {text('home.touch')}
      </p>
      <p className="coin-instruction">{text('home.touchHint')}</p>
      <div className="coin-caption">
        <span />
        {text('home.edition')}
        <span />
      </div>
      <p className="preview-feedback" role="status">
        {text(touched ? 'home.touchFeedback' : 'app.previewNote')}
      </p>
    </section>
  );
}
