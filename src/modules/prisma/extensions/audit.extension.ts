/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Prisma } from '@prisma/client';
import { ClsServiceManager } from 'nestjs-cls';
import { DateHelper } from 'src/shared/helper/date.helper';

function hasData(args: any): args is { data: any } {
  return args && args.data;
}

export const auditTrailExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        console.log('AuditTrailExtension');
        // const getUserId = () => null; // Hardcoded for now
        const cls = ClsServiceManager.getClsService();
        const userId = cls.get('authInfo.userId');
        const now = DateHelper.now().toJSDate(); // Convert to Date object

        console.log({ userId });

        if (model) {
          // if (operation === 'create' && hasData(args)) {
          //   args.data = {
          //     ...args.data,
          //     createdBy: userId ?? undefined,
          //     createdAt: now,
          //   };
          // } else if (
          //   operation === 'createMany' &&
          //   hasData(args) &&
          //   Array.isArray(args.data)
          // ) {
          //   args.data = args.data.map((item: any) => ({
          //     ...item,
          //     createdBy: userId ?? undefined,
          //     createdAt: now,
          //   }));
          // } else if (operation === 'update' && hasData(args)) {
          //   args.data = {
          //     ...args.data,
          //     updatedBy: userId ?? undefined,
          //     updatedAt: now,
          //   };
          // } else if (operation === 'updateMany' && hasData(args)) {
          //   args.data = {
          //     ...args.data,
          //     updatedBy: userId ?? undefined,
          //     updatedAt: now,
          //   };
          // }
          /// TODO Delete Masih Error
          // else if (operation === 'delete') {
          //   operation = 'update';
          //   (args as any).data = {
          //     deletedAt: now,
          //     deletedBy: userId ?? undefined,
          //   };
          // } else if (operation === 'deleteMany') {
          //   operation = 'updateMany';
          //   (args as any).data = {
          //     deletedAt: now,
          //     deletedBy: userId ?? undefined,
          //   };
          // }
        }
        return query(args);
      },
    },
  },
});
