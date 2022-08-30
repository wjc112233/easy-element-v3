import { ElDatePicker } from "element-plus"
import { h } from "vue"
import type { RenderComponentFn } from "../form"

export const DatePicker: RenderComponentFn<any, any> = (ctx) => {
  const formItem = ctx.formItem = { ...ctx.formItem }
  const attrs = formItem.componentAttrs || (formItem.componentAttrs = {})
  attrs.type = attrs.type || 'datetime'
  attrs.valueFormat = attrs.valueFormat || 'YYYY-MM-DD HH:mm:ss'
  return (
    <ElDatePicker
      modelValue={ctx.value}
      onUpdate:modelValue={ctx.onUpdate}
      {...attrs}
    >
      {ctx.formItem.componentSlots}
    </ElDatePicker>
  )
}