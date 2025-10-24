/**
 * Context Builder System
 * Analisa o projeto e constrói contexto rico para geração de código
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

export interface ProjectContext {
  /** Framework detectado */
  framework: 'next' | 'react' | 'vite' | 'remix';
  
  /** Versão do framework */
  frameworkVersion: string;
  
  /** Componentes existentes */
  components: ComponentInfo[];
  
  /** Rotas da aplicação */
  routes: RouteInfo[];
  
  /** Sistema de estilo */
  styleSystem: 'tailwind' | 'styled-components' | 'css-modules' | 'emotion';
  
  /** Tokens de design */
  designTokens: DesignTokens;
  
  /** Gerenciamento de estado */
  stateManagement?: 'zustand' | 'jotai' | 'redux' | 'mobx';
  
  /** Padrões identificados */
  patterns: Pattern[];
  
  /** Dependências */
  dependencies: Record<string, string>;
  
  /** Configuração TypeScript */
  tsConfig?: any;
  
  /** Arquitetura de pastas */
  folderStructure: FolderNode;
}

export interface ComponentInfo {
  name: string;
  path: string;
  props: PropInfo[];
  isServerComponent: boolean;
  isClientComponent: boolean;
  dependencies: string[];
  complexity: 'low' | 'medium' | 'high';
}

export interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}

export interface RouteInfo {
  path: string;
  type: 'static' | 'dynamic' | 'catch-all';
  hasLayout: boolean;
  hasLoading: boolean;
  hasError: boolean;
  isProtected: boolean;
}

export interface DesignTokens {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, any>;
  breakpoints: Record<string, string>;
  shadows: Record<string, string>;
  borderRadius: Record<string, string>;
}

export interface Pattern {
  type: 'component-composition' | 'data-fetching' | 'error-handling' | 'state-management';
  description: string;
  frequency: number;
  examples: string[];
}

export interface FolderNode {
  name: string;
  type: 'file' | 'directory';
  children?: FolderNode[];
  path: string;
}

/**
 * Context Builder
 * Analisa o projeto e extrai informações relevantes
 */
export class ContextBuilder {
  private projectRoot: string;
  private cache: Map<string, any> = new Map();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Constrói contexto completo do projeto
   */
  async buildContext(): Promise<ProjectContext> {
    console.log('🔍 Building project context...');

    const [
      framework,
      components,
      routes,
      styleSystem,
      designTokens,
      stateManagement,
      patterns,
      dependencies,
      tsConfig,
      folderStructure
    ] = await Promise.all([
      this.detectFramework(),
      this.analyzeComponents(),
      this.analyzeRoutes(),
      this.detectStyleSystem(),
      this.extractDesignTokens(),
      this.detectStateManagement(),
      this.identifyPatterns(),
      this.getDependencies(),
      this.getTsConfig(),
      this.buildFolderStructure()
    ]);

    return {
      framework: framework.name,
      frameworkVersion: framework.version,
      components,
      routes,
      styleSystem,
      designTokens,
      stateManagement,
      patterns,
      dependencies,
      tsConfig,
      folderStructure
    };
  }

