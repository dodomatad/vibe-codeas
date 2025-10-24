/**
 * Hybrid Storage System
 * Offline-first com sync opcional para cloud
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Project {
  id: string;
  name: string;
  files: Record<string, string>;
  framework: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  metadata?: Record<string, any>;
}

interface ProjectDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-name': string; 'by-date': number };
  };
  versions: {
    key: string;
    value: ProjectVersion;
    indexes: { 'by-project': string };
  };
}

interface ProjectVersion {
  id: string;
  projectId: string;
  snapshot: Project;
  message?: string;
  createdAt: number;
}

export class HybridStorage {
  private db: IDBPDatabase<ProjectDB> | null = null;
  private readonly DB_NAME = 'open-lovable';
  private readonly VERSION = 1;

  async init(): Promise<void> {
    this.db = await openDB<ProjectDB>(this.DB_NAME, this.VERSION, {
      upgrade(db) {
        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('by-name', 'name');
          projectStore.createIndex('by-date', 'updatedAt');
        }

        // Versions store
        if (!db.objectStoreNames.contains('versions')) {
          const versionStore = db.createObjectStore('versions', { keyPath: 'id' });
          versionStore.createIndex('by-project', 'projectId');
        }
      },
    });
  }

  async save(project: Project): Promise<void> {
    if (!this.db) await this.init();
    
    project.updatedAt = Date.now();
    project.version = (project.version || 0) + 1;
    
    await this.db!.put('projects', project);
    
    // Auto-create version snapshot
    await this.createVersion(project.id, 'Auto-save');
  }

  async load(id: string): Promise<Project | undefined> {
    if (!this.db) await this.init();
    return this.db!.get('projects', id);
  }

  async list(): Promise<Project[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('projects');
  }

  async delete(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('projects', id);
  }

  async createVersion(projectId: string, message?: string): Promise<string> {
    if (!this.db) await this.init();
    
    const project = await this.load(projectId);
    if (!project) throw new Error('Project not found');

    const version: ProjectVersion = {
      id: `${projectId}-v${Date.now()}`,
      projectId,
      snapshot: { ...project },
      message,
      createdAt: Date.now(),
    };

    await this.db!.add('versions', version);
    return version.id;
  }

  async getVersions(projectId: string): Promise<ProjectVersion[]> {
    if (!this.db) await this.init();
    return this.db!.getAllFromIndex('versions', 'by-project', projectId);
  }

  async restoreVersion(versionId: string): Promise<void> {
    if (!this.db) await this.init();
    
    const version = await this.db!.get('versions', versionId);
    if (!version) throw new Error('Version not found');

    await this.save(version.snapshot);
  }

  async export(id: string): Promise<Blob> {
    const project = await this.load(id);
    if (!project) throw new Error('Project not found');

    const json = JSON.stringify(project, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  async import(blob: Blob): Promise<string> {
    const text = await blob.text();
    const project: Project = JSON.parse(text);
    
    // Generate new ID to avoid conflicts
    project.id = `imported-${Date.now()}`;
    project.updatedAt = Date.now();
    
    await this.save(project);
    return project.id;
  }
}

export const storage = new HybridStorage();
