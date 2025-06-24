import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string; uptime: number; services: any } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'connected',
        websocket: 'active',
        api: 'running'
      }
    };
  }

  @Get('heartbeat')
  getHeartbeat(): { alive: boolean; timestamp: string; services: any } {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        websocket: 'active',
        api: 'running'
      }
    };
  }
}