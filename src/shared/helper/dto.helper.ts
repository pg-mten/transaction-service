export class DtoHelper {
  static assign<T extends object>(target: T, source: T): void {
    const allowedKeys = Object.keys(target) as (keyof T)[];
    for (const key of allowedKeys) {
      if (key in source) {
        target[key] = source[key];
      }
    }
  }

  static filter<T extends object>(dto: T) {
    return Object.fromEntries(
      Object.entries(dto).filter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, value]) => value !== null && value !== undefined,
      ),
    ) as Partial<T>;
  }
}
