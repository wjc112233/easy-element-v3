import type { VFormItem } from "@/form";
import { isBoolean, isString } from "lodash-es";
import type { Columns, CrudForm, VTableColumn } from "./crud";

export function transformItems(
  items: CrudForm['items'],
  columns: Columns
) {
  items = { ...items }
  let column: VTableColumn | string
  for (const key in items) {
    if (isBoolean(items[key])) {
      column = columns[key]!
      if (isString(column)) {
        items[key] = {
          label: column,
          component: 'Input'
        }
      } else {
        items[key] = {
          label: column.label,
          component: column.dicts ? 'Select' : 'Input',
          options: column.dicts?.map(item => ({
            label: item.label,
            value: item.value
          }))
        }
      }
    }
  }
  return items as Record<string, VFormItem>
}
