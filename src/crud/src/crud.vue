<script lang="ts" setup>
import { isRef, ref } from 'vue'
import {
  ElButton,
  ElCard,
  ElIcon,
  ElPagination,
  ElTable,
  ElTableColumn,
} from 'element-plus'
import { isFunction, omit } from 'lodash-es'
import { RefreshLeft } from '@element-plus/icons-vue'

import VTableAction from './table-action.vue'
import CreateAndUpdatePopup from './create-and-update-popup.vue'
import Setting from './setting.vue'

import { type ElTableInstance, _crudProps } from './crud'
import { useData } from './useData'
import { useCache } from './useCache'
import { useResolveConfig } from './useResolveConfig'

import { VForm } from '@/form'
import { RenderFn } from '@/utils/RenderFn'

const props = defineProps(_crudProps)
const { crudConfig } = useCache(props.config)

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
  tableData,
  isError,
  currentPage,
  pageSize,
  totalCount,
  getTableData,
  refresh,
  search,
} = useData(crudConfig)

const {
  tableAttrs,
  tableExpand,
  tableColumns,
  searchConfig,
  paginationConfig,
  createButton,
} = useResolveConfig({
  crudConfig,
  search,
  totalCount,
  getTableData,
  refresh,
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

      <ElTable :ref="setTableRef" :data="tableData" v-bind="tableAttrs">
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
          v-bind="
            crudConfig.tableSelection === true ? {} : crudConfig.tableSelection
          "
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
              :dict="
                col.dicts
                  ? col.dicts.find((d) => d.value === scope.row[prop])
                  : undefined
              "
              v-bind="scope"
            />
          </template>
        </ElTableColumn>

        <VTableAction
          v-if="
            crudConfig.tableAction ||
            crudConfig.handleDelete ||
            crudConfig.handleUpdate
          "
          :config="crudConfig"
          :refresh="refresh"
          :to-update="(row: any) => createAndUpdatePopupRef?.show(row)"
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
