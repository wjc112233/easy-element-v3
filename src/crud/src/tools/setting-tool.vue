<script lang="tsx" setup>
import { h, inject, onMounted, ref } from 'vue'
import { ElIcon, ElPopover, ElTooltip, ElTree } from 'element-plus'

import { isArray, isBoolean, isString } from 'lodash-es'
import { Download, Rank, Setting } from '@element-plus/icons-vue'

import { crudInjectKey } from '../injectKeys'
import {
  CacheManagement,
  type ColumnCacheRecord,
  SpecialColumnsEnum,
} from './cache-management'
import type { Columns, VTableColumn } from '../crud'
import type Node from 'element-plus/es/components/tree/src/model/node'
import type { NodeDropType } from 'element-plus/es/components/tree/src/tree.type'

const treeRef = ref<InstanceType<typeof ElTree>>()

const { cacheManagement, reloadTable, baseConfig } = inject(crudInjectKey)!
cacheManagement!.value = new CacheManagement(baseConfig, reloadTable)

type Item = {
  path: string
  prop: string
  label: string
  children?: Item[]
}
const treeOptions = (() => {
  if (!cacheManagement) {
    return []
  }

  const columns = cacheManagement!.value.getColumns(true)
  const columnsToItems = (cols: Columns, path = ''): Item[] => {
    let col: VTableColumn, _path: string
    return Object.keys(cols).map((prop) => {
      col = (
        isString(cols[prop]) ? { label: cols[prop] } : cols[prop]
      ) as VTableColumn
      _path = `${path ? `${path}.` : ''}${prop}`
      return {
        path: _path,
        prop,
        label: col.label,
        children: col.children && columnsToItems(col.children, _path),
      }
    })
  }

  const tableAction = baseConfig.tableAction
  const actionColumnLabel =
    !tableAction || isArray(tableAction) ? undefined : tableAction.label

  return [
    {
      path: SpecialColumnsEnum.EXPAND,
      prop: SpecialColumnsEnum.EXPAND,
      label: '展开列',
    },
    {
      path: SpecialColumnsEnum.SELECTION,
      prop: SpecialColumnsEnum.SELECTION,
      label: '勾选列',
    },
    {
      path: SpecialColumnsEnum.INDEX,
      prop: SpecialColumnsEnum.INDEX,
      label: '索引列',
    },
    ...columnsToItems(columns),
    {
      path: SpecialColumnsEnum.ACTION,
      prop: SpecialColumnsEnum.ACTION,
      label: actionColumnLabel || '操作列',
    },
  ]
})()

const setCheckedKeys = () => {
  const keys: string[] = []
  const deepFind = (items: Item[]) => {
    items.forEach((item) => {
      if (item.children) {
        deepFind(item.children)
      } else {
        if (
          isShow(
            item.path,
            cacheManagement!.value!.getColumnRecordByPath(item.path)?.show
          )
        ) {
          keys.push(item.path)
        }
      }
    })
  }
  deepFind(treeOptions)
  treeRef.value?.setCheckedKeys(keys)
}

// 设置初始选中
onMounted(() => {
  setCheckedKeys()
})

const isShow = (path: string, show?: boolean) => {
  if (!isBoolean(show)) {
    if (path === SpecialColumnsEnum.ACTION) {
      show = !!baseConfig.tableAction
    } else if (path === SpecialColumnsEnum.INDEX) {
      show = !!baseConfig.tableIndex
    } else if (path === SpecialColumnsEnum.SELECTION) {
      show = !!baseConfig.tableSelection
    } else if (path === SpecialColumnsEnum.EXPAND) {
      show = !!baseConfig.tableExpand
    } else {
      show = true
    }
  }
  return show
}

let specialIdsMap: Record<number, boolean> | undefined
const isSpecialColumn = (nodeId: number) => {
  if (!specialIdsMap) {
    specialIdsMap = treeRef.value?.store.data.reduce((res, item) => {
      if (Object.values(SpecialColumnsEnum).includes(item.prop)) {
        res[item.$treeNodeId] = true
      }
      return res
    }, {})
  }
  return specialIdsMap?.[nodeId]
}

let isAllowDrag = false
// 判断能不能拖动到目标位置
// 仅同级且不为特殊列，才可以拖动
const onDropToNode = (node: Node, targetNode: Node, type: NodeDropType) => {
  if (type === 'inner') {
    return false
  } else {
    const targetParent = node.store.nodesMap[targetNode.data.path].parent
    return (
      targetParent.childNodes.includes(node) && !isSpecialColumn(targetNode.id)
    )
  }
}
// 更新位置
const onDragEnd = ({ store, data }: Node, targetNode: Node) => {
  isAllowDrag = false
  if (targetNode.data.path === data.path) return

  setCheckedKeys()

  const node = store.nodesMap[data.path]
  const siblingNodes = node.parent.childNodes.filter(
    (n) => !isSpecialColumn(n.id)
  )

  siblingNodes.forEach((n, index) => {
    cacheManagement!.value!.setRecord({
      columnsRecord: cacheManagement!.value!.pathToColumnRecord(n.data.path, {
        index,
      }),
    })
  })
}

