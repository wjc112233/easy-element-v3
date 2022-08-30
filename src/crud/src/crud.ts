import type { DefineComponent, PropType, Ref, Slots, VNode } from 'vue'
import type { ButtonProps, PopconfirmProps, TagProps } from 'element-plus'
import type {
  MergeAttrs,
  PartialMutable,
  PartialPick,
  RemoveUnionType,
  ReplaceType,
  SetDataFn,
  WithNativeAttrs,
} from '@/utils/typescript'
import type { TableColumnCtx } from 'element-plus/es/components/table/src/table-column/defaults'
import type { Table } from 'element-plus/es/components/table/src/table/defaults'
import type { Store } from 'element-plus/es/components/table/src/store'
import type { VFormConfig, VFormItem } from '@/form'
import type { Mutable } from 'element-plus/es/utils'
import type { VPopupProps } from '@/popup'

export interface CrudResponse<DataItem = any> {
  data: DataItem[]
  count: number
  totalPages: number
  pageSize: number
  [x: string]: any
}

export type PaginationParams<T> = {
  pageNo: number
  pageSize: number
} & T

interface BaseColumnSlotScope<DataItem = Record<string, any>> {
  $index: number
  store: Store<DataItem>
}
interface ColumnHeaderSlotScope<DataItem = Record<string, any>>
  extends BaseColumnSlotScope<DataItem> {
  _self: Table<DataItem>
  column: TableColumnCtx<DataItem>
}
interface ColumnContentSlotScope<DataItem = Record<string, any>>
  extends BaseColumnSlotScope<DataItem> {
  cellIndex: number
  row: DataItem
  _self: Table<DataItem>
  column: TableColumnCtx<DataItem>
}
interface ColumnExpandSlotScope<DataItem = Record<string, any>>
  extends BaseColumnSlotScope<DataItem> {
  expanded: boolean
  row: DataItem
}
type ElTableColumnProps = InstanceType<
  typeof import('element-plus').ElTableColumn
>['$props']
export type ElTableInstance = InstanceType<
  typeof import('element-plus').ElTable
>
type ElDropDownProps = InstanceType<
  typeof import('element-plus').ElDropdown
>['$props']
type ElDropDownItemProps = InstanceType<
  typeof import('element-plus').ElDropdownItem
>['$props']
type ElPaginationProps = InstanceType<
  typeof import('element-plus').ElPagination
>['$props']

type Dict<Value = any> = {
  label: string
  value: Value
  textColor?: string
  tag?: TagProps['type'] | PartialMutable<TagProps>
}

export interface VTableColumn<
  DataItem = Record<string, any>,
  Prop extends keyof DataItem = keyof DataItem
> {
  width?: number | string
  label: string
  attrs?: Omit<
    ElTableColumnProps,
    | 'width'
    | 'prop'
    | 'label'
    | 'type'
    | 'index'
    | 'selectable'
    | 'reserveSelection'
  >
  dicts?: Array<Dict<DataItem[Prop]>>
  renderContent?: (
    attrs: {
      value: DataItem[Prop]
      dict?: Dict<DataItem[Prop]>
    } & ColumnContentSlotScope<DataItem>
  ) => VNode
  renderHeader?: (attrs: ColumnHeaderSlotScope<DataItem>) => VNode
}

export type TableExpand = PartialPick<
  ElTableColumnProps,
  'label' | 'fixed' | 'width'
> & {
  render: (attrs: ColumnExpandSlotScope) => VNode
}
export type TableAction<DataItem = Record<string, any>> = PartialPick<
  ElTableColumnProps,
  'label' | 'fixed' | 'width'
> & {
  items?: Array<TableActionButton<DataItem>>
  buttonAttrs?: WithNativeAttrs<PartialMutable<ButtonProps>>
  useDropdown?: true | (Mutable<ElDropDownProps> & { text?: string })
}
export type ButtonClick<DataItem = Record<string, any>> = (
  data: DataItem,
  methods: {
    showLoading: () => void
    cancelLoading: () => void
    setData: SetDataFn<DataItem>
  }
) => any
export interface TableActionButton<DataItem = Record<string, any>> {
  name?: string
  click: ButtonClick<DataItem>
  attrs?: WithNativeAttrs<PartialMutable<ButtonProps>>
  dynamicLoad?: (
    data: DataItem,
    button: { name?: string; attrs: PartialMutable<ButtonProps> }
  ) => void
  show?: Ref<boolean> | ((data: DataItem) => boolean)
  dropdownItem?: false | Mutable<ElDropDownItemProps>
  confirm?: boolean | string | PartialMutable<PopconfirmProps>
}
type HandleDelete<DataItem = Record<string, any>> = Pick<
  TableActionButton<DataItem>,
  'name' | 'attrs' | 'confirm' | 'dropdownItem'
> & {
  handler: (data: DataItem) => Promise<any>
  position?: number
}
type HandleUpdate<
  DataForUpdate = Record<string, any>,
  DataItem = Record<string, any>
