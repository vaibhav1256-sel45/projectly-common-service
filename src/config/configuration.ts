export default () => ({
  port: parseInt(process.env.PORT ?? '3003', 10),
  grpcUrl: process.env.GRPC_URL ?? '0.0.0.0:50053',

  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  },

  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    dryRun: process.env.MAIL_DRY_RUN === 'true',
  },

  // where the buttons in the emails point to
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  aws: {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET,
  },
});
