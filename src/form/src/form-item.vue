<script lang="tsx">
import {
  type PropType,
  Teleport,
  defineComponent,
  h,
  isRef,
  onMounted,
  ref,
} from 'vue'
import { ElCol, ElFormItem } from 'element-plus'
import { isString, omit } from 'lodash-es'
import { components } from './components'
import type { ColAttrs, VFormItem } from './form'
import { RenderFn } from '@/utils/RenderFn'

export default defineComponent({
  props: {
    formItem: {
      type: Object as PropType<VFormItem>,
      required: true,
    },
    defaultColAttrs: {
      type: Object as PropType<ColAttrs>,
    },
    prop: {
      type: String,
      required: true,
    },
    model: {
      type: Object as PropType<Record<string, any>>,
      required: true,
    },
    onUpdate: {
      type: Function as PropType<(prop: string, val: any) => any>,
      required: true,
    },
  },
  setup(props) {
    const slots = props.formItem.formItemSlots || {}

    // 如果提供了formItem.appendTo，但不是一个ref，则要让FormItem组件延迟加载。
    // 就是保证让appendTo对应的节点加载完成，然后再加载FormItem组件，再通过Teleport传送到其中
    const isMounted = ref(false)
    onMounted(() => {
      isMounted.value = true
    })

    let component: any
    const renderFormItem = () => {
      component = isString(props.formItem.component)
        ? components.get(props.formItem.component)
        : props.formItem.component
      if (!component && isString(props.formItem.component)) {
        throw new Error(
          `【Form组件】你的component配置使用了一个string类型的值'${props.formItem.component}'，但是它在全局组件中没有找到，请先设置再使用！`
        )
      }
      return (
        <ElFormItem
          key={props.prop}
          label={props.formItem.label}
          prop={props.prop}
          {...(props.formItem.formItemAttrs || {})}
        >
          {{
            default: () => {
              return [
                <RenderFn
                  component={component}
                  value={props.model[props.prop]}
                  model={props.model}
                  prop={props.prop}
                  formItem={props.formItem}
                  onUpdate={(val: any) => props.onUpdate?.(props.prop, val)}
                />,
                slots.default?.(),
              ]
            },
            ...omit(slots, 'default'),
          }}
        </ElFormItem>
      )
    }

    return () => {
      if (props.formItem.appendTo) {
        if (isRef(props.formItem.appendTo)) {
          return props.formItem.appendTo.value ? (
            <Teleport to={props.formItem.appendTo.value}>
              {renderFormItem()}
            </Teleport>
          ) : null
        } else {
          return isMounted.value ? (
            <Teleport to={props.formItem.appendTo}>{renderFormItem()}</Teleport>
          ) : null
        }
      } else {
        return (
          <ElCol
            key={props.prop}
            {...Object.assign(
              {},
              props.defaultColAttrs,
              props.formItem.colAttrs
            )}
          >
            {{ default: renderFormItem }}
          </ElCol>
        )
      }
    }
  },
})
</script>
