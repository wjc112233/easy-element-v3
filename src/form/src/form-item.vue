<script lang="tsx">
import { ElCol, ElFormItem } from 'element-plus';
import { RenderFn } from '@/utils/RenderFn'
import { defineComponent, h, onMounted, type PropType, ref, Teleport, type VNode, isRef, computed } from 'vue';
import type { ColAttrs, VFormItem } from './form';
import { components } from './components'
import { isString, omit } from 'lodash-es'

export default defineComponent({
  props: {
    formItem: {
      type: Object as PropType<VFormItem>,
      required: true
    },
    defaultColAttrs: {
      type: Object as PropType<ColAttrs>,
    },
    prop: {
      type: String,
      required: true
    },
    model: {
      type: Object as PropType<Record<string, any>>,
      required: true
    },
    onUpdate: {
      type: Function as PropType<((prop: string, val: any) => any)>,
      required: true
    }
  },
  setup({ formItem, prop, defaultColAttrs, model, onUpdate }) {
    const slots = formItem.formItemSlots || {}

    // 如果提供了formItem.appendTo，但不是一个ref，则要让FormItem组件延迟加载。
    // 就是保证让appendTo对应的节点加载完成，然后再加载FormItem组件，再通过Teleport传送到其中
    const isMounted = ref(false)
    onMounted(() => {
      isMounted.value = true
    })

    let component: any
    const renderFormItem = () => {
      component = isString(formItem.component) ? components.get(formItem.component) : formItem.component
      if (!component && isString(formItem.component)) {
        throw Error(`【Form组件】你的component配置使用了一个string类型的值'${formItem.component}'，但是它在全局组件中没有找到，请先设置再使用！`)
      }
      return (
        <ElFormItem
          key={prop}
          label={formItem.label}
          prop={prop}
          {...(formItem.formItemAttrs || {})}
        >
          {{
            default: () => {
              return [
                (
                  <RenderFn
                    component={component}
                    value={model[prop]}
                    model={model}
                    prop={prop}
                    formItem={formItem}
                    onUpdate={(val: any) => onUpdate?.(prop, val)}
                  />
                ),
                slots.default?.()
              ]
            },
            ...omit(slots, 'default')
          }}
        </ElFormItem>
      )
    }

    return () => {
      if (formItem.appendTo) {
        if (isRef(formItem.appendTo)) {
          return formItem.appendTo.value ? (
            <Teleport to={formItem.appendTo.value}>
              { renderFormItem() }
            </Teleport>
          ) : null
        } else {
          return isMounted.value ? (
            <Teleport to={formItem.appendTo}>
              { renderFormItem() }
            </Teleport>
          ) : null
        }
      } else {
        return (
          <ElCol key={prop} {...Object.assign({}, defaultColAttrs, formItem.colAttrs)}>
            {{ default: renderFormItem }}
          </ElCol>
        )
      }
    }
  }
})
</script>