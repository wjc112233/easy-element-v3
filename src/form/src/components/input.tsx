import { ElInput } from "element-plus"
import { h } from "vue"
import type { RenderComponentFn } from "../form"

export const Input: RenderComponentFn<any, any> = (ctx) => {
  return (
    <ElInput
      modelValue={ctx.value}
      onUpdate:modelValue={ctx.onUpdate}
      {...ctx.formItem.componentAttrs}
    >
      {ctx.formItem.componentSlots}
    </ElInput>
  )
}

export const Textarea: RenderComponentFn<any, any> = (ctx) => {
  const formItem = ctx.formItem = { ...ctx.formItem }
  ;(formItem.componentAttrs || (formItem.componentAttrs = {})).type = 'textarea'
  return Input(ctx)
}