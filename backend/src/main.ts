import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration from environment variables
  const port = process.env.PORT || process.env.BACKEND_PORT || 3001;
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

  // Enable CORS for frontend
  app.use(cors({
    origin: corsOrigin.split(',').map(origin => origin.trim()), // Support multiple origins
    credentials: true,
  }));

  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(port);
  console.log(`Backend server is running on http://localhost:${port}`);
}
bootstrap();
