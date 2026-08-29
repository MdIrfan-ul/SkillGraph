import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as neo4j from 'neo4j-driver';
import { Driver } from 'neo4j-driver';

type RecordShape = Record<string, unknown>;

@Injectable()
export class Neo4jService implements OnModuleDestroy {
  private readonly driver: Driver;

  constructor(private readonly config: ConfigService) {
    const uri = this.config.get<string>('COGNODB_URI') ?? '';
    const user = this.config.get<string>('COGNODB_USER') ?? '';
    const password = this.config.get<string>('COGNODB_PASSWORD') ?? '';
    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  /**
   * Runs a parameterised Cypher query. All user input must be passed via the
   * `params` object - never interpolated into the query string.
   */
  async runQuery<T extends RecordShape = RecordShape>(
    cypher: string,
    params: Record<string, unknown> = {},
  ): Promise<T[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records.map((record) => record.toObject() as T);
    } catch (err) {
      if (isUnreachableError(err)) {
        throw new ServiceUnavailableException(
          'Graph database is unreachable. Please try again shortly.',
        );
      }
      throw err;
    } finally {
      await session.close();
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
  }
}

function isUnreachableError(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return (
    code === 'ServiceUnavailable' ||
    code === 'SessionExpired' ||
    code === 'ConnectionAcquisitionFailed' ||
    code === 'ConnectionError'
  );
}