> = Pick<TableActionButton<DataItem>, 'name' | 'attrs' | 'dropdownItem'> & {
  handler: (data: DataForUpdate, row: DataItem) => Promise<any>
  position?: number
}
export type HandleCreate<DataForCreate = Record<string, any>> = {
  name?: string
  attrs?: WithNativeAttrs<PartialMutable<ButtonProps>>
  handler: (data: DataForCreate) => Promise<any>
}

export type Columns<DataItem = Record<string, any>> = {
  [K in keyof DataItem]?: VTableColumn<DataItem, K> | string
}

export const DEFAULT_PRIMARY_KEY = 'id'
type DefaultPrimaryKey = typeof DEFAULT_PRIMARY_KEY

export interface CrudConfig<
  DataItem = Record<string, any>,
  Query = Record<string, any>,
  DataForCreate = Record<string, any>,
  DataForUpdate = Record<string, any>,
  PrimaryKey extends string = DefaultPrimaryKey,
  Cols extends Columns<DataItem> = Columns<DataItem>
> {
  cacheKey?: string
  readonly primaryKey?: PrimaryKey
  columns: Cols
  requestApi: (
    params: PaginationParams<Query>
  ) => Promise<CrudResponse<DataItem>>
  immediateRequest?: false
  tableIndex?:
    | true
    | PartialPick<ElTableColumnProps, 'index' | 'label' | 'fixed' | 'width'>
  tableSelection?:
    | true
    | PartialPick<
        ElTableColumnProps,
        'selectable' | 'reserveSelection' | 'fixed' | 'width'
      >
  tableExpand?: TableExpand | TableExpand['render']
  tableAttrs?: MergeAttrs<Omit<ElTableInstance['$props'], 'data'>>
  tableSlots?: Slots
  tableAction?: TableAction<DataItem> | TableAction<DataItem>['items']

  handleDelete?: HandleDelete<DataItem> | HandleDelete<DataItem>['handler']
  handleUpdate?:
    | HandleUpdate<DataForUpdate, DataItem>
    | HandleUpdate<DataForUpdate, DataItem>['handler']
  handleCreate?:
    | HandleCreate<DataForCreate>
    | HandleCreate<DataForCreate>['handler']

  searchConfig?: CrudForm<Query, keyof Cols>
  createAndUpdateConfig?:
    | CreateAndUpdateConfig<
        DataForCreate,
        Omit<DataForUpdate, PrimaryKey>,
        keyof Cols
      >
    | ((
        isUpdateMode: Ref<boolean>
      ) => CreateAndUpdateConfig<
        DataForCreate,
        Omit<DataForUpdate, PrimaryKey>,
        keyof Cols
      >)
  paginationAttrs?: Omit<
    PartialMutable<ElPaginationProps>,
    'pageSize' | 'total' | 'pageCount' | 'currentPage'
  >
}

export type CreateAndUpdateConfig<
  DataForCreate = Record<string, any>,
  DataForUpdate = Record<string, any>,
  ColumnKeys = string
> = {
  popupAttrs?: VPopupProps
  formAttrs: CrudForm<DataForCreate & DataForUpdate, ColumnKeys, false>
  formSlots?: Slots
}

export type CrudForm<
  FormModel = Record<string, any>,
  ColumnKeys = string,
  WithAction extends boolean = true
> = ReplaceType<
  VFormConfig<FormModel>,
  {
    action?: WithAction extends true
      ? Partial<RemoveUnionType<VFormConfig<FormModel>['action'], false>>
      : false
    items: {
      [K in keyof FormModel]?:
        | (K extends ColumnKeys ? true : never)
        | VFormItem<FormModel, K>
    }
  }
>

export type CrudProps<
  DataItem = Record<string, any>,
  Query = Record<string, any>,
  DataForCreate = Record<string, any>,
  DataForUpdate = Record<string, any>,
  PrimaryKey extends string = DefaultPrimaryKey
> = {
  config: {
    type: PropType<
      CrudConfig<DataItem, Query, DataForCreate, DataForUpdate, PrimaryKey>
    >
    required: true
  }
}
export const _crudProps: CrudProps = {
  config: {
    type: Object as PropType<CrudConfig>,
    required: true,
  },
}
export type CrudConstructor<
  DataItem = Record<string, any>,
  Query = Record<string, any>,
  DataForCreate = Record<string, any>,
  DataForUpdate = Record<string, any>,
  PrimaryKey extends string = DefaultPrimaryKey
> = DefineComponent<
  CrudProps<DataItem, Query, DataForCreate, DataForUpdate, PrimaryKey>,
  Record<string, any>
>
export type CrudInstance<
  DataItem = Record<string, any>,
  Query = Record<string, any>,
  DataForCreate = Record<string, any>,
  DataForUpdate = Record<string, any>,
  PrimaryKey extends string = DefaultPrimaryKey
> = InstanceType<
  CrudConstructor<DataItem, Query, DataForCreate, DataForUpdate, PrimaryKey>
>
