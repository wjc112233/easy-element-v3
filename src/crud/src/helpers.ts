import { isBoolean, isString } from 'lodash-es'
import type { VFormItem } from '@/form'
import type { Columns, CrudForm, VTableColumn } from './crud'

/**
 * 转化`searchConfig`或`createAndUpdateConfig`的`items`配置
 */
export function transformItems(items: CrudForm['items'], columns: Columns) {
  items = { ...items }
  let column: VTableColumn | string
  for (const key in items) {
    if (isBoolean(items[key])) {
      column = columns[key]!
      // 如果表格列配置存在dicts配置，则默认为一个下拉框组件，否则默认为输入框组件
      if (isString(column)) {
        items[key] = {
          label: column,
          component: 'Input',
        }
      } else {
        items[key] = {
          label: column.label,
          component: column.dicts ? 'Select' : 'Input',
          options: column.dicts?.map((item) => ({
            label: item.label,
            value: item.value,
          })),
        }
      }
    }
  }
  return items as Record<string, VFormItem>
}

export function normalizeColumn(column: Columns[string]) {
  if (!column) {
    return
  }
  return isString(column) ? { label: column } : column
}
