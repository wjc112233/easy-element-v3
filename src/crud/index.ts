import Crud from './src/crud.vue'
import type { CrudConfig, CrudConstructor } from './src/crud'
export { default as SettingTool } from './src/tools/setting-tool.vue'
export { default as ExportTool } from './src/tools/export-tool.vue'
export { RefreshTool } from './src/tools/refresh-tool'

export function defineCurd<
  DataItem,
  Query,
  DataForCreate,
  DataForUpdate,
  PrimaryKey extends string = 'id'
>(
  crudConfig: CrudConfig<
    DataItem,
    Query,
    DataForCreate,
    DataForUpdate,
    PrimaryKey
  >
) {
  return {
    crudConfig,
    Crud: Crud as unknown as CrudConstructor<
      DataItem,
      Query,
      DataForCreate,
      DataForUpdate,
      PrimaryKey
    >,
  }
}

export { Crud }
