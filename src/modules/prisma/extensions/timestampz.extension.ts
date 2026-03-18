import { Prisma } from '@prisma/client';
import { DateHelper } from 'src/shared/helper';

type QueryArgs = { data?: unknown } | undefined;

function hasData(args: QueryArgs): args is { data: unknown } {
  return !!(args && 'data' in args);
}

function withAuditFields(data: unknown, fields: Record<string, unknown>) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  return {
    ...(data as Record<string, unknown>),
    ...fields,
  };
}

const modelFieldMap = new Map(
  Prisma.dmmf.datamodel.models.map((item) => [
    item.name,
    new Set(item.fields.map((field) => field.name)),
  ]),
);

function modelHasField(modelName: string, fieldName: string): boolean {
  return modelFieldMap.get(modelName)?.has(fieldName) ?? false;
}

function getTimestampzField(
  modelName: string,
  fieldName: string,
  date: string | Date | undefined,
) {
  if (date === undefined || !modelHasField(modelName, fieldName)) return {};
  return { [fieldName]: date };
}

export const timestampzExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const mutableArgs = (args ?? {}) as any;
        const now = DateHelper.nowISO();

        if (model) {
          const modelName = model as string;

          if (operation === 'create' && hasData(mutableArgs)) {
            mutableArgs.data = withAuditFields(mutableArgs.data, {
              ...getTimestampzField(modelName, 'createdAt', now),
            });
          } else if (
            (operation === 'createMany' ||
              operation === 'createManyAndReturn') &&
            hasData(mutableArgs)
          ) {
            mutableArgs.data = Array.isArray(mutableArgs.data)
              ? mutableArgs.data.map((item: unknown) =>
                  withAuditFields(item, {
                    ...getTimestampzField(modelName, 'createdAt', now),
                  }),
                )
              : withAuditFields(mutableArgs.data, {
                  ...getTimestampzField(modelName, 'createdAt', now),
                });
          } else if (operation === 'upsert') {
            const upsertArgs = mutableArgs as {
              create?: unknown;
              update?: unknown;
            };
            const updateData = upsertArgs.update;
            const isSoftDelete =
              !!updateData &&
              typeof updateData === 'object' &&
              'deletedAt' in (updateData as Record<string, unknown>) &&
              (updateData as Record<string, unknown>).deletedAt != null;

            upsertArgs.create = withAuditFields(upsertArgs.create, {
              ...getTimestampzField(modelName, 'createdAt', now),
            });

            upsertArgs.update = withAuditFields(upsertArgs.update, {
              ...(isSoftDelete
                ? getTimestampzField(modelName, 'deletedAt', now)
                : getTimestampzField(modelName, 'updatedAt', now)),
            });
          } else if (
            (operation === 'update' ||
              operation === 'updateMany' ||
              operation === 'updateManyAndReturn') &&
            hasData(mutableArgs)
          ) {
            const data = mutableArgs.data;
            const isSoftDelete =
              !!data &&
              typeof data === 'object' &&
              'deletedAt' in (data as Record<string, unknown>) &&
              (data as Record<string, unknown>).deletedAt != null;

            mutableArgs.data = withAuditFields(data, {
              ...(isSoftDelete
                ? getTimestampzField(modelName, 'deletedAt', now)
                : getTimestampzField(modelName, 'updatedAt', now)),
            });
          }
        }
        return query(mutableArgs);
      },
    },
  },
});
