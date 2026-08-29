import { Controller, Get } from '@nestjs/common';
import { Neo4jService } from '../database/neo4j.service';

@Controller('health')
export class HealthController {
  constructor(private readonly neo4jService: Neo4jService) {}

  @Get()
  async check() {
    try {
      await this.neo4jService.runQuery('RETURN 1 AS ok');
      return { status: 'up', database: 'connected', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'down', database: 'unreachable', timestamp: new Date().toISOString() };
    }
  }
}