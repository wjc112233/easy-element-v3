<script setup lang="tsx">
import { type PropType, computed, h, inject, isRef, reactive } from 'vue'
import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElIcon,
  ElMessageBox,
  type ElMessageBoxOptions,
  ElTableColumn,
} from 'element-plus'
import {
  isArray,
  isBoolean,
  isEmpty,
  isFunction,
  isPlainObject,
  isString,
  isUndefined,
  merge,
  omit,
} from 'lodash-es'
import { ArrowDown } from '@element-plus/icons-vue'
import type { CrudConfig, TableAction, TableActionButton } from './crud'

const props = defineProps({
  config: {
    type: Object as PropType<CrudConfig>,
    required: true,
  },
  refresh: {
    type: Function,
    required: true,
  },
  toUpdate: {
    type: Function,
    required: true,
  },
})

// 解析表格操作列配置，把删除按钮和编辑按钮的配置，和自定义按钮配置合并到一起
const tableAction = computed(() => {
  const actionColumn: TableAction = {}
  if (isArray(props.config.tableAction)) {
    actionColumn.items = [...props.config.tableAction]
  } else if (isPlainObject(props.config.tableAction)) {
    Object.assign(actionColumn, props.config.tableAction)
    actionColumn.items = [...(actionColumn.items || [])]
  } else {
    actionColumn.items = []
  }

  let i: { button: TableActionButton; position?: number } | undefined

  i = resolveDeleteButton()
  i && actionColumn.items!.splice(i.position ?? 0, 0, i.button)

  i = resolveUpdateButton()
  i && actionColumn.items!.splice(i.position ?? 0, 0, i.button)

  return actionColumn
})

// 解析删除按钮
const resolveDeleteButton = () => {
  let handleDelete = props.config.handleDelete
  if (handleDelete) {
    if (isFunction(handleDelete)) {
      handleDelete = { handler: handleDelete }
    }
    const { handler, position, name = '删除', ...c } = handleDelete
    const button: TableActionButton = {
      ...c,
      name,
      attrs: { ...(c.attrs || {}) },
      click: async (data, { showLoading, cancelLoading }) => {
        showLoading()
        await handler(data)
        cancelLoading()
        props.refresh()
      },
    }
    button.attrs!.type = button.attrs!.type || 'danger'
    return { button, position }
  }
}

// 解析更新按钮
const resolveUpdateButton = () => {
  let handleUpdate = props.config.handleUpdate
  if (handleUpdate) {
    if (isFunction(handleUpdate)) {
      handleUpdate = { handler: handleUpdate }
    }
    const button: TableActionButton = merge(
      {
        name: '编辑',
        attrs: { type: 'primary' },
        click: (data: any) => props.toUpdate(data),
      },
      omit(handleUpdate, 'handler', 'position')
    )
    return { button, position: handleUpdate.position }
  }
}

const dropdownInstances: Array<InstanceType<typeof ElDropdown>> = []
const setDropdownInstance = (instance: any, rowIndex: number) => {
  dropdownInstances[rowIndex] = instance
}
const dropdownAttrs = computed(() => {
  const useDropdown = tableAction.value.useDropdown
  return Object.assign(
    {
      trigger: 'click',
      hideOnClick: false,
    },
    isBoolean(useDropdown) ? { text: '更多' } : useDropdown
  )
})

// 给每个按钮配置生成一个key
const keyMaps = new WeakMap<TableActionButton, number>()
let _id = 0
const getButtonKey = (buttonConfig: TableActionButton) => {
  let key = keyMaps.get(buttonConfig)
  if (!key) {
    key = ++_id
    keyMaps.set(buttonConfig, key)
  }
  return key
}

// 把按钮列表分为正常显示的按钮，以及下拉列表中的按钮
const buttons = computed(() => {
  return tableAction.value.items!.reduce(
    (res, item) => {
      if (tableAction.value.useDropdown && item.dropdownItem !== false) {
        res.dropdown[getButtonKey(item)] = item
      } else {
        res.outside[getButtonKey(item)] = item
      }
      return res
    },
    {
      outside: {} as Record<number, TableActionButton>,
      dropdown: {} as Record<number, TableActionButton>,
    }
  )
})

