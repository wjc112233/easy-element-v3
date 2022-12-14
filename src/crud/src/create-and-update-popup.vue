<script lang="ts" setup>
import { type PropType, computed, nextTick, ref } from 'vue'
import { isFunction } from 'lodash-es'
import { type CrudConfig, DEFAULT_PRIMARY_KEY } from './crud'
import { transformItems } from './helpers'
import { VForm, type VFormConfig } from '@/form'
import { usePopup } from '@/popup'

const props = defineProps({
  config: {
    type: Object as PropType<CrudConfig>,
    required: true,
  },
  refresh: {
    type: Function,
    required: true,
  },
})

const formRef = ref<InstanceType<typeof VForm>>()
const isUpdateMode = ref(false)

const config = isFunction(props.config.createAndUpdateConfig)
  ? props.config.createAndUpdateConfig(isUpdateMode)
  : props.config.createAndUpdateConfig!

const onOpen = () => {
  const updateForm = () => {
    if (isUpdateMode.value) {
      rowData &&
        Object.keys(formAttrs.value.items).forEach((key) => {
          formRef.value!.setValue(key, rowData![key])
        })
    } else {
      formRef.value!.deleteAllKey()
    }
  }
  if (formRef.value) {
    updateForm()
  } else {
    nextTick(updateForm)
  }
  config.popupAttrs?.onOpened?.()
}

const onConfirm = async () => {
  popup.setContentLoading(true)
  try {
    const params = await formRef.value!.validate()

    if (isUpdateMode.value) {
      const handler = isFunction(props.config.handleUpdate)
        ? props.config.handleUpdate
        : props.config.handleUpdate!.handler
      const primaryKey = props.config.primaryKey || DEFAULT_PRIMARY_KEY
      if (primaryKey && primaryKey in rowData!) {
        params[primaryKey] = rowData[primaryKey]
      }
      await handler(params, rowData!)
    } else {
      const handler = isFunction(props.config.handleCreate)
        ? props.config.handleCreate
        : props.config.handleCreate!.handler
      await handler(params)
    }

    setTimeout(() => {
      props.refresh()
      popup.close()
    }, 500)
  } catch {
    popup.setContentLoading(false)
  }
}

const popupAttrs = computed(() => {
  const attrs = Object.assign(
    {
      title: isUpdateMode.value ? '??????' : '??????',
      closeOnClickModal: false,
    },
    config.popupAttrs
  )
  attrs.onOpen = onOpen
  attrs.footer = {
    ...attrs.footer,
    onConfirm,
  }
  return attrs
})
const formAttrs = computed(() => {
  const attrs = { ...config.formAttrs }
  attrs.items = transformItems(attrs.items, props.config.columns)
  attrs.action = false
  return attrs as VFormConfig
})

let rowData: Record<string, any> | undefined
const popup = usePopup<Record<string, any> | undefined>({
  ...popupAttrs.value,
  beforeShow(dataItem) {
    rowData = dataItem
    isUpdateMode.value = !!dataItem
  },
})

defineExpose(popup)
</script>

<template>
  <VForm ref="formRef" :config="formAttrs" />
</template>