// 设置列显示或隐藏
const handleShowOrHide = (data: Item, { checkedKeys }: any) => {
  const isChecked = checkedKeys.includes(data.path)
  const deepGetRecord = (d: Item) => {
    const obj: Partial<ColumnCacheRecord> = {}
    if (d.children) {
      obj.children = d.children.reduce((res, item) => {
        res[item.prop] = deepGetRecord(item)
        return res
      }, {} as Record<string, ColumnCacheRecord>)
    } else {
      obj.show = isChecked
    }
    return obj
  }
  cacheManagement!.value!.setRecord({
    columnsRecord: cacheManagement!.value!.pathToColumnRecord(
      data.path,
      data.children ? deepGetRecord(data) : { show: isChecked }
    ),
  })
}

// 设置列固定
const handleSetFixed = (path: string, isActive: boolean, isLeft: boolean) => {
  const fixed = isActive ? false : isLeft ? 'left' : 'right'
  cacheManagement!.value!.setRecord({
    columnsRecord: cacheManagement!.value!.pathToColumnRecord(path, { fixed }),
  })
}

const renderFixedIcon = ({
  disabled,
  isLeft,
  path,
  record,
  moveRight,
}: {
  isLeft: boolean
  disabled: boolean
  record: ColumnCacheRecord
  path: string
  moveRight?: boolean
}) => {
  let currentFixed = record.fixed
  if (currentFixed === undefined) {
    const col = baseConfig.columns[path]
    currentFixed = !isString(col) ? col?.attrs?.fixed : undefined
  }
  const isActive = isLeft
    ? currentFixed === true || currentFixed === 'left'
    : currentFixed === 'right'
  const renderContent = () => (
    <ElIcon
      class={{
        'fixed-icon': true,
        'move-right': moveRight,
        left: isLeft,
        right: !isLeft,
        active: !disabled && isActive,
        disabled,
      }}
      onClick={() => !disabled && handleSetFixed(path, isActive, isLeft)}
    >
      {{
        default: () => <Download />,
      }}
    </ElIcon>
  )
  return disabled ? (
    renderContent()
  ) : (
    <ElTooltip
      content={`${isActive ? '取消' : ''}固定在${isLeft ? '左' : '右'}侧`}
    >
      {{ default: renderContent }}
    </ElTooltip>
  )
}

const ColumnSettingItem = ({
  treeNode: { store, data, checked, id, indeterminate },
}: {
  treeNode: Node
}) => {
  const isRoot = store.root.data.some((item: any) => item.prop === data.prop)
  const record = cacheManagement!.value!.getColumnRecordByPath(data.path) || {}
  const isChecked = checked || indeterminate
  return (
    <div class="columns-setting-item">
      <span class="label">{data.label}</span>
      {isRoot &&
        renderFixedIcon({
          record,
          isLeft: true,
          path: data.path,
          disabled:
            data.prop === SpecialColumnsEnum.ACTION ||
            !isShow(data.path, record.show),
        })}
      {isRoot &&
        renderFixedIcon({
          record,
          isLeft: false,
          path: data.path,
          moveRight: isSpecialColumn(id),
          disabled:
            [
              SpecialColumnsEnum.EXPAND,
              SpecialColumnsEnum.INDEX,
              SpecialColumnsEnum.SELECTION,
            ].includes(data.prop) || !isShow(data.path, record.show),
        })}
      {!isSpecialColumn(id) && (
        <ElIcon
          class={`move-icon${!isChecked ? ' disabled' : ''}`}
          onMousedown={() => {
            if (isChecked) {
              isAllowDrag = true
            }
          }}
          onMouseup={() => {
            isAllowDrag = false
          }}
        >
          {{
            default: () => <Rank />,
          }}
        </ElIcon>
      )}
    </div>
  )
}
</script>

<template>
  <ElPopover
    trigger="click"
    placement="bottom-end"
    width="300px"
    popper-class="crud-setting-popover"
  >
    <template #reference>
      <ElIcon class="tool-icon"><Setting /></ElIcon>
    </template>
    <ElTree
      ref="treeRef"
      :data="treeOptions"
      show-checkbox
      node-key="path"
      draggable
      :allow-drag="() => isAllowDrag"
      :allow-drop="onDropToNode"
      @check="handleShowOrHide"
      @node-drag-end="onDragEnd"
    >
      <template #default="{ node }">
        <ColumnSettingItem :treeNode="node" />
      </template>
    </ElTree>
  </ElPopover>
</template>

<style lang="less">
.crud-setting-popover {
  --el-popover-padding: 12px 12px 12px 0;
  .columns-setting-item {
    flex: 1;
    display: flex;
    .label {
      flex: 1;
      overflow: hidden;
      margin-right: 5px;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .move-icon {
      font-size: 19px;
      margin-right: 5px;
      cursor: move;
      margin-left: 17px;
    }
    .fixed-icon {
      font-size: 19px;
      cursor: pointer;
      &.left {
        transform: rotate(90deg);
        margin: 0 5px 0 10px;
      }
      &.right {
        transform: rotate(-90deg);
        &.move-right {
          margin-right: 41px;
        }
      }
      &:not(.disabled):hover,
      &:not(.disabled).active {
        color: var(--el-color-primary);
      }
    }
    .disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }
}
</style>
