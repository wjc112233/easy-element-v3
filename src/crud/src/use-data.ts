import {
  type ComputedRef,
  getCurrentInstance,
  onMounted,
  reactive,
  ref,
} from 'vue'
import { isArray } from 'lodash-es'
import { ElLoading } from 'element-plus'
import type { CrudConfig } from './crud'

export function useData<
  DataItem = Record<string, any>,
  Query = Record<string, any>
>(crudConfig: ComputedRef<CrudConfig<DataItem, Query>>) {
  const vm = getCurrentInstance()

  const tableData: Array<DataItem> = reactive([])
  const currentPage = ref(1)
  const totalPages = ref<number>(0)
  const totalCount = ref<number>(0)
  const pageSize = ref(crudConfig.value.paginationAttrs?.defaultPageSize ?? 10)
  const isError = ref(false)
  let query: any = {}

  const getTableData = async () => {
    const loading = ElLoading.service({
      lock: true,
      target: vm?.proxy?.$el.querySelector('.el-table'),
    })
    try {
      const res = await crudConfig.value.requestApi({
        pageNo: currentPage.value,
        pageSize: pageSize.value,
        ...query,
      } as any)

      if (isArray(res.data)) {
        tableData.splice(0, tableData.length, ...(res.data as any))
      } else {
        console.error('表格列表需要为一个数组，实际得到的数据为：', res.data)
      }

      totalPages.value = res.totalPages
      totalCount.value = res.count
    } catch {
      isError.value = true
      tableData.length = 0
    } finally {
      loading.close()
    }
  }

  const refresh = () => {
    getTableData()
  }

  const search = (val: Query) => {
    query = val
    getTableData()
  }

  onMounted(() => {
    if (crudConfig.value.immediateRequest !== false) {
      getTableData()
    }
  })

  return {
    tableData,
    isError,
    currentPage,
    pageSize,
    totalPages,
    totalCount,
    getTableData,
    refresh,
    search,
  }
}
