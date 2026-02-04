export const JWT = {
  accessToken: {
    secret: process.env.JWT_ACCESS_TOKEN_SECRET || '',
    expireIn: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRE || '43200'), // 12 Hour Dev
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_TOKEN_SECRET || '',
    expireIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRE || '86400'), // 24 Hour Dev
  },
};

export enum ROLE {
  ADMIN_SUPER = 'ADMIN_SUPER',
  ADMIN_ROLE_PERMISSION = 'ADMIN_ROLE_PERMISSION',
  ADMIN_AGENT = 'ADMIN_AGENT',
  ADMIN_MERCHANT = 'ADMIN_MERCHANT',
  AGENT = 'AGENT',
  MERCHANT = 'MERCHANT',
}

export enum MerchantSignatureStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}
