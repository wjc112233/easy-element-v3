<script setup lang="tsx">
import {
  ElTableColumn,
  ElButton,
  ElPopconfirm,
  ElDropdown,
  ElDropdownMenu,
  ElIcon,
  ElDropdownItem
} from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue'
import {
  isArray,
  isBoolean,
  isFunction,
  isPlainObject,
  isString,
  isEmpty,
  omit
} from 'lodash-es';
import { computed, isRef, h, type PropType, reactive } from 'vue';
import type { CrudConfig, TableAction, TableActionButton } from './crud';

const { config, refresh, toUpdate } = defineProps({
  config: {
    type: Object as PropType<CrudConfig>,
    required: true
  },
  refresh: {
    type: Function,
    required: true
  },
  toUpdate: {
    type: Function,
    required: true
  },
})

// 解析表格操作列配置，把删除按钮和编辑按钮的配置，和自定义按钮配置合并到一起
const tableAction = computed(() => {
  let actionColumn: TableAction = {}
  if (isArray(config.tableAction)) {
    actionColumn.items = [...config.tableAction]
  } else if (isPlainObject(config.tableAction)) {
    Object.assign(actionColumn, config.tableAction)
    actionColumn.items = [...(actionColumn.items || [])]
  } else {
    actionColumn.items = []
  }

  let i: { button: TableActionButton, position?: number } | undefined

  i = resolveDeleteButton()
  i && actionColumn.items!.splice(i.position ?? 0, 0, i.button)

  i = resolveUpdateButton()
  i && actionColumn.items!.splice(i.position ?? 0, 0, i.button)

  return actionColumn
})

// 解析删除按钮
const resolveDeleteButton = () => {
  let handleDelete = config.handleDelete
  if (handleDelete) {
    if (isFunction(handleDelete)) {
      handleDelete = { handler: handleDelete }
    }
    const { handler, position, name = '删除', ...c } = handleDelete
    const button: TableActionButton = {
      ...c,
      name,
      attrs: { ...(c.attrs || {}) },
      click: async(data, { showLoading, cancelLoading }) => {
        showLoading()
        await handler(data)
        cancelLoading()
        refresh()
      },
    }
    button.attrs!.type = button.attrs!.type || 'danger'
    return { button, position }
  }
}

// 解析更新按钮
const resolveUpdateButton = () => {
  let handleUpdate = config.handleUpdate
  if (handleUpdate) {
    if (isFunction(handleUpdate)) {
      handleUpdate = { handler: handleUpdate }
    }
    const { handler, position, name = '编辑', ...c } = handleUpdate
    const button: TableActionButton = {
      ...c,
      name,
      attrs: { ...(c.attrs || {}) },
      click: (data) => toUpdate(data)
    }
    button.attrs!.type = button.attrs!.type || 'primary'
    return { button, position }
  }
}

const dropdownAttrs = computed(() => {
  const useDropdown = tableAction.value.useDropdown
  return Object.assign(
    { trigger: 'click', hideOnClick: false },
    isBoolean(useDropdown)
     ? { text: '更多' }
     : useDropdown
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
  return tableAction.value.items!.reduce((res, item) => {
    if (tableAction.value.useDropdown) {
      if (item.dropdownItem !== false) {
        res.dropdown[getButtonKey(item)] = item
      } else {
        res.outside[getButtonKey(item)] = item
      }
    } else {
      res.outside[getButtonKey(item)] = item
    }
    return res
  }, {
    outside: {} as Record<number, TableActionButton>,
    dropdown: {} as Record<number, TableActionButton>
  })
})

// 按钮的loading控制
const tableLoading: Array<Record<number, boolean>> = []
const getButtonLoading = (rowIndex: number, key: number) => {
  const rowLoading = tableLoading[rowIndex] || (tableLoading[rowIndex] = reactive({}))
  return !!rowLoading[key]
}
const setButtonLoading = (
  rowIndex: number,
  key: number,
  value: boolean
) => {
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
    setData: (key: string, value: any) =>  data[key] = value
  }
  buttonConfig.click(data, methods)
}

const getElPopconfirmAttrs = (confirm: TableActionButton['confirm']) => {
  if (isBoolean(confirm)) {
    return { title: '是否确定？' }
  } else if (isString(confirm)) {
    return { title: confirm }
  } else {
    return confirm!
  }
}

const RenderButton = ({
  buttonConfig,
  data,
  rowIndex,
  buttonKey
}: {
  buttonKey: number
  buttonConfig: TableActionButton,
  data: Record<string, any>,
  rowIndex: number
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
    )
  }
  if (buttonConfig.dynamicLoad) {
    buttonConfig.dynamicLoad(data, button)
  }
  button.attrs.loading = getButtonLoading(rowIndex, buttonKey)

  const onClick = () => handleClick(data, buttonConfig, rowIndex, buttonKey)
  const realButton = (withClick: boolean) => (
    <ElButton
      {...button.attrs}
      onClick={withClick ? onClick : undefined}
    >
      {{ default: () => button.name }}
    </ElButton>
  )
  return buttonConfig.confirm ? (
    <ElPopconfirm
      {...getElPopconfirmAttrs(buttonConfig.confirm)}
      onConfirm={onClick}
    >
      {{ reference: () => realButton(false) }}
    </ElPopconfirm>
  ) : (
    realButton(true)
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
        :buttonKey="key"
        :buttonConfig="buttonConfig"
        :data="row"
        :rowIndex="$index"
      />
      <ElDropdown
        v-if="tableAction.useDropdown && !isEmpty(buttons.dropdown)"
        v-bind="omit(dropdownAttrs, 'text')"
        class="table-action-dropdown"
      >
        <span class="el-dropdown-link">
          <ElButton type="primary" link>
            {{ dropdownAttrs?.text }}
            <ElIcon><ArrowDown/></ElIcon>
          </ElButton>
        </span>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem
              v-for="(buttonConfig, key) in buttons.dropdown"
            >
              <RenderButton
                :buttonKey="key"
                :buttonConfig="buttonConfig"
                :data="row"
                :rowIndex="$index"
              />
            </ElDropdownItem>
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