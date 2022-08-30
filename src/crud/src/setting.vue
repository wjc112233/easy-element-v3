<script lang="ts" setup>
import { type PropType, computed, inject, onMounted, ref } from 'vue'
import {
  type CheckboxValueType,
  ElCheckbox,
  ElIcon,
  ElPopover,
  ElTooltip,
} from 'element-plus'
import Sortable from 'sortablejs'
import { isBoolean, isNumber, isString } from 'lodash-es'
import { Download, Rank, Setting } from '@element-plus/icons-vue'
import {
  type FieldColumnCacheRecord,
  cacheManagementInjectKey,
} from './useCache'
import type { CrudConfig, VTableColumn } from './crud'

const props = defineProps({
  config: {
    type: Object as PropType<CrudConfig>,
    required: true,
  },
})

const containerEl = ref<HTMLDivElement>()

const cacheManagement = inject(cacheManagementInjectKey)
type Item = {
  show: boolean
  prop: string
  label: string
  fixed?: FieldColumnCacheRecord['fixed']
}
const items = computed(() => {
  const colsRecord = cacheManagement?.getRecord()?.columnsRecord
  const indexedItems: Array<Item> = []
  const items: Array<Item> = []

  let colRecord: FieldColumnCacheRecord | undefined
  let item: Item
  let col: VTableColumn
  Object.keys(props.config.columns).forEach((key) => {
    colRecord = colsRecord?.[key]
    col = (
      isString(props.config.columns[key])
        ? { label: props.config.columns[key] }
        : props.config.columns[key]
    ) as VTableColumn
    item = {
      prop: key,
      show: isBoolean(colRecord?.show) ? colRecord!.show : true,
      label: col!.label,
      fixed: colRecord?.fixed ?? col.attrs?.fixed,
    }
    if (colRecord && isNumber(colRecord.index)) {
      indexedItems[colRecord.index] = item
    } else {
      items.push(item)
    }
  })

  return indexedItems.filter(Boolean).concat(items)
})

const onSort = ({ newIndex, oldIndex }: Sortable.SortableEvent) => {
  const cloneItems = [...items.value]
  const item = cloneItems.splice(oldIndex!, 1)[0]
  cloneItems.splice(newIndex!, 0, item)
  cacheManagement?.setRecord({
    columnsRecord: cloneItems.reduce((res, item, index) => {
      res[item.prop] = { index }
      return res
    }, {} as Record<string, { index: number }>),
  })
}

const handleShowOrHide = (item: Item, val: CheckboxValueType) => {
  cacheManagement?.setRecord({
    columnsRecord: {
      [item.prop]: {
        show: val as boolean,
      },
    },
  })
}

const handleSetFixed = (item: Item, isLeft: boolean) => {
  let fixed: Item['fixed']
  if (isLeft) {
    fixed = item.fixed === true || item.fixed === 'left' ? false : 'left'
  } else {
    fixed = item.fixed === 'right' ? false : 'right'
  }
  cacheManagement?.setRecord({
    columnsRecord: { [item.prop]: { fixed } },
  })
}

onMounted(() => {
  if (containerEl.value) {
    new Sortable(containerEl.value, {
      animation: 150,
      handle: '.move-icon',
      direction: 'vertical',
      onEnd: onSort,
    })
  }
})
</script>

<template>
  <ElPopover trigger="click" placement="bottom-end" width="350">
    <template #reference>
      <ElIcon class="tool-icon"><Setting /></ElIcon>
    </template>
    <div ref="containerEl" class="table-setting-container">
      <div v-for="item in items" :key="item.prop" class="setting-item">
        <ElIcon class="move-icon"><Rank /></ElIcon>
        <ElCheckbox
          :model-value="item.show"
          :label="item.label"
          @change="handleShowOrHide(item, $event)"
        />
        <ElTooltip
          :content="`${
            item.fixed === true || item.fixed === 'left' ? '取消' : ''
          }固定在左侧`"
        >
          <ElIcon
            class="fixed-icon left"
            :class="{ active: item.fixed === true || item.fixed === 'left' }"
            @click="handleSetFixed(item, true)"
          >
            <Download />
          </ElIcon>
        </ElTooltip>
        <ElTooltip
          :content="`${item.fixed === 'right' ? '取消' : ''}固定在右侧`"
        >
          <ElIcon
            class="fixed-icon right"
            :class="{ active: item.fixed === 'right' }"
            @click="handleSetFixed(item, false)"
          >
            <Download />
          </ElIcon>
        </ElTooltip>
      </div>
    </div>
  </ElPopover>
</template>

<style lang="less" scoped>
.table-setting-container {
  max-height: 60vh;
  overflow: auto;
  .setting-item {
    display: flex;
    align-items: center;
    .move-icon {
      font-size: 17px;
      margin-right: 5px;
      cursor: move;
    }
    .el-checkbox {
      margin-right: auto;
    }
    .fixed-icon {
      font-size: 17px;
      cursor: pointer;
      &.left {
        transform: rotate(90deg);
        margin: 0 5px 0 10px;
      }
      &.right {
        transform: rotate(-90deg);
      }
      &:hover,
      &.active {
        color: var(--el-color-primary);
      }
    }
  }
}
</style>
