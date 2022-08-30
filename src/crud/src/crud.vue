<script lang="ts" setup>
import { ElTable, ElTableColumn, ElPagination, ElButton, ElCard, ElIcon } from 'element-plus';
import { isFunction, merge, isString, omit } from 'lodash-es';
import { computed, isRef, ref, provide } from 'vue';
import VTableAction from './table-action.vue'
import CreateAndUpdatePopup from './create-and-update-popup.vue';
import Setting from './setting.vue'
import { RenderFn } from '@/utils/RenderFn'
import {
  DEFAULT_PRIMARY_KEY,
  _crudProps,
  type ElTableInstance,
  type TableExpand,
  type VTableColumn
} from './crud'
import { useData } from './useData'
import { CacheManagement, cacheManagementInjectKey } from './useCache'
import { VForm, type VFormConfig } from '@/form';
import { transformItems } from './helpers';
import { RefreshLeft } from '@element-plus/icons-vue';

const props = defineProps(_crudProps)

const cacheManegement = new CacheManagement(props.config)
provide(cacheManagementInjectKey, cacheManegement)
const crudConfig = computed(() => {
  return cacheManegement.mergeConfig()
})

const elTableRef = ref<ElTableInstance>()
const createAndUpdatePopupRef = ref<InstanceType<typeof CreateAndUpdatePopup>>()
const setTableRef = (instance: any, refs: any) => {
  const { ref } = crudConfig.value.tableAttrs ?? {}
  if (isRef(ref)) {
    ref.value = instance
  } else if (isFunction(ref)) {
    ref(instance, refs)
  }
  elTableRef.value = instance
}

const {
  tableKey,
  tableData,
  isError,
  currentPage,
  pageSize,
  totalCount,
  getTableData,
  refresh,
  search,
} = useData({ config: crudConfig.value, elTableRef })

const tableAttrs = computed(() => {
  return Object.assign({
    rowKey: crudConfig.value.primaryKey || DEFAULT_PRIMARY_KEY
  }, crudConfig.value.tableAttrs)
})

const tableExpand = computed<TableExpand>(() => {
  if (isFunction(crudConfig.value.tableExpand)) {
    return {
      render: crudConfig.value.tableExpand
    }
  } else {
    return crudConfig.value.tableExpand!
  }
})

const tableColumns = computed(() => {
  const columns = { ...crudConfig.value.columns }
  for (const k in columns) {
    if (isString(columns[k])) {
      columns[k] = { label: columns[k] as string }
    }
  }
  return columns as Record<string, VTableColumn>
})

const searchConfig = computed(() => {
  if (!crudConfig.value.searchConfig) {
    return null
  }

  const conf = { ...crudConfig.value.searchConfig }

  conf.itemColAttrs = Object.assign({
    offset: 1,
    span: 7
  }, conf.itemColAttrs)

  conf.action = merge(
    {},
    {
      notResetFormAfterSubmited: true,
      colAttrs: { span: 24, style: 'text-align:center' },
      submitButton: { text: '搜索' }
    },
    conf.action,
  )
  const originalOnSubmit = conf.action.onSubmit
  conf.action.onSubmit = (data) => {
    search(data)
    originalOnSubmit?.(data)
  }
  const originalOnReset = conf.action.onReset
  conf.action.onReset = () => {
    search({})
    originalOnReset?.()
  }

  conf.items = transformItems(conf.items, crudConfig.value.columns)

  return conf as VFormConfig
})

const paginationConfig = computed(() => {
  const conf = Object.assign(
    {
      pageSizes: [10, 20, 30, 40, 50, 100],
      total: totalCount.value || 0,
      layout: 'total,sizes,prev,pager,next,jumper'
    },
    crudConfig.value.paginationAttrs
  )
  const originalOnSizeChange = conf['onSize-change']
  const originalOnCurrentChange = conf['onCurrent-change']
  conf['onSize-change'] = (val) => {
    refresh()
    originalOnSizeChange?.(val)
  }
  conf['onCurrent-change'] = (val) => {
    getTableData()
    originalOnCurrentChange?.(val)
  }
  return conf
})

const createButton = computed(() => {
  if (!crudConfig.value.handleCreate) {
    return null
  }

  const defaultAttrs = {
    name: '新增',
    attrs: { type: 'primary' } as const
  }
  return isFunction(crudConfig.value.handleCreate)
    ? defaultAttrs
    : merge(defaultAttrs, crudConfig.value.handleCreate)
})