  /**
   * Detecta framework e versão
   */
  private async detectFramework(): Promise<{ name: any; version: string }> {
    const pkgPath = join(this.projectRoot, 'package.json');
    
    try {
      const content = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);
      
      if (pkg.dependencies?.next || pkg.devDependencies?.next) {
        return { 
          name: 'next', 
          version: pkg.dependencies?.next || pkg.devDependencies?.next 
        };
      }
      
      if (pkg.dependencies?.react) {
        // Check for Vite
        if (pkg.devDependencies?.vite) {
          return { name: 'vite', version: pkg.devDependencies.vite };
        }
        // Check for Remix
        if (pkg.dependencies?.['@remix-run/react']) {
          return { name: 'remix', version: pkg.dependencies['@remix-run/react'] };
        }
        return { name: 'react', version: pkg.dependencies.react };
      }

      return { name: 'react', version: 'unknown' };
    } catch (error) {
      console.error('Error detecting framework:', error);
      return { name: 'react', version: 'unknown' };
    }
  }

  /**
   * Analisa componentes do projeto
   */
  private async analyzeComponents(): Promise<ComponentInfo[]> {
    const componentsDir = join(this.projectRoot, 'components');
    const components: ComponentInfo[] = [];

    try {
      const files = await this.getAllFiles(componentsDir, ['.tsx', '.jsx']);
      
      for (const file of files) {
        const component = await this.analyzeComponent(file);
        if (component) {
          components.push(component);
        }
      }
    } catch (error) {
      console.warn('Could not analyze components:', error);
    }

    return components;
  }

  /**
   * Analisa um componente específico
   */
  private async analyzeComponent(filePath: string): Promise<ComponentInfo | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const name = this.extractComponentName(filePath);
      
      return {
        name,
        path: filePath,
        props: this.extractProps(content),
        isServerComponent: !content.includes("'use client'"),
        isClientComponent: content.includes("'use client'"),
        dependencies: this.extractImports(content),
        complexity: this.calculateComplexity(content)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extrai props de um componente
   */
  private extractProps(content: string): PropInfo[] {
    const props: PropInfo[] = [];
    
    // Regex para interface de props
    const interfaceMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/);
    if (interfaceMatch) {
      const propsBlock = interfaceMatch[1];
      const propLines = propsBlock.split('\n').filter(line => line.trim());
      
      for (const line of propLines) {
        const match = line.match(/(\w+)(\?)?:\s*([^;]+)/);
        if (match) {
          props.push({
            name: match[1],
            type: match[3].trim(),
            required: !match[2],
            defaultValue: this.extractDefaultValue(content, match[1])
          });
        }
      }
    }

    return props;
  }

  /**
   * Extrai imports do arquivo
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Calcula complexidade do componente
   */
  private calculateComplexity(content: string): 'low' | 'medium' | 'high' {
    const lines = content.split('\n').length;
    const hooks = (content.match(/use[A-Z]\w+/g) || []).length;
    const conditions = (content.match(/if\s*\(|switch\s*\(/g) || []).length;

    const score = lines / 10 + hooks * 5 + conditions * 3;

    if (score < 20) return 'low';
    if (score < 50) return 'medium';
    return 'high';
  }

  /**
   * Analisa rotas da aplicação
   */
  private async analyzeRoutes(): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];
    const appDir = join(this.projectRoot, 'app');

    try {
      await this.scanRoutes(appDir, '', routes);
    } catch (error) {
      console.warn('Could not analyze routes:', error);
    }

    return routes;
  }

  /**
   * Escaneia rotas recursivamente
   */
  private async scanRoutes(
    dir: string,
    currentPath: string,
    routes: RouteInfo[]
  ): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('_')) {
          const routePath = join(currentPath, entry.name);
          const fullPath = join(dir, entry.name);

          // Check for route files
          const hasPage = await this.fileExists(join(fullPath, 'page.tsx'));
          if (hasPage) {
            routes.push({
              path: '/' + routePath.replace(/\\/g, '/'),
              type: this.getRouteType(entry.name),
              hasLayout: await this.fileExists(join(fullPath, 'layout.tsx')),
              hasLoading: await this.fileExists(join(fullPath, 'loading.tsx')),
              hasError: await this.fileExists(join(fullPath, 'error.tsx')),
              isProtected: await this.checkIfProtected(fullPath)
            });
          }

          // Recurse
          await this.scanRoutes(fullPath, routePath, routes);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }

  /**
   * Detecta sistema de estilo
   */
  private async detectStyleSystem(): Promise<any> {
    const pkg = await this.getDependencies();

    if (pkg.tailwindcss || pkg['@tailwindcss/typography']) {
      return 'tailwind';
    }
    if (pkg['styled-components']) {
      return 'styled-components';
    }
    if (pkg['@emotion/react']) {
      return 'emotion';
    }
    return 'css-modules';
  }

  /**
   * Extrai tokens de design
   */
  private async extractDesignTokens(): Promise<DesignTokens> {
    const tailwindConfig = join(this.projectRoot, 'tailwind.config.ts');
    
    try {
      const content = await readFile(tailwindConfig, 'utf-8');
      // Parse Tailwind config (simplified)
      return {
        colors: this.extractColors(content),
        spacing: {},
        typography: {},
        breakpoints: {},
        shadows: {},
        borderRadius: {}
      };
    } catch (error) {
      return {
        colors: {},
        spacing: {},
        typography: {},
        breakpoints: {},
        shadows: {},
        borderRadius: {}
      };
    }
  }

  /**
   * Detecta gerenciamento de estado
   */
  private async detectStateManagement(): Promise<any> {
    const pkg = await this.getDependencies();

    if (pkg.zustand) return 'zustand';
    if (pkg.jotai) return 'jotai';
    if (pkg['@reduxjs/toolkit']) return 'redux';
    if (pkg.mobx) return 'mobx';
    return undefined;
  }

  /**
   * Identifica padrões no código
   */
  private async identifyPatterns(): Promise<Pattern[]> {
    // Simplified pattern detection
    return [
      {
        type: 'component-composition',
        description: 'Components using composition pattern',
        frequency: 0,
        examples: []
      }
    ];
  }

  /**
   * Obtém dependências do package.json
   */
  private async getDependencies(): Promise<Record<string, string>> {
    const pkgPath = join(this.projectRoot, 'package.json');
    
    try {
      const content = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);
      return { ...pkg.dependencies, ...pkg.devDependencies };
    } catch (error) {
      return {};
    }
  }

  /**
   * Obtém configuração TypeScript
   */
  private async getTsConfig(): Promise<any> {
    const tsConfigPath = join(this.projectRoot, 'tsconfig.json');
    
    try {
      const content = await readFile(tsConfigPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Constrói estrutura de pastas
   */
  private async buildFolderStructure(): Promise<FolderNode> {
    return this.buildNode(this.projectRoot, '');
  }

  /**
   * Constrói nó da árvore de arquivos
   */
  private async buildNode(path: string, name: string): Promise<FolderNode> {
    const stats = await stat(path);
    
    if (stats.isFile()) {
      return { name, type: 'file', path };
    }

    const entries = await readdir(path, { withFileTypes: true });
    const children = await Promise.all(
      entries
        .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
        .map(e => this.buildNode(join(path, e.name), e.name))
    );

    return {
      name,
      type: 'directory',
      path,
      children
    };
  }

  // Helper methods
  private extractComponentName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.(tsx|jsx)$/, '') || 'Unknown';
  }

  private extractDefaultValue(content: string, propName: string): string | undefined {
    const match = content.match(
      new RegExp(`${propName}\\s*=\\s*([^,}\\s]+)`)
    );
    return match ? match[1] : undefined;
  }

  private getRouteType(dirname: string): 'static' | 'dynamic' | 'catch-all' {
    if (dirname.startsWith('[...')) return 'catch-all';
    if (dirname.startsWith('[')) return 'dynamic';
    return 'static';
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }

  private async checkIfProtected(routePath: string): Promise<boolean> {
    // Check if route requires authentication (simplified)
    const pagePath = join(routePath, 'page.tsx');
    try {
      const content = await readFile(pagePath, 'utf-8');
      return content.includes('requireAuth') || content.includes('protected');
    } catch {
      return false;
    }
  }

  private extractColors(tailwindConfig: string): Record<string, string> {
    // Simplified color extraction
    return {};
  }

  private async getAllFiles(
    dir: string,
    extensions: string[]
  ): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          files.push(...(await this.getAllFiles(fullPath, extensions)));
        } else if (extensions.includes(extname(entry.name))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist
    }

    return files;
  }
}

/**
 * Factory para criar context builder
 */
export function createContextBuilder(projectRoot: string): ContextBuilder {
  return new ContextBuilder(projectRoot);
}
