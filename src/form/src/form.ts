import type { RenderFnType } from '@/utils/RenderFn'
import type { ButtonWithText, MergeAttrs, PartialMutable, ReplaceType, SetDataFn, WithNativeAttrs } from '@/utils/typescript'
import type {
  ColProps,
  FormInstance,
  FormItemProps,
  FormItemRule,
  RowProps,
  ButtonType,
  ButtonProps
} from 'element-plus'
import type { Mutable } from 'element-plus/es/utils'
import type { Ref, Slots, DefineComponent, VNode, TeleportProps, PropType } from 'vue'

type ComponentOption = {
  label: string
  value: any
  /**
   * 绑定给选项组件的属性
   */
  attrs?: MergeAttrs<Record<string, any>>
  [K: string]: any
}

export type FormControlComponent<
  FormModel = Record<string, any>,
  Prop extends keyof FormModel = keyof FormModel
> = RenderComponentFn<FormModel, Prop> | DefineComponent<any, any, any>

export type RenderComponentFn<
  FormModel = Record<string, any>,
  Prop extends keyof FormModel = keyof FormModel
> = RenderFnType<CustomRenderProps<FormModel, Prop>>

export interface CustomRenderProps<
  FormModel = Record<string, any>,
  Prop extends keyof FormModel = keyof FormModel
> {
  model: FormModel
  prop: Prop
  value: FormModel[Prop]
  formItem: VFormItem
  onUpdate: (val: FormModel[Prop]) => void
}

export interface VFormItem<
  FormModel = Record<string, any>,
  Prop extends keyof FormModel = keyof FormModel
> {
  label?: string
  show?: Ref<boolean> | ((data: FormModel) => boolean)
  /**
   * 字段必填，并使用默认的提示信息
   */
  required?: true
  rule?: FormItemRule
  /**
   * 转换输入的值
   */
  transform?: (val: FormModel[Prop]) => FormModel[Prop]
  defaultValue?: FormModel[Prop]

  formItemAttrs?: MergeAttrs<
    Omit<Partial<Mutable<FormItemProps>>, 'label' | 'prop' | 'rules'>
  >
  formItemSlots?: Slots

  appendTo?: TeleportProps['to'] | Ref<HTMLElement>
  colAttrs?: WithNativeAttrs<Partial<Mutable<ColProps>>>

  /**
   * 表单项的控件，可以是一个函数返回VNode，或者一个组件
   */
  component: string | FormControlComponent<FormModel, Prop>
  componentAttrs?: MergeAttrs<Record<string, any>>
  componentSlots?: Slots
  /**
   * 表单项控件的选项，当使用radio、checkbox、select等的时候使用
   */
  options?: Array<ComponentOption>
  /**
   * 自定义控件选项的内容
   */
  optionRender?: (option: ComponentOption) => VNode
}

export type ColAttrs = WithNativeAttrs<PartialMutable<ColProps>>
export interface VFormConfig<FormModel = Record<string, any>> {
  items: {
    [K in keyof FormModel]?: VFormItem<FormModel, K>
  }
  formAttrs?: MergeAttrs<Mutable<FormInstance['props']>>
  rowAttrs?: WithNativeAttrs<Partial<Mutable<RowProps>>>
  itemColAttrs?: ColAttrs
  action: false | {
    colAttrs?: ColAttrs
    resetButton?: false | ButtonWithText
    submitButton?: ButtonWithText
    /**
     * 提交成功默认会重置表单，设置为true则不重置表单
     */
    notResetFormAfterSubmited?: true
    onSubmit: (data: FormModel) => any
    onReset?: () => any
  }
}

export type FormProps<FormModel = Record<string, any>> = {
  config: {
    type: PropType<VFormConfig<FormModel>>,
    required: true
  }
}
export const formProps: FormProps = {
  config: {
    type: Object as PropType<VFormConfig>,
    required: true
  }
}
export type FormRawBindings<FormModel = Record<string, any>> = {
  setValue: SetDataFn<FormModel>
  /**
   * 删除表单对象的某个字段，但是如果存在defaultValue的话，还是会使用defaultValue的
   */
  deleteKey: (key: keyof FormModel) => void
  /**
   * 删除表单对象所以字段，有defaultValue的话也是跟deleteKey方法一样
   */
  deleteAllKey: () => void
  validate: () => Promise<FormModel>
  reset: () => void
}
export type VFormConstructor<FormModel = Record<string, any>> = DefineComponent<FormProps<FormModel>, FormRawBindings<FormModel>>
export type VFormInstance<FormModel = Record<string, any>> = InstanceType<VFormConstructor<FormModel>>