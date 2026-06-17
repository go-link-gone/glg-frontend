import { useCallback, useEffect, useRef, useState } from 'react';
import QrPreview from './QrPreview';
import Spinner from './Spinner';
import { downloadQr } from '../lib/qr';
import {
  CORNER_DOT_TYPES,
  CORNER_SQUARE_TYPES,
  DEFAULT_QR_CONFIG,
  DOT_TYPES,
  ECC_LEVELS,
  SHAPES,
  titleCase,
} from '../lib/qrDefaults';

const HEX6 = /^#[0-9a-fA-F]{6}$/;
const colorValue = (c) => (typeof c === 'string' && HEX6.test(c) ? c : '#000000');

const contrastColor = (hex) => {
  const c = colorValue(hex).replace('#', '');
  const lum =
    0.299 * parseInt(c.slice(0, 2), 16) + 0.587 * parseInt(c.slice(2, 4), 16) + 0.114 * parseInt(c.slice(4, 6), 16);
  return lum < 140 ? '#ffffff' : '#000000';
};

const GRADIENT_DEFAULT = {
  type: 'linear',
  rotation: 0,
  colorStops: [
    { offset: 0, color: '#000000' },
    { offset: 1, color: '#666666' },
  ],
};

const FRAME_DEFAULT = {
  size: 40,
  color: '#000000',
  round: 0,
  text: { color: '#ffffff', bottom: { content: 'SCAN ME' } },
};

const CAPTION_POSITIONS = ['bottom', 'top', 'left', 'right'];
const CAPTION_FONTS = [
  'sans-serif',
  'serif',
  'monospace',
  'Arial',
  'Helvetica',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Segoe UI',
  'Calibri',
  'Times New Roman',
  'Georgia',
  'Garamond',
  'Cambria',
  'Courier New',
  'Lucida Console',
  'Comic Sans MS',
  'Impact',
];

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-body-sm text-on-surface-variant">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="max-w-[150px] rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-body-sm text-on-surface"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {titleCase(o)}
        </option>
      ))}
    </select>
  );
}

function Color({ value, onChange, disabled }) {
  return (
    <input
      type="color"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="h-8 w-12 cursor-pointer rounded border border-outline-variant bg-transparent disabled:opacity-40"
    />
  );
}

function Toggle({ checked, onChange }) {
  return <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-primary" />;
}

function Section({ title, children }) {
  return (
    <div className="border-t border-outline-variant pt-3 first:border-t-0 first:pt-0">
      <h4 className="mb-1 text-label-caps uppercase text-secondary">{title}</h4>
      {children}
    </div>
  );
}

