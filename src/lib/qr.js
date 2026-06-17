import { QRCodeStyling, browserUtils } from '@liquid-js/qr-code-styling';
import BorderPlugin from '@liquid-js/qr-code-styling/border-plugin';
import { LOGO_SRC } from './qrDefaults';

export function buildQrOptions(config, data) {
  const { useLogo, border, ...rest } = config || {};
  const options = { ...rest, data };
  if (useLogo) options.image = LOGO_SRC;
  if (border && border.size) {
    const b = structuredClone(border);
    if (b.text) b.text.size = Math.max(12, Math.round(b.size * 0.6));
    options.plugins = [new BorderPlugin(b)];
  }
  return options;
}

export function createQrInstance(config, data) {
  return new QRCodeStyling(buildQrOptions(config, data));
}

export async function downloadQr(instance, name, extension) {
  if (!instance || !browserUtils) return;
  await browserUtils.download(instance, { name, extension }, { width: 1200, height: 1200 });
}