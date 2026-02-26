import { Prisma } from '@prisma/client';
import { ClsServiceManager } from 'nestjs-cls';

type QueryArgs = { data?: unknown } | undefined;

function hasData(args: QueryArgs): args is { data: unknown } {
  return !!(args && 'data' in args);
}

function toAuditUserId(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
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

function getUserAuditField(
  modelName: string,
  fieldName: string,
  userId: number | undefined,
) {
  if (userId === undefined || !modelHasField(modelName, fieldName)) return {};
  return { [fieldName]: userId };
}

export const auditTrailExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const mutableArgs = (args ?? {}) as any;
        const cls = ClsServiceManager.getClsService();
        const userId = toAuditUserId(cls.get('authInfo.userId'));

        if (model) {
          const modelName = model as string;

          if (operation === 'create' && hasData(mutableArgs)) {
            mutableArgs.data = withAuditFields(mutableArgs.data, {
              ...getUserAuditField(modelName, 'createdBy', userId),
            });
          } else if (
            (operation === 'createMany' ||
              operation === 'createManyAndReturn') &&
            hasData(mutableArgs)
          ) {
            mutableArgs.data = Array.isArray(mutableArgs.data)
              ? mutableArgs.data.map((item: unknown) =>
                  withAuditFields(item, {
                    ...getUserAuditField(modelName, 'createdBy', userId),
                  }),
                )
              : withAuditFields(mutableArgs.data, {
                  ...getUserAuditField(modelName, 'createdBy', userId),
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
              ...getUserAuditField(modelName, 'createdBy', userId),
            });
            // upsertArgs.update = withAuditFields(upsertArgs.update, {
            //   ...getUserAuditField(modelName, 'updatedBy', userId),
            //   ...(isSoftDelete
            //     ? getUserAuditField(modelName, 'deletedBy', userId)
            //     : {}),
            // });
            upsertArgs.update = withAuditFields(upsertArgs.update, {
              ...(isSoftDelete
                ? getUserAuditField(modelName, 'deletedBy', userId)
                : getUserAuditField(modelName, 'updatedBy', userId)),
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

            // mutableArgs.data = withAuditFields(data, {
            //   ...getUserAuditField(modelName, 'updatedBy', userId),
            //   ...(isSoftDelete
            //     ? getUserAuditField(modelName, 'deletedBy', userId)
            //     : {}),
            // });
            mutableArgs.data = withAuditFields(data, {
              ...(isSoftDelete
                ? getUserAuditField(modelName, 'deletedBy', userId)
                : getUserAuditField(modelName, 'updatedBy', userId)),
            });
          }
        }
        return query(mutableArgs);
      },
    },
  },
});
