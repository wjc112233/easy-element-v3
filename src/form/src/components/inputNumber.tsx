import { h } from 'vue'
import { ElInputNumber } from 'element-plus'
import type { RenderComponentFn } from '../form'

export const InputNumber: RenderComponentFn<any, any> = (ctx) => {
  return (
    <ElInputNumber
      modelValue={ctx.value}
      onUpdate:modelValue={ctx.onUpdate}
      {...ctx.formItem.componentAttrs}
    />
  )
}
