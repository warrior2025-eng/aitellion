import { NestFactory } from '@nestjs/core';
import * as dns from 'node:dns';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Node resolves AAAA (IPv6) records before A (IPv4) by default. Railway's
// containers don't have an outbound IPv6 route, so connecting to services
// like Gmail SMTP (which has both record types) fails with ENETUNREACH
// unless we explicitly prefer IPv4 here.
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('AITELLION API')
    .setDescription('AI Operating System for Small & Medium Businesses — by Team StackVolt')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`AITELLION API running on http://localhost:${port}/api/v1`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();