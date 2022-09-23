<script setup lang="ts">
import { h, inject, nextTick, ref } from 'vue'
import { ElIcon } from 'element-plus'
import { isEmpty, isString } from 'lodash-es'
import { Download } from '@element-plus/icons-vue'
import { crudInjectKey } from '../inject-keys'
import { normalizeColumn } from '../helpers'
import { ExportData } from './export-data'
import type { Columns } from '../crud'
import type { VFormInstance } from '@/form'
import { Popup, type VPopupInstance } from '@/popup'
import { Cascader, Input, Radio, VForm, type VFormConfig } from '@/form'

const { cacheManagement, tableData, elTableRef, baseConfig, crudConfig } =
  inject(crudInjectKey)!

const popupRef = ref<VPopupInstance>()
const formRef = ref<VFormInstance>()

const showPopup = () => {
  popupRef.value?.show()
  nextTick(() => {
    const selectedItems = elTableRef.value?.getSelectionRows() || []
    formRef.value?.setValue('dataType', isEmpty(selectedItems) ? 2 : 1)
  })
}

type Option = {
  label: string
  value: string
  children?: Option[]
}
const getColumnsOptions = (
  columns: Columns,
  path?: Array<string>
): Option[] => {
  return Object.entries(columns).map(([prop, item]) => {
    const columnPath = [...(path || []), prop]
    return {
      value: prop,
      ...(isString(item)
        ? { label: item }
        : {
            label: item!.label,
            children:
              item?.children && getColumnsOptions(item.children, columnPath),
          }),
    }
  })
}
const columnsOptions = getColumnsOptions(baseConfig.columns)

// 设置默认选中的字段
const setDefaultColumnPaths = () => {
  const columnPaths: Array<Array<string>> = []
  const deepGetPath = (columns: Columns, path?: Array<string>) => {
    Object.keys(columns).forEach((prop) => {
      columnPaths.push([...(path || []), prop])
      const children = normalizeColumn(columns[prop])?.children
      if (children) {
        deepGetPath(children, [...(path || []), prop])
      }
    })
  }
  deepGetPath(crudConfig.value?.columns)

  formRef.value?.setValue('columnPaths', columnPaths)
}

const formConfig: VFormConfig = {
  items: {
    name: {
      label: '文件名',
      component: Input,
      componentAttrs: { placeholder: '表格' },
      componentSlots: {
        append: () => {
          return [h('span', '.xlsx')]
        },
      },
    },
    dataType: {
      label: '数据',
      options: [
        { label: '选中的数据', value: 1 },
        { label: '当前页', value: 2 },
      ],
      component: Radio,
    },
    columnPaths: {
      label: '字段',
      component: Cascader,
      componentAttrs: {
        options: columnsOptions,
        filterable: true,
        props: {
          multiple: true,
          checkStrictly: true,
        },
      },
    },
  },
  itemColAttrs: {
    sm: { span: 16, push: 1 },
  },
  formAttrs: {
    labelWidth: '100px',
  },
  action: false,
}

const onConfirm = async () => {
  const _form = await formRef.value!.validate()

  const columns = cacheManagement?.value?.getColumns(true) || baseConfig.columns
  const sourceData =
    _form.dataType === 1
      ? elTableRef.value?.getSelectionRows() || []
      : tableData
  new ExportData(_form.columnPaths, columns, sourceData, _form.name || '表格')
}
</script>

<template>
  <ElIcon class="tool-icon" @click="showPopup"><Download /></ElIcon>
  <Popup ref="popupRef" title="导出" :footer="{ onConfirm }">
    <VForm
      ref="formRef"
      :config="formConfig"
      @vnode-mounted="setDefaultColumnPaths"
    />
  </Popup>
</template>