</script>

<template>
  <div class="v-crud">
    <ElCard v-if="searchConfig" class="v-crud__search">
      <VForm :config="searchConfig" />
      <slot name="search-bar-bottom" />
    </ElCard>

    <slot name="body-top" />

    <ElCard class="v-crud__body">
      <slot name="menu-top" />

      <div class="body-menu">
        <div class="menu-left">
          <ElButton
            v-if="createButton"
            v-bind="createButton.attrs"
            @click="() => createAndUpdatePopupRef?.show()"
          >
            {{ createButton.name }}
          </ElButton>
          <slot name="menu-left" />
        </div>
        <div class="menu-right">
          <slot name="menu-right" />
          <ElIcon class="tool-icon" @click="refresh"><RefreshLeft /></ElIcon>
          <Setting :config="config" />
        </div>
      </div>

      <slot name="menu-bottom" />

      <ElTable
        :ref="setTableRef"
        :key="tableKey"
        :data="tableData"
        v-bind="tableAttrs"
      >
        <template #empty>
          <template v-if="!crudConfig.tableSlots?.empty">
            <template v-if="!isError">暂无数据</template>
            <ElButton v-else link type="danger" @click="refresh">
              点击刷新
            </ElButton>
          </template>
          <RenderFn v-else :component="crudConfig.tableSlots.empty" />
        </template>

        <template v-if="crudConfig.tableSlots?.append" #append>
          <RenderFn :component="crudConfig.tableSlots?.append" />
        </template>

        <ElTableColumn
          v-if="crudConfig.tableExpand"
          type="expand"
          v-bind="omit(tableExpand, 'render')"
        >
          <template #default="scope">
            <RenderFn :component="tableExpand.render" v-bind="scope" />
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-if="crudConfig.tableSelection"
          type="selection"
          v-bind="crudConfig.tableSelection === true ? {} : crudConfig.tableSelection"
        />

        <ElTableColumn
          v-if="crudConfig.tableIndex"
          type="index"
          v-bind="crudConfig.tableIndex === true ? {} : crudConfig.tableIndex"
        />

        <ElTableColumn
          v-for="(col, prop, index) in tableColumns"
          :key="index"
          :width="col.width"
          :label="col.label"
          :prop="prop"
          v-bind="col.attrs"
        >
          <template v-if="col.renderHeader" #header="scope">
            <RenderFn :component="col.renderHeader" v-bind="scope" />
          </template>
          <template v-if="col.renderContent" #default="scope">
            <RenderFn
              :component="col.renderContent"
              :value="scope.row[prop]"
              :dict="col.dicts ? col.dicts.find(d => d.value === scope.row[prop]) : undefined"
              v-bind="scope"
            />
          </template>
        </ElTableColumn>

        <VTableAction
          v-if="crudConfig.tableAction || crudConfig.handleDelete || crudConfig.handleUpdate"
          :config="crudConfig"
          :refresh="refresh"
          :toUpdate="(row: any) => createAndUpdatePopupRef?.show(row)"
        />
      </ElTable>
      
      <div class="body-footer">
        <slot name="footer-left" />
        <ElPagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          v-bind="paginationConfig"
        />
      </div>
    </ElCard>

    <CreateAndUpdatePopup
      v-if="crudConfig.handleCreate || crudConfig.handleUpdate"
      ref="createAndUpdatePopupRef"
      :config="crudConfig"
      :refresh="refresh"
    />
  </div>
</template>

<style lang="less" scoped>
:deep(.v-crud__body .el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}
:deep(.body-menu .menu-right .tool-icon) {
  font-size: 22px;
  color: #767676;
  cursor: pointer;
  margin-left: 10px;
}
.v-crud {
  display: flex;
  flex-direction: column;
  .v-crud__search {
    margin-bottom: 10px;
  }
  .v-crud__body {
    flex: 1 0;
    overflow-y: auto;
    .body-menu {
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      .menu-right {
        display: flex;
        align-items: flex-end;
      }
    }
    .el-table {
      flex: 1;
      overflow: auto;
    }
    .body-footer {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      .el-pagination {
        display: inline-flex;
        justify-content: flex-end;
      }
    }
    
  }
}
</style>