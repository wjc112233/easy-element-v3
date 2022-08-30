import type { CreateAndUpdateConfig, CrudConfig, CrudConstructor } from './src/crud'
import Crud from './src/crud.vue'

export function defineCurd<
  DataItem,
  Query,
  DataForCreate,
  DataForUpdate,
  PrimaryKey extends string = 'id'
>(
  crudConfig: CrudConfig<DataItem, Query, DataForCreate, DataForUpdate, PrimaryKey>
) {
  return {
    crudConfig,
    Crud: Crud as unknown as CrudConstructor<DataItem, Query, DataForCreate, DataForUpdate, PrimaryKey>
  }
}

export { Crud }