// 按钮的loading控制
const tableLoading: Array<Record<number, boolean>> = []
const getButtonLoading = (rowIndex: number, key: number) => {
  const rowLoading =
    tableLoading[rowIndex] || (tableLoading[rowIndex] = reactive({}))
  return !!rowLoading[key]
}
const setButtonLoading = (rowIndex: number, key: number, value: boolean) => {
  tableLoading[rowIndex][key] = value
}

const handleClick = (
  data: Record<string, any>,
  buttonConfig: TableActionButton,
  rowIndex: number,
  key: number
) => {
  const methods = {
    showLoading: () => setButtonLoading(rowIndex, key, true),
    cancelLoading: () => setButtonLoading(rowIndex, key, false),
    setData: (key: string, value: any) => (data[key] = value),
  }

  let options: ElMessageBoxOptions | undefined
  if (isBoolean(buttonConfig.confirm)) {
    options = { message: '是否确定？' }
  } else if (isString(buttonConfig.confirm)) {
    options = { message: buttonConfig.confirm }
  } else if (!isUndefined(buttonConfig.confirm)) {
    options = buttonConfig.confirm
  }

  if (options) {
    const originalBeforeClose = options.beforeClose
    ElMessageBox({
      title: '提示',
      // 保持下拉菜单不关闭
      beforeClose(...args) {
        const done = args[2]
        const wrapperDone = () => {
          done()
          dropdownInstances[rowIndex]?.handleOpen()
        }
        if (originalBeforeClose) {
          originalBeforeClose(args[0], args[1], wrapperDone)
        } else {
          wrapperDone()
        }
      },
      ...options,
    }).then(() => {
      buttonConfig.click(data, methods)
    })
  } else {
    buttonConfig.click(data, methods)
  }
}

const RenderButton = ({
  'button-config': buttonConfig,
  'button-key': buttonKey,
  'row-index': rowIndex,
  data,
  dropdown,
}: {
  'button-key': number
  'button-config': TableActionButton
  data: Record<string, any>
  'row-index': number
  dropdown: boolean
}) => {
  if (
    (isRef(buttonConfig.show) && !buttonConfig.show.value) ||
    (isFunction(buttonConfig.show) && !buttonConfig.show(data))
  ) {
    return null
  }

  const button = {
    name: buttonConfig.name,
    attrs: Object.assign(
      { type: 'primary' },
      tableAction.value.buttonAttrs,
      buttonConfig.attrs
    ),
  }
  if (buttonConfig.dynamicLoad) {
    buttonConfig.dynamicLoad(data, button)
  }
  button.attrs.loading = getButtonLoading(rowIndex, buttonKey)

  const realButton = () => (
    <ElButton
      {...button.attrs}
      onClick={() => handleClick(data, buttonConfig, rowIndex, buttonKey)}
    >
      {{ default: () => button.name }}
    </ElButton>
  )

  return dropdown ? (
    realButton()
  ) : (
    <ElDropdownItem>
      {{
        default: realButton,
      }}
    </ElDropdownItem>
  )
}
</script>

<template>
  <ElTableColumn
    :label="tableAction.label || '操作'"
    :width="tableAction.width"
    :fixed="tableAction.fixed"
  >
    <template #default="{ row, $index }">
      <RenderButton
        v-for="(buttonConfig, key) in buttons.outside"
        :key="key"
        :button-key="key"
        :button-config="buttonConfig"
        :data="row"
        :row-index="$index"
      />
      <ElDropdown
        v-if="tableAction.useDropdown && !isEmpty(buttons.dropdown)"
        :ref="(instance) => setDropdownInstance(instance, $index)"
        v-bind="omit(dropdownAttrs, 'text')"
        class="table-action-dropdown"
      >
        <span class="el-dropdown-link">
          <ElButton type="primary" link>
            {{ dropdownAttrs?.text }}
            <ElIcon><ArrowDown /></ElIcon>
          </ElButton>
        </span>
        <template #dropdown>
          <ElDropdownMenu>
            <RenderButton
              v-for="(buttonConfig, key) in buttons.dropdown"
              :key="key"
              :button-key="key"
              :button-config="buttonConfig"
              :data="row"
              :row-index="$index"
              dropdown
            />
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </template>
  </ElTableColumn>
</template>

<style lang="less" scoped>
.table-action-dropdown {
  vertical-align: middle;
  margin-left: 10px;
}
</style>
