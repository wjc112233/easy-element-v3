import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { CrudConfig, ElTableInstance } from './crud'
import type { CacheManagement } from './tools/cache-management'

export const crudInjectKey: InjectionKey<{
  cacheManagement: Ref<CacheManagement | undefined>
  reloadTable: () => void
  /**
   * 实际传递给组件的配置
   */
  baseConfig: CrudConfig
  /**
   * 组件实际使用的配置
   */
  crudConfig: ComputedRef<CrudConfig>
  tableData: Array<Record<string, any>>
  elTableRef: Ref<ElTableInstance>
  refresh: () => void
}> = Symbol('crudInjectKeys')
