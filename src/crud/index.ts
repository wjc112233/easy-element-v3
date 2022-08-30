import Crud from './src/crud.vue'
import type { CrudConfig, CrudConstructor } from './src/crud'

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
