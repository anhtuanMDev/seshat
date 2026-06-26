declare module "mammoth/mammoth.browser.js" {
  interface PathInput {
    path: string;
  }

  interface BufferInput {
    buffer: Buffer;
  }

  interface ArrayBufferInput {
    arrayBuffer: ArrayBuffer;
  }

  type Input = PathInput | BufferInput | ArrayBufferInput;

  interface Options {
    styleMap?: string | string[];
    includeEmbeddedStyleMap?: boolean;
    includeDefaultStyleMap?: boolean;
    convertImage?: { __mammothBrand: "ImageConverter" };
    ignoreEmptyParagraphs?: boolean;
    idPrefix?: string;
  }

  interface Result {
    value: string;
    messages: Array<{ type: "warning" | "error"; message: string; error?: unknown }>;
  }

  export function convertToHtml(input: Input, options?: Options): Promise<Result>;
  export function extractRawText(input: Input): Promise<Result>;
  export function embedStyleMap(
    input: Input,
    styleMap: string,
  ): Promise<{ toArrayBuffer: () => ArrayBuffer; toBuffer: () => Buffer }>;
}
