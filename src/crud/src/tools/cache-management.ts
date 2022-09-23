import { reactive } from 'vue'
import {
  cloneDeep,
  get,
  isArray,
  isBoolean,
  isEmpty,
  isFunction,
  isNumber,
  isString,
  merge,
  omit,
} from 'lodash-es'
import type { TableColumnCtx } from 'element-plus/es/components/table/src/table-column/defaults'
import type { Columns, CrudConfig, VTableColumn } from '../crud'

export interface ColumnCacheRecord {
  width?: number
  show?: boolean
  index?: number
  fixed?: TableColumnCtx<Record<string, any>>['fixed']
  children?: Record<string, ColumnCacheRecord>
}
export enum SpecialColumnsEnum {
  INDEX = '__index__',
  SELECTION = '__selection__',
  EXPAND = '__expand__',
  ACTION = '__action__',
}
interface TableRecord {
  columnsRecord?: Record<string, ColumnCacheRecord>
}

export class CacheManagement {
  private readonly keyPrefix = 'Crud__'
  private readonly conf: CrudConfig

  private record: TableRecord
  getRecord() {
    return this.record
  }

  reloadTable: () => void

  private originalOnHeaderDragend: ((...args: any[]) => any) | undefined

  constructor(config: CrudConfig, reloadTable: () => void) {
    this.reloadTable = reloadTable
    this.conf = config
    this.originalOnHeaderDragend = config.tableAttrs?.['onHeader-dragend']
    const r: any = config.cacheKey && localStorage.getItem(this._getKey())
    this.record = reactive(r ? JSON.parse(r) : {})
  }

  resolveColumnsRecord() {
    const columnsRecord = this.record.columnsRecord || {}
    return {
      __index__: columnsRecord[SpecialColumnsEnum.INDEX],
      __action__: columnsRecord[SpecialColumnsEnum.ACTION],
      __selection__: columnsRecord[SpecialColumnsEnum.SELECTION],
      __expand__: columnsRecord[SpecialColumnsEnum.EXPAND],
      fieldsRecord: omit(
        columnsRecord,
        Object.values(SpecialColumnsEnum)
      ) as Record<string, ColumnCacheRecord>,
    }
  }

  mergeConfig() {
    const conf = cloneDeep(this.conf)
    ;(conf.tableAttrs || (conf.tableAttrs = {}))['onHeader-dragend'] = (
      ...args: any[]
    ) => {
      this._onHeaderDragend(...args)
    }

    if (isEmpty(this.record)) {
      return conf
    }

    const { __index__, __action__, __expand__, __selection__, fieldsRecord } =
      this.resolveColumnsRecord()
    if (conf.tableExpand) {
      if (__expand__?.show === false) {
        delete conf.tableExpand
      } else {
        conf.tableExpand = isFunction(conf.tableExpand)
          ? { render: conf.tableExpand }
          : conf.tableExpand
        if (__expand__?.fixed) {
          conf.tableExpand.fixed = __expand__.fixed
        }
      }
    }
    if (__selection__) {
      if (__selection__.show === false) {
        delete conf.tableSelection
      } else {
        conf.tableSelection =
          !conf.tableSelection || isBoolean(conf.tableSelection)
            ? {}
            : conf.tableSelection
        if (__selection__.fixed) {
          conf.tableSelection.fixed = __selection__.fixed
        }
      }
    }
    if (__index__) {
      if (__index__.show === false) {
        delete conf.tableIndex
      } else {
        conf.tableIndex =
          !conf.tableIndex || isBoolean(conf.tableIndex) ? {} : conf.tableIndex
        if (__index__.fixed) {
          conf.tableIndex.fixed = __index__.fixed
        }
        if (__index__.width) {
          conf.tableIndex.width = __index__.width
        }
      }
    }
    if (conf.tableAction) {
      if (__action__?.show === false) {
        delete conf.tableAction
        delete conf.handleDelete
        delete conf.handleUpdate
      } else {
        conf.tableAction = isArray(conf.tableAction)
          ? { items: conf.tableAction }
          : conf.tableAction
        if (__action__?.fixed) {
          conf.tableAction.fixed = __action__.fixed
        }
        if (__action__?.width) {
          conf.tableAction.width = __action__.width
        }
      }
    }
    conf.columns = this.getColumns(false, conf.columns, fieldsRecord)

    return conf
  }

