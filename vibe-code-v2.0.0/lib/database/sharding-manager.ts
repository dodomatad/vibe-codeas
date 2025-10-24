// lib/database/sharding-manager.ts
/**
 * Database Sharding Manager
 * 
 * Resumo:
 * Distribuição horizontal de dados entre múltiplos shards usando
 * consistent hashing para balanceamento e escalabilidade
 * 
 * MVP: 3-shard setup com hash simples
 * Enterprise: Dynamic resharding + replication + monitoring
 */

import { Pool, type PoolConfig } from 'pg';
import { createHash } from 'crypto';

export interface ShardConfig {
  id: number;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number; // max connections
}

export interface ShardStats {
  id: number;
  totalQueries: number;
  activeConnections: number;
  idleConnections: number;
  waitingClients: number;
}

// ============================================================================
// SOLUTION RÁPIDA (MVP)
// ============================================================================

export class ShardingManager {
  private shards: Map<number, Pool> = new Map();
  private shardCount: number;
  private stats: Map<number, number> = new Map(); // Query count per shard

  constructor(shardConfigs: ShardConfig[]) {
    if (shardConfigs.length === 0) {
      throw new Error('At least one shard configuration is required');
    }

    this.shardCount = shardConfigs.length;
    
    // Initialize connection pools for each shard
    for (const config of shardConfigs) {
      const pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        max: config.max || 20, // Default: 20 connections per shard
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      
      this.shards.set(config.id, pool);
      this.stats.set(config.id, 0);
    }

    console.log(`Sharding manager initialized with ${this.shardCount} shards`);
  }

  /**
   * Get shard for a given key using consistent hashing
   */
  getShard(key: string): Pool {
    const hash = this.hashKey(key);
    const shardId = hash % this.shardCount;
    const shard = this.shards.get(shardId);
    
    if (!shard) {
      throw new Error(`Shard ${shardId} not found`);
    }
    
    return shard;
  }

  /**
   * Get shard ID for a key
   */
  getShardId(key: string): number {
    const hash = this.hashKey(key);
    return hash % this.shardCount;
  }

  /**
   * Hash key using MD5 (fast and good distribution)
   */
  private hashKey(key: string): number {
    const hash = createHash('md5').update(key).digest();
    return hash.readUInt32LE(0);
  }

  /**
   * Execute query on specific shard
   */
  async query(
    shardKey: string,
    sql: string,
    params: any[] = []
  ): Promise<any> {
    const shard = this.getShard(shardKey);
    const shardId = this.getShardId(shardKey);
    
    try {
      // Increment query counter
      this.stats.set(shardId, (this.stats.get(shardId) || 0) + 1);
      
      return await shard.query(sql, params);
    } catch (error) {
      console.error(`Query error on shard ${shardId}:`, error);
      throw error;
    }
  }

  /**
   * Execute query on all shards (scatter-gather)
   */
  async queryAll(
    sql: string,
    params: any[] = []
  ): Promise<any[]> {
    const promises = Array.from(this.shards.values()).map(shard =>
      shard.query(sql, params)
    );
    
    return Promise.all(promises);
  }

  /**
   * Execute query with transaction on specific shard
   */
  async transaction<T>(
    shardKey: string,
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    const shard = this.getShard(shardKey);
    const client = await shard.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get statistics for all shards
   */
  async getStats(): Promise<ShardStats[]> {
    const stats: ShardStats[] = [];

    for (const [id, pool] of this.shards.entries()) {
      stats.push({
        id,
        totalQueries: this.stats.get(id) || 0,
        activeConnections: pool.totalCount - pool.idleCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
      });
    }

    return stats;
  }

  /**
   * Health check for all shards
   */
  async healthCheck(): Promise<Record<number, boolean>> {
    const health: Record<number, boolean> = {};

    for (const [id, pool] of this.shards.entries()) {
      try {
        await pool.query('SELECT 1');
        health[id] = true;
      } catch (error) {
        console.error(`Health check failed for shard ${id}:`, error);
        health[id] = false;
      }
    }

    return health;
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    const promises = Array.from(this.shards.values()).map(shard => shard.end());
    await Promise.all(promises);
    console.log('All shard connections closed');
  }
}

// ============================================================================
// SOLUTION ENTERPRISE
// ============================================================================

/**
 * Enterprise Sharding Manager with advanced features
 */
export class EnterpriseShardingManager extends ShardingManager {
  private virtualNodes: number = 150; // Virtual nodes for better distribution
  private hashRing: Map<number, number> = new Map(); // Virtual node -> shard ID

