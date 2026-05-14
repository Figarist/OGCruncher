/**
 * OGCruncher — Encoders
 * by figarist · https://figarist.github.io
 */

'use strict';

export function encodeOGG(channels, sampleRate) {
  const numChannels = channels.length;
  // @ts-ignore
  const encoder = new OggVorbisEncoder(sampleRate, numChannels, 0.0);

  const CHUNK_SIZE = 65536; 
  const totalSamples = channels[0].length;

  for (let i = 0; i < totalSamples; i += CHUNK_SIZE) {
    const chunkEnd = Math.min(i + CHUNK_SIZE, totalSamples);
    const chunks = channels.map(ch => ch.subarray(i, chunkEnd));
    encoder.encode(chunks);
  }

  return encoder.finish(); 
}

export function encodeWAV(channels, sampleRate, bitDepth) {
  const containerDepth = bitDepth <= 8 ? 8 : 16;
  const numChannels = channels.length;
  const numSamples = channels[0].length;
  const bytesPerSample = containerDepth === 16 ? 2 : 1;
  const blockAlign = numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + numSamples * blockAlign);
  const view = new DataView(buffer);

  const writeString = (v, offset, str) => {
    for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * blockAlign, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, containerDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * blockAlign, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let s = Math.max(-1, Math.min(1, channels[ch][i]));
      if (containerDepth === 16) {
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      } else {
        view.setUint8(offset, (s + 1) * 127.5);
        offset += 1;
      }
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}

export function encodeMP3(channels, sampleRate) {
  const numChannels = channels.length;
  const numSamples = channels[0].length;

  // @ts-ignore
  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
  const mp3Data = [];
  const sampleBlockSize = 1152;

  const intChannels = channels.map(ch => {
    const i16 = new Int16Array(ch.length);
    for (let i = 0; i < ch.length; i++) {
      let s = Math.max(-1, Math.min(1, ch[i]));
      i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return i16;
  });

  for (let i = 0; i < numSamples; i += sampleBlockSize) {
    const chunkEnd = Math.min(i + sampleBlockSize, numSamples);
    const leftChunk = intChannels[0].subarray(i, chunkEnd);
    const rightChunk = numChannels > 1 ? intChannels[1].subarray(i, chunkEnd) : leftChunk;

    let mp3buf;
    if (numChannels === 1) {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    }
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) mp3Data.push(mp3buf);

  return new Blob(mp3Data, { type: 'audio/mp3' });
}
