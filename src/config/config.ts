export default () => ({
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresInDays: Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS ?? 7),
  },
  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpSecure:
      String(process.env.SMTP_SECURE ?? 'false')
        .toLowerCase()
        .trim() === 'true',
    from: process.env.EMAIL_FROM,
    frontendUrl: process.env.FRONTEND_URL,
    verificationExpiryMinutes: Number(
      process.env.EMAIL_VERIFICATION_EXPIRY_MINUTES ?? 30,
    ),
    resendCooldownSeconds: Number(
      process.env.EMAIL_RESEND_COOLDOWN_SECONDS ?? 60,
    ),
  },
});