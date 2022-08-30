<template>
  <ElForm :key="formKey" :ref="setFormRef" v-bind="formAttrs">
    <ElRow v-bind="config.rowAttrs">
      <FormItem
        v-for="(formItem, prop) in formItems"
        :key="prop"
        :form-item="formItem!"
        :default-col-attrs="config.itemColAttrs"
        :prop="prop"
        :model="model"
        :on-update="onUpdate"
      />
      <slot />
      <ElCol v-if="config.action !== false" v-bind="config.action.colAttrs">
        <ElButton
          v-if="config.action.resetButton !== false"
          v-bind="
            isBoolean(config.action.resetButton)
              ? {}
              : Object.assign(
                  { type: 'info' },
                  omit(config.action.resetButton, 'text')
                )
          "
          @click="handleReset"
        >
          {{ config.action.resetButton?.text || '重置' }}
        </ElButton>
        <ElButton
          v-bind="
            Object.assign(
              { type: 'primary' },
              omit(config.action.submitButton, 'text')
            )
          "
          @click="handleSubmit"
        >
          {{ config.action.submitButton?.text || '提交' }}
        </ElButton>
      </ElCol>
    </ElRow>
  </ElForm>
</template>

<script lang="ts" setup>
import { computed, isRef, nextTick, ref, watch } from 'vue'
import {
  ElButton,
  ElCol,
  ElForm,
  ElRow,
  type FormInstance,
  type FormItemRule,
  useSize,
} from 'element-plus'
import { isBoolean, isFunction, omit } from 'lodash-es'
import FormItem from './form-item.vue'
import { type FormRawBindings, formProps } from './form'
import type { RemoveUnionType } from '@/utils/typescript'
import { defaultFormAttrs } from '@/default'

type Items = typeof props.config.items
type Model = Record<string, any>

const props = defineProps(formProps)

const elFormRef = ref<FormInstance>()
const setFormRef = (formInstance: any, refs: any) => {
  const { ref } = props.config.formAttrs ?? {}
  if (isRef(ref)) {
    ref.value = formInstance
  } else if (isFunction(ref)) {
    ref(formInstance, refs)
  }
  elFormRef.value = formInstance
}

const formKey = ref(0)
const model = ref<Model>({})
const size = useSize()

const onUpdate = <Prop extends keyof Model = keyof Model>(
  prop: Prop,
  value: Model[Prop]
) => {
  const { transform } = props.config.items[prop]!
  methods.setValue(prop, transform ? transform(value) : value)
}

const formItems = computed(() => {
  return Object.keys(props.config.items).reduce((res, k) => {
    const item = props.config.items[k]!
    // 如果使用了appendTo且为一个ref，则应该判断ref有值的时候才去加载FormItem
    if (!isRef(item.appendTo) || item.appendTo.value) {
      // 根据show来判断这个表单项是否显示
      if (
        !item.show ||
        (isRef(item.show) && item.show.value) ||
        (isFunction(item.show) && item.show(model.value))
      ) {
        res[k] = item
      }
    }
    return res
  }, {} as Items)
})

/**
 * 使表单对象里的字段始终与页面表单显示的字段保持一致
 */
const syncFormModel = () => {
  const items = formItems.value
  for (const key in model.value) {
    if (!(key in items)) {
      methods.deleteKey(key)
    }
  }
  for (const key in formItems.value) {
    if (!(key in model.value) && 'defaultValue' in items[key]!) {
      methods.setValue(key, items[key]!.defaultValue)
    }
  }
}
const currentItemKeys = computed(() => {
  return Object.keys(formItems.value).join()
})
watch(currentItemKeys, () => syncFormModel(), { immediate: true })

const formAttrs = computed(() => {
  const attrs = Object.assign(
    {},
    defaultFormAttrs.getAll(),
    omit(props.config.formAttrs, 'ref'),
    {
      model,
      rules: formRules.value,
      size: size.value,
    }
  )
  return attrs
})
const formRules = computed(() => {
  return Object.keys(formItems.value).reduce((res, k) => {
    let { rule, required, label } = formItems.value[k]!
    if (!rule && required) {
      rule = {
        required: true,
        message: label ? `字段"${label}"为必填` : '此字段必填',
      }
    }
    if (rule) {
      res[k] = rule
    }
    return res
  }, {} as { [k in keyof Items]?: FormItemRule })
})

const methods: FormRawBindings = {
  setValue: (key, value) => {
    Reflect.set(model.value, key, value)
  },
  deleteKey: (key) => {
    Reflect.deleteProperty(model.value, key)
    syncFormModel()
  },
  deleteAllKey: () => {
    Object.keys(model.value).forEach((key) => {
      Reflect.deleteProperty(model.value, key)
    })
    syncFormModel()
  },
  validate: async () => {
    await elFormRef.value!.validate()
    return { ...model.value }
  },
  reset: () => {
    Object.keys(model.value).forEach((key) => {
      Reflect.deleteProperty(model.value, key)
    })
    nextTick(() => {
      syncFormModel()
      formKey.value = Date.now()
    })
  },
}

type Action = typeof props.config.action

const handleSubmit = async () => {
  const model = await methods.validate()
  const { onSubmit, notResetFormAfterSubmited } = props.config
    .action as RemoveUnionType<Action, false>
  await onSubmit(model)
  if (notResetFormAfterSubmited !== true) {
    methods.reset()
  }
}

const handleReset = () => {
  methods.reset()
  ;(props.config.action as RemoveUnionType<Action, false>)?.onReset?.()
}

defineExpose(methods)
</script>
