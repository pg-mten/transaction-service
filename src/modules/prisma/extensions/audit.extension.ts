import { Prisma } from '@prisma/client';
import { DateHelper } from 'src/shared/helper/date.helper';

function hasData(args: any): args is { data: any } {
  return args && args.data;
}

export const auditTrailExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const getUserId = () => null; // Hardcoded for now
        const userId = getUserId();
        const now = DateHelper.now().toJSDate(); // Convert to Date object

        if (model) {
            if (operation === 'create' && hasData(args)) {
                args.data = {
                    ...args.data,
                    createdBy: userId ?? undefined,
                    createdAt: now,
                };
            } else if (operation === 'createMany' && hasData(args) && Array.isArray(args.data)) {
                args.data = args.data.map((item: any) => ({
                    ...item,
                    createdBy: userId ?? undefined,
                    createdAt: now,
                }));
            } else if (operation === 'update' && hasData(args)) {
                args.data = {
                    ...args.data,
                    updatedBy: userId ?? undefined,
                    updatedAt: now,
                };
            } else if (operation === 'updateMany' && hasData(args)) {
                args.data = {
                    ...args.data,
                    updatedBy: userId ?? undefined,
                    updatedAt: now,
                };
            } else if (operation === 'delete') {
                operation = 'update';
                (args as any).data = {
                    deletedAt: now,
                    deletedBy: userId ?? undefined,
                };
            } else if (operation === 'deleteMany') {
                operation = 'updateMany';
                (args as any).data = {
                    deletedAt: now,
                    deletedBy: userId ?? undefined,
                };
            }
        }
        return query(args);
      },
    },
  },
});