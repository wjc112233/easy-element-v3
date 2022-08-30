import { h } from 'vue'
import { ElSlider } from 'element-plus'
import type { RenderComponentFn } from '../form'

export const Slider: RenderComponentFn<any, any> = (ctx) => {
  return (
    <ElSlider
      modelValue={ctx.value}
      onUpdate:modelValue={ctx.onUpdate}
      {...ctx.formItem.componentAttrs}
    />
  )
}
