/**
 * Minimal ESC/POS encoder ported from `esc-pos-encoder-ionic` (the subset the
 * app uses). Native `canvas` / `iconv-lite` dependencies are dropped: receipt
 * content is plain ASCII, which is byte-identical in every supported codepage.
 */

/* eslint-disable no-bitwise */

type QueueItem = number | number[] | Uint8Array | string;

class EscPosEncoder {
  private _buffer: number[] = [];
  private _codepage: string = 'ascii';
  private _state = {
    bold: false,
    italic: false,
    underline: false,
    hanzi: false,
  };

  private _reset(): void {
    this._buffer = [];
    this._codepage = 'ascii';
    this._state = { bold: false, italic: false, underline: false, hanzi: false };
  }

  private _encode(value: string): Uint8Array {
    const bytes: number[] = [];
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < value.length) {
        const pair = value.charCodeAt(i + 1);
        const point = 0x10000 + ((code - 0xd800) << 10) + (pair - 0xdc00);
        i += 1;
        bytes.push(
          0xf0 | (point >> 18),
          0x80 | ((point >> 12) & 0x3f),
          0x80 | ((point >> 6) & 0x3f),
          0x80 | (point & 0x3f),
        );
      } else {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      }
    }
    return Uint8Array.from(bytes);
  }

  private _queue(value: QueueItem | QueueItem[]): void {
    const items = Array.isArray(value) ? value : [value];
    items.forEach(item => {
      if (typeof item === 'number') {
        this._buffer.push(item & 0xff);
      } else if (typeof item === 'string') {
        this._encode(item).forEach(byte => this._buffer.push(byte));
      } else {
        item.forEach(byte => this._buffer.push(byte & 0xff));
      }
    });
  }

  initialize(): this {
    this._reset();
    this._queue([0x1b, 0x40]);
    return this;
  }

  codepage(value: string): this {
    const codepages: Record<string, [number, boolean]> = {
      cp437: [0x00, false],
      cp737: [0x40, false],
      cp850: [0x02, false],
      cp775: [0x5f, false],
      cp852: [0x12, false],
      cp855: [0x3c, false],
      cp857: [0x3d, false],
      cp858: [0x13, false],
      cp860: [0x03, false],
      cp861: [0x38, false],
      cp862: [0x3e, false],
      cp863: [0x04, false],
      cp864: [0x1c, false],
      cp865: [0x05, false],
      cp866: [0x11, false],
      cp869: [0x42, false],
      cp936: [0xff, true],
      cp949: [0xfd, true],
      cp950: [0xfe, true],
      cp1252: [0x10, false],
      iso88596: [0x16, false],
      shiftjis: [0xfc, true],
      windows1250: [0x48, false],
      windows1251: [0x49, false],
      windows1252: [0x47, false],
      windows1253: [0x5a, false],
      windows1254: [0x5b, false],
      windows1255: [0x20, false],
      windows1256: [0x5c, false],
      windows1257: [0x19, false],
      windows1258: [0x5e, false],
    };

    const codepage = value === 'ascii' || value === 'iso88591' ? undefined : value;
    if (codepage === undefined || !(codepage in codepages)) {
      if (value === 'ascii' || value === 'iso88591') {
        this._codepage = value;
        return this;
      }
      throw new Error('Codepage not supported by printer');
    }

    this._codepage = codepage;
    this._state.hanzi = codepages[codepage][1];
    this._queue([0x1b, 0x74, codepages[codepage][0]]);
    return this;
  }

  text(value: string): this {
    const bytes = this._encode(value);
    if (this._state.hanzi) {
      this._queue([0x1c, 0x26, bytes, 0x1c, 0x2e]);
    } else {
      this._queue([bytes]);
    }
    return this;
  }

  newline(): this {
    this._queue([0x0a, 0x0d]);
    return this;
  }

  line(value: string): this {
    this.text(value);
    this.newline();
    return this;
  }

  underline(value?: boolean | number): this {
    const flag = value === undefined ? !this._state.underline : value;
    this._state.underline = Boolean(flag);
    this._queue([0x1b, 0x2d, Number(flag)]);
    return this;
  }

  italic(value?: boolean): this {
    const flag = value === undefined ? !this._state.italic : value;
    this._state.italic = Boolean(flag);
    this._queue([0x1b, 0x34, Number(flag)]);
    return this;
  }

  bold(value?: boolean): this {
    const flag = value === undefined ? !this._state.bold : value;
    this._state.bold = Boolean(flag);
    this._queue([0x1b, 0x45, Number(flag)]);
    return this;
  }

  size(value: string): this {
    this._queue([0x1b, 0x4d, value === 'small' ? 0x01 : 0x00]);
    return this;
  }

  align(value: string): this {
    const alignments: Record<string, number> = { left: 0x00, center: 0x01, right: 0x02 };
    if (value in alignments) {
      this._queue([0x1b, 0x61, alignments[value]]);
    } else {
      throw new Error('Unknown alignment');
    }
    return this;
  }

  raw(value: number[] | Uint8Array): this {
    this._queue([value]);
    return this;
  }

  cut(type: string = 'full'): this {
    const cuts: Record<string, number[]> = {
      full: [0x1d, 0x56, 0x00],
      partial: [0x1d, 0x56, 0x01],
    };
    this._queue([cuts[type] ?? cuts.full]);
    return this;
  }

  encode(): Uint8Array {
    return Uint8Array.from(this._buffer);
  }
}

export default EscPosEncoder;