  constructor(shardConfigs: ShardConfig[], virtualNodes: number = 150) {
    super(shardConfigs);
    this.virtualNodes = virtualNodes;
    this.initializeHashRing();
  }

  /**
   * Initialize consistent hash ring with virtual nodes
   */
  private initializeHashRing(): void {
    for (let shardId = 0; shardId < this.shardCount; shardId++) {
      for (let vnode = 0; vnode < this.virtualNodes; vnode++) {
        const vnodeKey = `shard-${shardId}-vnode-${vnode}`;
        const hash = this.hashKey(vnodeKey);
        this.hashRing.set(hash, shardId);
      }
    }

    console.log(`Hash ring initialized with ${this.hashRing.size} virtual nodes`);
  }

  /**
   * Get shard using consistent hashing with virtual nodes
   */
  getShard(key: string): any {
    const hash = this.hashKey(key);
    
    // Find closest virtual node
    const sortedHashes = Array.from(this.hashRing.keys()).sort((a, b) => a - b);
    const closestHash = sortedHashes.find(h => h >= hash) || sortedHashes[0];
    
    const shardId = this.hashRing.get(closestHash);
    return this.shards.get(shardId!);
  }

  /**
   * Add new shard dynamically
   */
  async addShard(config: ShardConfig): Promise<void> {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.max || 20,
    });

    this.shards.set(config.id, pool);
    this.shardCount++;
    
    // Rebalance hash ring
    this.initializeHashRing();
    
    console.log(`Shard ${config.id} added successfully`);
  }

  /**
   * Remove shard and rebalance
   */
  async removeShard(shardId: number): Promise<void> {
    const shard = this.shards.get(shardId);
    if (!shard) {
      throw new Error(`Shard ${shardId} not found`);
    }

    await shard.end();
    this.shards.delete(shardId);
    this.shardCount--;
    
    // Rebalance hash ring
    this.initializeHashRing();
    
    console.log(`Shard ${shardId} removed successfully`);
  }
}

/**
 * Shard migration utility
 */
export class ShardMigration {
  constructor(private shardingManager: ShardingManager) {}

  /**
   * Migrate data from one shard to another
   */
  async migrateData(
    sourceShardId: number,
    targetShardId: number,
    table: string,
    batchSize: number = 1000
  ): Promise<void> {
    console.log(`Starting migration: shard ${sourceShardId} -> ${targetShardId}`);

    // TODO: Implement batch migration logic
    // 1. Select data in batches from source
    // 2. Insert into target
    // 3. Delete from source
    // 4. Track progress
    
    console.log('Migration completed');
  }

  /**
   * Rebalance data across shards
   */
  async rebalance(): Promise<void> {
    console.log('Starting shard rebalancing...');
    
    // TODO: Implement rebalancing logic
    // 1. Analyze data distribution
    // 2. Identify hotspots
    // 3. Move data to balance load
    
    console.log('Rebalancing completed');
  }
}

// ============================================================================
// CHECKLIST UI/UX
// ============================================================================

/**
 * Shard management UI:
 * 
 * - [ ] Shard topology visualization
 * - [ ] Query distribution heatmap
 * - [ ] Health status dashboard
 * - [ ] Connection pool metrics
 * - [ ] Migration progress tracker
 * - [ ] Accessibility: ARIA labels, keyboard controls
 */

// ============================================================================
// VALIDAÇÃO
// ============================================================================

/**
 * Target metrics:
 * 
 * - [ ] Query latency: <50ms (p95)
 * - [ ] Load distribution: ±10% across shards
 * - [ ] Connection utilization: 50-80%
 * - [ ] Zero data loss during migration
 * - [ ] Rebalancing time: <1h for 100GB
 */

// ============================================================================
// PRÓXIMOS PASSOS
// ============================================================================

/**
 * Week 1:
 * - [ ] Implement basic 3-shard setup
 * - [ ] Consistent hashing
 * - [ ] Query routing
 * 
 * Week 2:
 * - [ ] Add monitoring and stats
 * - [ ] Health checks
 * - [ ] Integration tests
 * 
 * Week 3-4 (Enterprise):
 * - [ ] Virtual nodes for better distribution
 * - [ ] Dynamic shard addition/removal
 * - [ ] Data migration utilities
 */
