import { type ComputedRef, type Ref, computed, h } from 'vue'
import { isFunction, isString, merge } from 'lodash-es'
import { ElTag } from 'element-plus'
import {
  type CrudConfig,
  DEFAULT_PRIMARY_KEY,
  type TableExpand,
  type VTableColumn,
} from './crud'
import { transformItems } from './helpers'
import type { VFormConfig } from '@/form'

export const useResolveConfig = ({
  crudConfig,
  search,
  totalCount,
  getTableData,
  refresh,
}: {
  crudConfig: ComputedRef<CrudConfig>
  search: (val: Record<string, any>) => void
  totalCount: Ref<number>
  getTableData: () => Promise<void>
  refresh: () => void
}) => {
  const tableAttrs = computed(() => {
    return Object.assign(
      {
        rowKey: crudConfig.value.primaryKey || DEFAULT_PRIMARY_KEY,
      },
      crudConfig.value.tableAttrs
    )
  })

  const tableExpand = computed<TableExpand>(() => {
    if (isFunction(crudConfig.value.tableExpand)) {
      return {
        render: crudConfig.value.tableExpand,
      }
    } else {
      return crudConfig.value.tableExpand!
    }
  })

  const searchConfig = computed(() => {
    if (!crudConfig.value.searchConfig) {
      return null
    }

    const conf = { ...crudConfig.value.searchConfig }

    conf.itemColAttrs = Object.assign(
      {
        offset: 1,
        span: 7,
      },
      conf.itemColAttrs
    )

    conf.action = merge(
      {},
      {
        notResetFormAfterSubmited: true,
        colAttrs: { span: 24, style: 'text-align:center' },
        submitButton: { text: '搜索' },
      },
      conf.action
    )
    const originalOnSubmit = conf.action.onSubmit
    conf.action.onSubmit = (data) => {
      search(data)
      originalOnSubmit?.(data)
    }
    const originalOnReset = conf.action.onReset
    conf.action.onReset = () => {
      search({})
      originalOnReset?.()
    }

    conf.items = transformItems(conf.items, crudConfig.value.columns)

    return conf as VFormConfig
  })

  const paginationConfig = computed(() => {
    const conf = Object.assign(
      {
        pageSizes: [10, 20, 30, 40, 50, 100],
        total: totalCount.value || 0,
        layout: 'total,sizes,prev,pager,next,jumper',
      },
      crudConfig.value.paginationAttrs
    )
    const originalOnSizeChange = conf['onSize-change']
    const originalOnCurrentChange = conf['onCurrent-change']
    conf['onSize-change'] = (val) => {
      refresh()
      originalOnSizeChange?.(val)
    }
    conf['onCurrent-change'] = (val) => {
      getTableData()
      originalOnCurrentChange?.(val)
    }
    return conf
  })

  const createButton = computed(() => {
    if (!crudConfig.value.handleCreate) {
      return null
    }

    const defaultAttrs = {
      name: '新增',
      attrs: { type: 'primary' } as const,
    }
    return isFunction(crudConfig.value.handleCreate)
      ? defaultAttrs
      : merge(defaultAttrs, crudConfig.value.handleCreate)
  })

  return {
    tableAttrs,
    tableExpand,
    searchConfig,
    paginationConfig,
    createButton,
  }
}
