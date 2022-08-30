import { h } from 'vue'
import { ElSwitch } from 'element-plus'
import type { RenderComponentFn } from '../form'

export const Switch: RenderComponentFn<any, any> = (ctx) => {
  return (
    <ElSwitch
      modelValue={ctx.value}
      onUpdate:modelValue={ctx.onUpdate}
      {...ctx.formItem.componentAttrs}
    />
  )
}
