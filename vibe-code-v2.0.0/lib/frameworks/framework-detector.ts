/**
 * Framework Detector & Support
 * SUPORTA: React, Vue, Svelte, Angular, Solid (não apenas React como Lovable)
 */

export type Framework = 
  | 'react'
  | 'vue'
  | 'svelte'
  | 'angular'
  | 'solid'
  | 'astro';

export interface FrameworkConfig {
  name: Framework;
  fileExtensions: string[];
  packageName: string;
  buildCommand: string;
  devCommand: string;
}

const FRAMEWORK_CONFIGS: Record<Framework, FrameworkConfig> = {
  react: {
    name: 'react',
    fileExtensions: ['.jsx', '.tsx'],
    packageName: 'react',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  vue: {
    name: 'vue',
    fileExtensions: ['.vue'],
    packageName: 'vue',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  svelte: {
    name: 'svelte',
    fileExtensions: ['.svelte'],
    packageName: 'svelte',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  angular: {
    name: 'angular',
    fileExtensions: ['.component.ts'],
    packageName: '@angular/core',
    buildCommand: 'ng build',
    devCommand: 'ng serve',
  },
  solid: {
    name: 'solid',
    fileExtensions: ['.jsx', '.tsx'],
    packageName: 'solid-js',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
  astro: {
    name: 'astro',
    fileExtensions: ['.astro'],
    packageName: 'astro',
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
  },
};

export class FrameworkDetector {
  /**
   * Detecta framework baseado em package.json
   */
  detectFromPackageJson(packageJson: any): Framework | null {
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    for (const [framework, config] of Object.entries(FRAMEWORK_CONFIGS)) {
      if (deps[config.packageName]) {
        return framework as Framework;
      }
    }

    return null;
  }

  /**
   * Detecta framework baseado em extensões de arquivo
   */
  detectFromFiles(files: string[]): Framework | null {
    const extensionCount: Record<Framework, number> = {
      react: 0,
      vue: 0,
      svelte: 0,
      angular: 0,
      solid: 0,
      astro: 0,
    };

    for (const file of files) {
      for (const [framework, config] of Object.entries(FRAMEWORK_CONFIGS)) {
        if (config.fileExtensions.some((ext) => file.endsWith(ext))) {
          extensionCount[framework as Framework]++;
        }
      }
    }

    // Retorna framework com mais arquivos
    const max = Math.max(...Object.values(extensionCount));
    if (max === 0) return null;

    return (Object.keys(extensionCount).find(
      (k) => extensionCount[k as Framework] === max
    ) as Framework) || null;
  }

  /**
   * Obtém configuração do framework
   */
  getConfig(framework: Framework): FrameworkConfig {
    return FRAMEWORK_CONFIGS[framework];
  }

  /**
   * Verifica se framework é suportado
   */
  isSupported(framework: string): boolean {
    return framework in FRAMEWORK_CONFIGS;
  }
}

export const frameworkDetector = new FrameworkDetector();
