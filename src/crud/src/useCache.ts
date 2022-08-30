
import type { TableColumnCtx } from "element-plus/es/components/table/src/table-column/defaults";
import { isArray, isBoolean, isEmpty, isString, merge } from "lodash-es";
import { reactive, type InjectionKey } from "vue";
import type { CrudConfig, VTableColumn } from "./crud";

export interface FieldColumnCacheRecord {
  width?: number
  show?: boolean
  index?: number
  fixed?: TableColumnCtx<{}>['fixed']
}
interface TableRecord {
  __index__?: { width: number }
  __action__?: { width: number }
  columnsRecord?: Record<string, FieldColumnCacheRecord>
}
export const cacheManagementInjectKey: InjectionKey<CacheManagement> = Symbol('cacheManagementInjectKey')
export class CacheManagement {
  private readonly keyPrefix = 'Crud__'
  private readonly conf: CrudConfig

  private record: TableRecord
  getRecord() {
    return this.record
  }

  private originalOnHeaderDragend: ((...args: any[]) => any) | undefined

  constructor(config: CrudConfig) {
    this.conf = config
    this.originalOnHeaderDragend = config.tableAttrs?.['onHeader-dragend']
    let r: any = config.cacheKey && localStorage.getItem(this._getKey())
    this.record = reactive(r ? JSON.parse(r) : {})
  }

  mergeConfig() {
    if (!this.conf.cacheKey) {
      return this.conf
    }

    const conf = merge(
      {
        tableAttrs: {
          'onHeader-dragend': (...args: any[]) => {
            this._onHeaderDragend(...args)
          }
        }
      },
      this.conf
    )
    const record = this.record
    if (!record) {
      return conf
    }

    const { __index__, __action__, columnsRecord } = record
    if (__index__) {
      conf.tableIndex = isBoolean(conf.tableIndex)
        ? __index__
        : Object.assign(__index__, conf.tableIndex)
    }
    if (__action__) {
      conf.tableAction = Object.assign(
        __action__,
        isArray(conf.tableAction)
          ? { items: conf.tableAction }
          : conf.tableAction
      )
    }
    // 对字段进行隐藏、合并默认属性、排序
    if (columnsRecord && !isEmpty(columnsRecord)) {
      const columns = { ...conf.columns }
      let indexedCols: Array<[string, VTableColumn]> = []
      const cols: Array<[string, VTableColumn]> = []
      let r: FieldColumnCacheRecord, col: VTableColumn
      Object.keys(columns).forEach((key) => {
        r = columnsRecord[key]
        col = (isString(columns[key])
          ? { label: columns[key] }
          : columns[key]) as VTableColumn
        if (!r) {
          cols.push([key, col])
          return
        }
        if (r.show !== false) {
          col = merge(
            {},
            col,
            {
              width: r?.width,
              attrs: { fixed: r.fixed }
            }
          )
          if (r.index !== undefined) {
            indexedCols[r.index] = [key, col]
          } else {
            cols.push([key, col])
          }
        }
      })
      conf.columns = Object.fromEntries([
        ...indexedCols.filter(Boolean),
        ...cols
      ])
    }

    return conf
  }

  setRecord(r: TableRecord) {
    merge(this.record, r)
    localStorage.setItem(this._getKey(), JSON.stringify(this.record))
  }

  /**
   * 缓存表格宽度
   */
  private _onHeaderDragend(...args: any[]) {
    this.originalOnHeaderDragend?.(...args)

    const width: number = args[0]
    const colProps = args[2]

    if (colProps.property) {
      this.setRecord({
        columnsRecord: {
          [colProps.property]: { width: width }
        }
      })
      return
    }

    // 是否索引列
    if (colProps.type === 'index') {
      this.setRecord({ __index__: { width: width }})
      return
    }

    // 是否操作列
    const event = args[3]
    const trElement = event.path.find((el: any) => el.classList && el.classList.contains('el-table__cell'))
    if (
      colProps.type === 'default' &&
      !colProps.property &&
      trElement &&
      !trElement.nextSibling
    ) {
      this.setRecord({ __action__: { width: width }})
    }
  }

  private _getKey() {
    return this.keyPrefix + this.conf.cacheKey
  }

}