export default function QrStudio({ data, initialConfig, fileName = 'qr', onSave, saving, onCancel }) {
  const [config, setConfig] = useState(() => {
    const c = structuredClone(initialConfig || DEFAULT_QR_CONFIG);
    // margin has no UI control, so normalize legacy values to the current default
    if (c.imageOptions) c.imageOptions.margin = DEFAULT_QR_CONFIG.imageOptions.margin;
    return c;
  });
  const [preview, setPreview] = useState(config);
  const instanceRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => setPreview(config), 150);
    return () => clearTimeout(id);
  }, [config]);

  const patch = (fn) =>
    setConfig((c) => {
      const n = structuredClone(c);
      fn(n);
      return n;
    });

  const onReady = useCallback((qr) => {
    instanceRef.current = qr;
  }, []);

  const dotsGradient = !!config.dotsOptions.gradient;
  const bgTransparent = config.backgroundOptions?.color === '#00000000';
  const frameOn = !!config.border;
  const capPos = frameOn ? CAPTION_POSITIONS.find((p) => config.border.text?.[p]) || 'bottom' : 'bottom';

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_240px]">
      <div className="space-y-3">
        <Section title="Shape & quality">
          <Row label="Overall shape">
            <Select
              value={config.shape || 'square'}
              onChange={(e) => patch((n) => (n.shape = e.target.value))}
              options={SHAPES}
            />
          </Row>
          <Row label="Error correction">
            <Select
              value={config.qrOptions?.errorCorrectionLevel || 'H'}
              onChange={(e) => patch((n) => (n.qrOptions.errorCorrectionLevel = e.target.value))}
              options={ECC_LEVELS}
            />
          </Row>
        </Section>

        <Section title="Dots">
          <Row label="Style">
            <Select
              value={config.dotsOptions.type}
              onChange={(e) => patch((n) => (n.dotsOptions.type = e.target.value))}
              options={DOT_TYPES}
            />
          </Row>
          <Row label="Gradient">
            <Toggle
              checked={dotsGradient}
              onChange={(e) =>
                patch((n) => {
                  if (e.target.checked) n.dotsOptions.gradient = structuredClone(GRADIENT_DEFAULT);
                  else delete n.dotsOptions.gradient;
                })
              }
            />
          </Row>
          {dotsGradient ? (
            <>
              <Row label="Gradient type">
                <Select
                  value={config.dotsOptions.gradient.type}
                  onChange={(e) => patch((n) => (n.dotsOptions.gradient.type = e.target.value))}
                  options={['linear', 'radial']}
                />
              </Row>
              <Row label="From → To">
                <Color
                  value={colorValue(config.dotsOptions.gradient.colorStops[0].color)}
                  onChange={(e) => patch((n) => (n.dotsOptions.gradient.colorStops[0].color = e.target.value))}
                />
                <Color
                  value={colorValue(config.dotsOptions.gradient.colorStops[1].color)}
                  onChange={(e) => patch((n) => (n.dotsOptions.gradient.colorStops[1].color = e.target.value))}
                />
              </Row>
            </>
          ) : (
            <Row label="Color">
              <Color
                value={colorValue(config.dotsOptions.color)}
                onChange={(e) => patch((n) => (n.dotsOptions.color = e.target.value))}
              />
            </Row>
          )}
        </Section>

        <Section title="Eyes">
          <Row label="Frame style">
            <Select
              value={config.cornersSquareOptions.type}
              onChange={(e) => patch((n) => (n.cornersSquareOptions.type = e.target.value))}
              options={CORNER_SQUARE_TYPES}
            />
          </Row>
          <Row label="Frame color">
            <Color
              value={colorValue(config.cornersSquareOptions.color)}
              onChange={(e) => patch((n) => (n.cornersSquareOptions.color = e.target.value))}
            />
          </Row>
          <Row label="Ball style">
            <Select
              value={config.cornersDotOptions.type}
              onChange={(e) => patch((n) => (n.cornersDotOptions.type = e.target.value))}
              options={CORNER_DOT_TYPES}
            />
          </Row>
          <Row label="Ball color">
            <Color
              value={colorValue(config.cornersDotOptions.color)}
              onChange={(e) => patch((n) => (n.cornersDotOptions.color = e.target.value))}
            />
          </Row>
        </Section>

        <Section title="Background">
          <Row label="Transparent">
            <Toggle
              checked={bgTransparent}
              onChange={(e) =>
                patch((n) => (n.backgroundOptions.color = e.target.checked ? '#00000000' : '#ffffff'))
              }
            />
          </Row>
          <Row label="Color">
            <Color
              value={colorValue(config.backgroundOptions?.color)}
              onChange={(e) => patch((n) => (n.backgroundOptions.color = e.target.value))}
              disabled={bgTransparent}
            />
          </Row>
        </Section>

        <Section title="Logo">
          <Row label="GoLinkGone logo">
            <Toggle checked={!!config.useLogo} onChange={(e) => patch((n) => (n.useLogo = e.target.checked))} />
          </Row>
          {config.useLogo && (
            <Row label="Logo size">
              <input
                type="range"
                min="0.2"
                max="0.6"
                step="0.05"
                value={config.imageOptions?.imageSize ?? 0.45}
                onChange={(e) => patch((n) => (n.imageOptions.imageSize = Number(e.target.value)))}
                className="w-28 accent-primary"
              />
            </Row>
          )}
        </Section>

        <Section title="Frame">
          <Row label="Add frame">
            <Toggle
              checked={frameOn}
              onChange={(e) =>
                patch((n) => {
                  if (e.target.checked) n.border = structuredClone(FRAME_DEFAULT);
                  else delete n.border;
                })
              }
            />
          </Row>
          {frameOn && (
            <>
              <Row label="Caption">
                <input
                  type="text"
                  maxLength={120}
                  value={config.border.text?.[capPos]?.content ?? ''}
                  onChange={(e) =>
                    patch((n) => {
                      const t = (n.border.text = n.border.text || {});
                      t[capPos] = t[capPos] || {};
                      t[capPos].content = e.target.value;
                    })
                  }
                  className="w-32 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-body-sm text-on-surface"
                />
              </Row>
              <Row label="Position">
                <Select
                  value={capPos}
                  onChange={(e) =>
                    patch((n) => {
                      const t = (n.border.text = n.border.text || {});
                      const content = t[capPos]?.content ?? '';
                      CAPTION_POSITIONS.forEach((p) => delete t[p]);
                      t[e.target.value] = { content };
                    })
                  }
                  options={CAPTION_POSITIONS}
                />
              </Row>
              <Row label="Font">
                <Select
                  value={config.border.text?.font || 'sans-serif'}
                  onChange={(e) => patch((n) => ((n.border.text = n.border.text || {}).font = e.target.value))}
                  options={CAPTION_FONTS}
                />
              </Row>
              <Row label="Bold">
                <Toggle
                  checked={config.border.text?.fontWeight === 'bold'}
                  onChange={(e) =>
                    patch((n) => ((n.border.text = n.border.text || {}).fontWeight = e.target.checked ? 'bold' : 'normal'))
                  }
                />
              </Row>
              <Row label="Italic">
                <Toggle
                  checked={config.border.text?.fontStyle === 'italic'}
                  onChange={(e) =>
                    patch((n) => ((n.border.text = n.border.text || {}).fontStyle = e.target.checked ? 'italic' : 'normal'))
                  }
                />
              </Row>
              <Row label="Frame color">
                <Color
                  value={colorValue(config.border.color)}
                  onChange={(e) =>
                    patch((n) => {
                      n.border.color = e.target.value;
                      n.border.text = n.border.text || {};
                      n.border.text.color = contrastColor(e.target.value);
                    })
                  }
                />
              </Row>
              <Row label="Thickness">
                <input
                  type="range"
                  min="12"
                  max="100"
                  step="1"
                  value={config.border.size ?? 40}
                  onChange={(e) => patch((n) => (n.border.size = Number(e.target.value)))}
                  className="w-28 accent-primary"
                />
              </Row>
              <Row label="Roundness">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.border.round ?? 0}
                  onChange={(e) => patch((n) => (n.border.round = Number(e.target.value)))}
                  className="w-28 accent-primary"
                />
              </Row>
            </>
          )}
        </Section>
      </div>

      <div className="flex flex-col items-center gap-3 md:sticky md:top-20 md:self-start">
        <div className="grid aspect-square w-full max-w-[220px] place-items-center rounded-xl border border-outline-variant bg-white p-3">
          <QrPreview config={preview} data={data} onReady={onReady} className="h-full w-full" />
        </div>
        <div className="flex w-full max-w-[220px] flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadQr(instanceRef.current, fileName, 'png')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                download
              </span>
              PNG
            </button>
            <button
              type="button"
              onClick={() => downloadQr(instanceRef.current, fileName, 'svg')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                download
              </span>
              SVG
            </button>
          </div>
          {onSave && (
            <button
              type="button"
              onClick={() => onSave(config)}
              disabled={saving}
              className="brand-btn flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-body-sm disabled:opacity-70"
            >
              {saving ? <Spinner size={16} color="#fff" label="Saving…" /> : 'Save QR'}
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-lg border border-outline-variant px-4 py-2 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
