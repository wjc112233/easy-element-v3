import { h } from 'vue'
import { ElCheckbox, ElCheckboxGroup } from 'element-plus'
import type { RenderComponentFn } from '../form'

export const Checkbox: RenderComponentFn<any, any> = (ctx) => {
  return (
    <ElCheckboxGroup
      modelValue={ctx.value}
      onUpdate:modelValue={ctx.onUpdate}
      {...ctx.formItem.componentAttrs}
    >
      {{
        default: () => {
          return ctx.formItem.options?.map((opt) => {
            return (
              <ElCheckbox label={opt.value} {...opt.attrs}>
                {{
                  default: () => {
                    return ctx.formItem.optionRender ? (
                      ctx.formItem.optionRender(opt)
                    ) : (
                      <span>{opt.label}</span>
                    )
                  },
                }}
              </ElCheckbox>
            )
          })
        },
        ...(ctx.formItem.componentSlots || {}),
      }}
    </ElCheckboxGroup>
  )
}
