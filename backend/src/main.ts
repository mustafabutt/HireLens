import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Create the NestJS application instance
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend communication
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // Enable global validation pipe for request validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Set global prefix for all API routes
  app.setGlobalPrefix('api');
  
  // Get port from environment or use default
  const port = process.env.BACKEND_PORT || 3001;
  
  // Start the application
  await app.listen(port);
  console.log(`🚀 CV Search Backend is running on port ${port}`);
  console.log(`📚 API Documentation available at http://localhost:${port}/api`);
}

bootstrap(); 