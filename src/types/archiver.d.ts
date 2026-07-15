// archiver@8 ships no bundled types and switched to named ESM exports;
// @types/archiver still targets the old default-export factory API, so it
// doesn't match. This declares only the surface this project actually uses.
declare module "archiver" {
  import type { Transform } from "node:stream";

  interface ZipArchiveOptions {
    zlib?: { level?: number };
  }

  interface EntryData {
    name: string;
  }

  export class Archiver extends Transform {
    append(source: Buffer | string, data: EntryData): this;
    finalize(): Promise<void>;
  }

  export class ZipArchive extends Archiver {
    constructor(options?: ZipArchiveOptions);
  }
}
