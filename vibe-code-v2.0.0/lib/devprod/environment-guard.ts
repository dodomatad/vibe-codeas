/**
 * Environment Guard
 * EVITA INCIDENTE REPLIT (deleção de database prod)
 */

export class EnvironmentGuard {
  private static readonly PROTECTED_OPERATIONS = [
    'database_delete',
    'database_drop',
    'database_truncate',
    'schema_migration_down',
    'user_data_delete',
  ];

  /**
   * Executa operação APENAS em dev
   * BLOQUEIA se produção
   */
  static async executeInDev(
    operation: () => Promise<void>,
    operationType: string
  ): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `🚨 OPERAÇÃO BLOQUEADA: "${operationType}" não pode executar em produção!`
      );
    }

    if (this.PROTECTED_OPERATIONS.includes(operationType)) {
      console.warn(
        `⚠️ Executando operação protegida "${operationType}" em dev`
      );
    }

    await operation();
  }

  /**
   * Requer múltiplas confirmações para operações críticas em prod
   */
  static async executeInProdWithConfirmation(
    operation: () => Promise<void>,
    confirmationCount: number = 3
  ): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      await operation();
      return;
    }

    console.error(
      `🚨 ATENÇÃO: Operação crítica em PRODUÇÃO requer ${confirmationCount} confirmações`
    );

    // Implementar sistema de confirmação multi-step
    // Exemplo: email + SMS + manual approval

    throw new Error(
      'Operações críticas em produção requerem aprovação manual'
    );
  }

  /**
   * Verifica se pode fazer operação destructiva
   */
  static canExecuteDestructiveOperation(): boolean {
    return process.env.NODE_ENV !== 'production';
  }
}
