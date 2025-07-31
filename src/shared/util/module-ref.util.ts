import { ModuleRef } from '@nestjs/core';

export class ModuleRefUtil {
  private static moduleRef: ModuleRef;

  static set(ref: ModuleRef) {
    this.moduleRef = ref;
  }

  static get(): ModuleRef {
    if (!this.moduleRef) throw new Error('ModuleRef is not set yet');
    return this.moduleRef;
  }
}
