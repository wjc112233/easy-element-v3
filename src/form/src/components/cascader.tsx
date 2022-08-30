import { ElCascader } from "element-plus"
import { h } from "vue"
import type { RenderComponentFn } from "../form"

export const Cascader: RenderComponentFn<any, any> = (ctx) => {
  return (
    <ElCascader
      modelValue={ctx.value}
      onUpdate:modelValue={ctx.onUpdate}
      {...ctx.formItem.componentAttrs}
    >
      {ctx.formItem.componentSlots}
    </ElCascader>
  )
}