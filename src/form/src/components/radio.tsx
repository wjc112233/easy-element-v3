import { ElRadioGroup, ElRadio } from "element-plus"
import { h } from "vue"
import type { RenderComponentFn } from "../form"

export const Radio: RenderComponentFn<any, any> = (ctx) => {
  return (
    <ElRadioGroup
      modelValue={ctx.value}
      onUpdate:modelValue={ctx.onUpdate}
      {...ctx.formItem.componentAttrs}
    >
      {{
        default: () => {
          return ctx.formItem.options?.map(opt => {
            return (
              <ElRadio label={opt.value} {...opt.attrs}>
                {{
                  default: () => {
                    return ctx.formItem.optionRender ? (
                      ctx.formItem.optionRender(opt)
                    ) : (
                      <span>{opt.label}</span>
                    )
                  }
                }}
              </ElRadio>
            )
          })
        },
        ...(ctx.formItem.componentSlots || {})
      }}
    </ElRadioGroup>
  )
}