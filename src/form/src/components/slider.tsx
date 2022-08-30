import { ElSlider } from "element-plus"
import { h } from "vue"
import type { RenderComponentFn } from "../form"

export const Slider: RenderComponentFn<any, any> = (ctx) => {
  return (
    <ElSlider
      modelValue={ctx.value}
      onUpdate:modelValue={ctx.onUpdate}
      {...ctx.formItem.componentAttrs}
    />
  )
}