  /**
   * 获取一个由缓存记录转化过的表格列配置
   *
   * @param withHidden 是否包含被隐藏项
   * @param columns 原来的表格列配置
   * @param columnsRecord 缓存记录
   */
  getColumns(
    withHidden?: boolean,
    columns?: Columns,
    columnsRecord?: Record<string, ColumnCacheRecord>
  ) {
    // 默认获取全部的表格列，兼容一下
    columns = columns || cloneDeep(this.conf).columns
    columnsRecord = columnsRecord || this.resolveColumnsRecord().fieldsRecord

    const indexedCols: Array<[string, VTableColumn]> = []
    const cols: Array<[string, VTableColumn]> = []

    let r: ColumnCacheRecord
    let col: VTableColumn
    Object.keys(columns).forEach((key) => {
      r = columnsRecord![key]
      col = (
        isString(columns![key]) ? { label: columns![key] } : columns![key]
      ) as VTableColumn

      if (!r) {
        cols.push([key, col])
        return
      }

      if (withHidden || r.show !== false) {
        col.width = r.width ?? col.width
        ;(col.attrs || (col.attrs = {})).fixed = r.fixed ?? col.attrs.fixed

        if (col.children && r.children) {
          col.children = this.getColumns(withHidden, col.children, r.children)
          if (isEmpty(col.children)) {
            return
          }
        }

        if (isNumber(r.index)) {
          indexedCols[r.index] = [key, col]
        } else {
          cols.push([key, col])
        }
      }
    })

    return Object.fromEntries([...indexedCols.filter(Boolean), ...cols])
  }

  setRecord(r: TableRecord) {
    merge(this.record, r)
    this.reloadTable()
    if (this.conf.cacheKey) {
      localStorage.setItem(this._getKey(), JSON.stringify(this.record))
    }
  }

  /**
   * @example
   * ```js
   * pathToRecord('a.b.c', { width: 100 })
   * // => { a: { children: { b: { children: { c: { width: 100 } } } } } }
   * ```
   */
  pathToColumnRecord(path: string, record: Partial<ColumnCacheRecord>) {
    const obj: any = {}
    let o = obj
    const keys = path.split('.')
    keys.forEach((prop, index) => {
      if (index === keys.length - 1) {
        o[prop] = record
      } else {
        o[prop] = { children: {} }
        o = o[prop].children
      }
    })
    return obj
  }

  /**
   * @example
   * ```js
   * // columnsRecord = { a: { children: { b: { width: 100 } } } }
   * getColumnRecordByPath('a.b')
   * // => { width: 100 }
   * ```
   */
  getColumnRecordByPath(path: string) {
    return get(
      this.getRecord().columnsRecord || {},
      path.replaceAll('.', '.children.')
    ) as ColumnCacheRecord | undefined
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
        columnsRecord: this.pathToColumnRecord(colProps.property, { width }),
      })
      return
    }

    // 是否索引列
    if (colProps.type === 'index') {
      this.setRecord({
        columnsRecord: { [SpecialColumnsEnum.INDEX]: { width } },
      })
      return
    }

    // 是否操作列
    const event = args[3]
    const trElement = event.path.find(
      (el: any) => el.classList && el.classList.contains('el-table__cell')
    )
    if (
      colProps.type === 'default' &&
      !colProps.property &&
      trElement &&
      !trElement.nextSibling
    ) {
      this.setRecord({
        columnsRecord: { [SpecialColumnsEnum.ACTION]: { width } },
      })
    }
  }

  private _getKey() {
    return this.keyPrefix + this.conf.cacheKey
  }
}
