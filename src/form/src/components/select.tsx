import { ElSelect, ElOption } from "element-plus"
import { h } from "vue"
import type { RenderComponentFn } from "../form"

export const Select: RenderComponentFn<any, any> = (ctx) => {
  return (
    <ElSelect
      modelValue={ctx.value}
      onUpdate:modelValue={ctx.onUpdate}
      {...ctx.formItem.componentAttrs}
    >
      {{
        default: () => {
          return ctx.formItem.options?.map(opt => {
            return (
              <ElOption label={opt.label} value={opt.value} {...opt.attrs}>
                {ctx.formItem.optionRender ? {
                  default: () => ctx.formItem.optionRender?.(opt)
                } : null}
              </ElOption>
            )
          })
        },
        ...(ctx.formItem.componentSlots || {})
      }}
    </ElSelect>
  )
}